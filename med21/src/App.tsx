/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { trackEvent, AnalyticsEvents } from './services/analytics';
import {
  X,
  CalendarClock,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { checkEnbdpayStatus } from './services/enbdpay';
import NotFoundPage from './components/NotFoundPage';

import MainHeader from './components/MainHeader';
import NavigationMenu from './components/NavigationMenu';
import CartDrawer from './components/CartDrawer';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const VendorDashboard = lazy(() => import('./components/VendorDashboard'));
import EnquiryModal from './components/EnquiryModal';
import RentalBookingModal from './components/RentalBookingModal';
import SocialProofPopup from './components/SocialProofPopup';
import ErrorBoundary from './components/ErrorBoundary';
import SafeImage from './components/SafeImage';
import Footer from './components/Footer';
import { formatAedWhole } from './utils/money';

import HomePage from './components/HomePage';
import ServicesPage from './components/ServicesPage';
import LabTestsPage from './components/LabTestsPage';
import ProductsPage from './components/ProductsPage';
import SearchResultsPage from './components/SearchResultsPage';
import OtherServicesPage from './components/OtherServicesPage';
import HealthPackagesPage from './components/HealthPackagesPage';
import OffersPage from './components/OffersPage';
import ProvidersPage from './components/ProvidersPage';
import SupportPage from './components/SupportPage';
import LegalPages from './components/LegalPages';
import AboutPage from './components/AboutPage';

import { useAppState } from './hooks/useAppState';
import {
  DEFAULT_SERVICE_ROUTE,
  DEFAULT_LAB_TESTS_ROUTE,
  DEFAULT_PRODUCT_ROUTE,
  LAB_TESTS_AT_HOME_ROUTE_PREFIX,
} from './hooks/useAppState';

import { api } from './lib/api';
import {
  SERVICE_CATEGORIES,
  PRODUCTS,
  HEALTHCARE_SERVICES,
  resolveHealthcareServiceImage,
  DEFAULT_HEALTHCARE_SERVICE_IMAGE,
} from './data';

export default function AppWrapper() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/services" element={<Navigate to={`/services/${DEFAULT_SERVICE_ROUTE}`} replace />} />
          <Route path="/services/lab-tests-at-home" element={<Navigate to={`${LAB_TESTS_AT_HOME_ROUTE_PREFIX}/${DEFAULT_LAB_TESTS_ROUTE}`} replace />} />
          <Route path="/services/lab-tests-at-home/:labCategorySlug" element={<MainApp />} />
          <Route path="/services/:serviceSlug" element={<MainApp />} />
          <Route path="/products" element={<Navigate to={`/products/${DEFAULT_PRODUCT_ROUTE}`} replace />} />
          <Route path="/products/:productSlug" element={<MainApp />} />
          <Route path="/payment/return" element={<PaymentReturnPage />} />
          <Route path="/admin" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-medical-green border-t-transparent rounded-full" /></div>}><AdminDashboardApp /></Suspense>} />
          <Route path="/vendor" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-medical-green border-t-transparent rounded-full" /></div>}><VendorDashboardApp /></Suspense>} />
          <Route path="*" element={<NotFoundPageWrapper />} />
        </Routes>
      </Router>
      <Toaster
        position="bottom-left"
        toastOptions={{
          duration: 2000,
          style: {
            borderRadius: '16px',
            padding: '14px 16px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#0f172a',
            color: '#fff',
            boxShadow: '0 20px 35px rgba(15, 23, 42, 0.22)',
          },
          success: {
            style: {
              background: '#0f766e',
            },
          },
          error: {
            style: {
              background: '#b91c1c',
            },
          },
        }}
      />
    </>
  );
}

function NotFoundPageWrapper() {
  const navigate = useNavigate();
  return <NotFoundPage onGoHome={() => navigate('/')} />;
}

function AdminDashboardApp() {
  const [db, setDb] = useState({
    categories: SERVICE_CATEGORIES as any[],
    products: PRODUCTS as any[],
    services: HEALTHCARE_SERVICES as any[]
  });
  const triggerToast = (msg: string) => {
    toast.success(msg);
  };

  const fetchDb = useCallback(async () => {
    try {
      const [catRes, prodRes, srvRes] = await Promise.all([
        api.get<any[]>('/api/categories'),
        api.get<any[]>('/api/products'),
        api.get<any[]>('/api/services/all'),
      ]);

      if (catRes && catRes.length > 0) setDb(prev => ({ ...prev, categories: catRes }));
      if (prodRes && prodRes.length > 0) setDb(prev => ({ ...prev, products: prodRes }));
      if (srvRes && srvRes.length > 0) {
        const servicesWithLocalImages = srvRes.map(resolveHealthcareServiceImage);
        setDb(prev => ({ ...prev, services: servicesWithLocalImages }));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDb();
  }, [fetchDb]);

  return (
    <>
      <AdminDashboard db={db} onRefresh={fetchDb} triggerToast={triggerToast} />
    </>
  );
}

function VendorDashboardApp() {
  const triggerToast = (msg: string) => {
    toast.success(msg);
  };

  return (
    <>
      <VendorDashboard triggerToast={triggerToast} />
    </>
  );
}

function PaymentReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');
  const [syncedBookingId, setSyncedBookingId] = useState('');
  const [liveStatus, setLiveStatus] = useState('');
  const params = new URLSearchParams(location.search);
  const status = params.get('responseStatus') || params.get('status') || 'PROCESSING';
  const appUtrParam = params.get('appUtr') || '';
  const transactionUtrParam = params.get('transactionUtr') || '';
  const bookingIdParam = params.get('bookingId') || '';
  const appUtr = appUtrParam || transactionUtrParam || params.get('orderId') || 'Pending reference';
  const effectiveStatus = liveStatus || status;
  const normalizedStatus = effectiveStatus.toUpperCase();
  const isSuccess = ['CAPTURED', 'AUTHORIZED', 'PROCESSED', 'SUCCESS'].includes(normalizedStatus);
  const isFailure = ['FAILED', 'DECLINED', 'REJECTED', 'ERROR', 'AUTHORIZATION_DECLINED'].includes(normalizedStatus);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isSuccess) {
      trackEvent(AnalyticsEvents.PAYMENT_COMPLETED, { bookingId: bookingIdParam, status: normalizedStatus });
    } else if (isFailure) {
      trackEvent(AnalyticsEvents.PAYMENT_FAILED, { bookingId: bookingIdParam, status: normalizedStatus });
    }
  }, [isSuccess, isFailure, bookingIdParam, normalizedStatus]);

  useEffect(() => {
    if (!appUtrParam && !transactionUtrParam) return;

    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 6;
    const retryDelay = 5000;

    const pollStatus = async () => {
      setSyncState('syncing');
      try {
        const result = await checkEnbdpayStatus({
          appUtr: appUtrParam || undefined,
          transactionUtr: transactionUtrParam || undefined,
          responseStatus: status || undefined,
          bookingId: bookingIdParam || undefined,
        });
        if (cancelled) return;

        const resolvedStatus = (result.responseStatus || result.status || '').toUpperCase();
        setLiveStatus(resolvedStatus);
        setSyncedBookingId(result.booking?.id || '');

        const isTerminal = ['CAPTURED', 'AUTHORIZED', 'PROCESSED', 'SUCCESS', 'FAILED', 'DECLINED', 'REJECTED', 'ERROR', 'CANCELLED', 'CANCELED', 'VOIDED', 'AUTHORIZATION_DECLINED'].includes(resolvedStatus);

        if (isTerminal || retryCount >= maxRetries) {
          setSyncState('synced');
        } else {
          retryCount++;
          setSyncState('syncing');
          pollTimeoutRef.current = setTimeout(pollStatus, retryDelay);
        }
      } catch {
        if (cancelled) return;
        if (retryCount < maxRetries) {
          retryCount++;
          pollTimeoutRef.current = setTimeout(pollStatus, retryDelay);
        } else {
          setSyncState('failed');
        }
      }
    };

    pollStatus();

    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [appUtrParam, transactionUtrParam]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-6 text-center space-y-5">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
          isSuccess ? 'bg-emerald-50 text-medical-green' : 'bg-amber-50 text-amber-600'
        }`}>
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-xl font-black text-blue-950">
            {isSuccess ? 'Payment Received' : isFailure ? 'Payment Declined' : 'Payment Status Pending'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            ENBDpay returned status <span className="font-bold text-slate-800">{effectiveStatus}</span>.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider">Reference</span>
          <p className="text-slate-900 font-black mt-1 break-all">{appUtr}</p>
          {syncedBookingId && (
            <p className={`font-bold mt-2 ${isSuccess ? 'text-emerald-700' : 'text-amber-700'}`}>
              Booking {syncedBookingId} — {isSuccess ? 'payment confirmed' : 'payment ' + (isFailure ? 'failed' : 'pending')}
            </p>
          )}
          {syncState === 'syncing' && (
            <p className="text-slate-500 font-semibold mt-2">Updating booking payment status...</p>
          )}
          {syncState === 'failed' && (
            <p className="text-amber-700 font-semibold mt-2">Unable to sync payment status with booking. An admin can manually update it.</p>
          )}
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs tracking-wider transition-all cursor-pointer"
        >
          RETURN TO MEDZIVA
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const app = useAppState();

  // ── Render helpers for service details modal (used in JSX below) ──────

  const getVisibleServiceDetailAttributes = (srv: any) =>
    [
      ['Key Ingredients', app.getServiceAttributeValue(srv, 'Key Ingredients')],
      ['Clinical Benefits', app.getServiceAttributeValue(srv, 'Clinical Benefits')],
      ['Disclaimer', app.getServiceAttributeValue(srv, 'Disclaimer')],
    ].filter(([, value]) => value != null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all selection:bg-teal-500 selection:text-white">

      {/* Interactive Main medical branding header */}
      <MainHeader
          cartCount={app.cartTotalItems}
          onCartOpen={() => app.setIsCartOpen(true)}
          onBookingOpen={() => {
          if (!app.loggedInUser) {
            app.triggerToast('Please log in with your customer account first to proceed with booking.');
            app.setIsAuthOpen(true);
            return;
          }
          app.setPreselectedServiceTitle('');
          app.setPreselectedPrice(0);
          app.setIsBookingOpen(true);
        }}
        onAuthOpen={() => app.setIsAuthOpen(true)}
        onProfileOpen={() => app.setIsProfileOpen(true)}
        searchQuery={app.searchQuery}
        onSearchQueryChange={app.setSearchQuery}
        onSearchSubmit={app.handleGlobalSearch}
        searchHistory={app.searchHistory}
        onClearSearchHistory={() => {
          app.setSearchHistory([]);
          localStorage.removeItem('medziva_search_history');
          localStorage.removeItem('medziva_search_query');
        }}
        onTabChange={app.handleTabChange}
        activeTab={app.activeTab}
        activeSectionId={app.activeSectionId}
        loggedInUser={app.loggedInUser}
        onLogout={app.handleLogout}
      />

      {/* 3. Horizontal Navigation Menu bar */}
      <NavigationMenu
        activeTab={app.activeTab}
        activeSectionId={app.activeSectionId}
        onTabChange={app.handleTabChange}
      />

      {/* 3.5 Service Category Navigation Bar + Services content */}
      {app.activeTab === 'services' && (
        <ServicesPage
          activeSectionId={app.activeSectionId}
          currentServiceRoute={app.currentServiceRoute}
          handleTabChange={app.handleTabChange}
          setServiceDetails={app.setServiceDetails}
          handleAddToCart={app.handleAddToCart}
          triggerServiceBooking={app.triggerServiceBooking}
          triggerServiceEnquiry={app.triggerServiceEnquiry}
          nursingServices={app.nursingServices}
          longTermServices={app.longTermServices}
          physioServices={app.physioServices}
          doctorServices={app.doctorServices}
          speechServices={app.speechServices}
          occupationalServices={app.occupationalServices}
          ivServices={app.ivServices}
        />
      )}

      {/* Lab Tests Category Navigation Bar + content */}
      {app.activeTab === 'lab-tests' && (
        <LabTestsPage
          activeSectionId={app.activeSectionId}
          currentLabTestsRoute={app.currentLabTestsRoute}
          currentLabTestsSectionId={app.currentLabTestsSectionId}
          handleTabChange={app.handleTabChange}
          handleAddToCart={app.handleAddToCart}
          triggerServiceBooking={app.triggerServiceBooking}
          displayedLabServices={app.displayedLabServices}
          customLabSearch={app.customLabSearch}
          setCustomLabSearch={app.setCustomLabSearch}
          labTestsAtHomeSearch={app.labTestsAtHomeSearch}
          setLabTestsAtHomeSearch={app.setLabTestsAtHomeSearch}
          cart={app.cart}
          getVisibleLabAttributes={app.getVisibleLabAttributes}
        />
      )}

      {/* 4. Display Core layouts based on dynamic state ActiveTab */}
      <main className="flex-grow">
        <ErrorBoundary>

        {app.activeTab === 'search-results' && (
          <SearchResultsPage
            searchQuery={app.searchQuery}
            setSearchQuery={app.setSearchQuery}
            setActiveTab={app.setActiveTab}
            searchResults={app.searchResults}
            cart={app.cart}
            handleAddToCart={app.handleAddToCart}
            triggerServiceBooking={app.triggerServiceBooking}
            triggerServiceEnquiry={app.triggerServiceEnquiry}
            setServiceDetails={app.setServiceDetails}
            hasExtraDetails={app.hasExtraDetails}
          />
        )}

        {app.activeTab === 'home' && (
          <HomePage
            onTabChange={app.handleTabChange}
            triggerServiceBooking={app.triggerServiceBooking}
            triggerServiceEnquiry={app.triggerServiceEnquiry}
            handleAddToCart={app.handleAddToCart}
            setServiceDetails={app.setServiceDetails}
            triggerRentalBooking={app.triggerRentalBooking}
            triggerCustomServiceRequest={app.triggerCustomServiceRequest}
            db={app.db}
            homeHealthcareCategories={app.homeHealthcareCategories}
            homeHealthcareServices={app.homeHealthcareServices}
          />
        )}

        {/* Dedicated view: PRODUCTS eCommerce Page */}
        {app.activeTab === 'products' && app.currentProductRoute && (
          <ProductsPage
            currentProductRoute={app.currentProductRoute}
            setSearchQuery={app.setSearchQuery}
            searchQuery={app.searchQuery}
            displayedProducts={app.displayedProducts}
            handleAddToCart={app.handleAddToCart}
            triggerRentalBooking={app.triggerRentalBooking}
          />
        )}

        {/* Dedicated view: HEALTH PACKAGES screen details */}
        {app.activeTab === 'health-packages' && (
          <HealthPackagesPage
            triggerServiceBooking={app.triggerServiceBooking}
          />
        )}

        {/* Dedicated view: WELLNESS Page */}
        {app.activeTab === 'wellness' && (
          <OtherServicesPage
            activeSectionId={app.activeSectionId}
            handleTabChange={app.handleTabChange}
            triggerServiceEnquiry={app.triggerServiceEnquiry}
          />
        )}

        {/* Dedicated view: OFFERS Page */}
        {app.activeTab === 'offers' && (
          <OffersPage
            copiedCoupon={app.copiedCoupon}
            copyCouponCode={app.copyCouponCode}
          />
        )}

        {/* Dedicated view: PROVIDERS Sign Up */}
        {app.activeTab === 'providers' && (
          <ProvidersPage
            providerApplied={app.providerApplied}
            setProviderApplied={app.setProviderApplied}
            providerName={app.providerName}
            setProviderName={app.setProviderName}
            providerPhone={app.providerPhone}
            setProviderPhone={app.setProviderPhone}
            providerEmail={app.providerEmail}
            setProviderEmail={app.setProviderEmail}
            providerSpecializations={app.providerSpecializations}
            setProviderSpecializations={app.setProviderSpecializations}
            triggerToast={app.triggerToast}
          />
        )}

        {/* Dedicated view: HELP & SUPPORT FAQs page */}
        {app.activeTab === 'support' && (
          <SupportPage
            supportSubmitted={app.supportSubmitted}
            setSupportSubmitted={app.setSupportSubmitted}
            supportName={app.supportName}
            setSupportName={app.setSupportName}
            supportEmail={app.supportEmail}
            setSupportEmail={app.setSupportEmail}
            supportMessage={app.supportMessage}
            setSupportMessage={app.setSupportMessage}
            triggerToast={app.triggerToast}
          />
        )}

        {/* Legal pages: privacy, terms, about */}
        {(app.activeTab === 'privacy' || app.activeTab === 'terms') && (
          <LegalPages activeTab={app.activeTab} />
        )}
        {app.activeTab === 'about' && (
          <AboutPage />
        )}

        <AnimatePresence>
          {app.serviceDetails && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm">
              <motion.div
                key={app.serviceDetails.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => app.setServiceDetails(null)}
                  className="absolute right-3 top-3 z-20 rounded-full bg-white p-2 text-slate-600 shadow-lg hover:text-slate-900 cursor-pointer"
                  aria-label="Close service details"
                >
                  <X className="h-5 w-5" />
                </button>

                {app.serviceDetails.image && (
                <div className="h-44 shrink-0 bg-slate-100 sm:h-52">
                  <SafeImage
                    src={app.getServiceImage(app.serviceDetails)}
                    alt={app.serviceDetails.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    fallbackSrc={DEFAULT_HEALTHCARE_SERVICE_IMAGE}
                  />
                </div>
                )}

                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
                  <div>
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-medical-green">
                      {app.serviceDetails.category.replaceAll('-', ' ')}
                    </span>
                    <h2 className="mt-3 text-xl font-black leading-tight text-blue-950 sm:text-2xl">
                      {app.serviceDetails.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {app.serviceDetails.fullDescription || app.getServiceAttributeValue(app.serviceDetails, 'Inclusions') || app.serviceDetails.description}
                    </p>
                  </div>

                  {app.serviceDetails.inclusions?.length ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Included</h3>
                      <div className="space-y-2">
                        {app.serviceDetails.inclusions.map((item) => (
                          <div key={item} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-medical-green" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {getVisibleServiceDetailAttributes(app.serviceDetails).length ? (
                    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      {getVisibleServiceDetailAttributes(app.serviceDetails).map(([label, value]) => (
                        <div key={label}>
                          <h3 className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">{label}</h3>
                          <p className="whitespace-pre-line text-xs leading-5 text-slate-600">{value != null ? String(value) : '—'}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Starting Price</p>
                      <p className="text-2xl font-black text-medical-green">
                        {app.serviceDetails.price > 0 ? `FROM AED ${formatAedWhole(app.serviceDetails.price)}` : 'Enquiry Only'}
                      </p>
                    </div>
                    {app.serviceDetails.bookingNotice && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-medical-green" />
                        {app.serviceDetails.bookingNotice}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => app.setServiceDetails(null)}
                      className="w-full rounded-xl border-2 border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:w-32 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = app.serviceDetails;
                        app.setServiceDetails(null);
                        if (selected!.enquiryOnly || selected!.price <= 0) {
                          app.triggerServiceEnquiry(selected!.title);
                        } else {
                          app.triggerServiceBooking(selected!.title, selected!.price, selected!.category === 'lab-tests-at-home');
                        }
                      }}
                      className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-medical-green px-5 py-3 text-xs font-extrabold text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      <CalendarClock className="h-4 w-4" />
                      {app.serviceDetails.enquiryOnly || app.serviceDetails.price <= 0 ? 'ENQUIRE' : 'CONFIRM & BOOK'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* Mobile Bottom Tab Bar - Only visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 py-2 safe-area-bottom bottom-nav-bar">
        <div className="grid grid-cols-5 items-center gap-1">
          <button
            onClick={() => app.handleTabChange('home')}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              app.activeTab === 'home' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {app.activeTab === 'home' && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">&#127968;</span>
            <span className="relative z-10 text-[10px] font-bold">Home</span>
          </button>
          <button
            onClick={() => {
              app.handleTabChange('services');
              window.setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }, 0);
            }}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              app.activeTab === 'services' || app.activeTab === 'lab-tests' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {(app.activeTab === 'services' || app.activeTab === 'lab-tests') && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">&#129658;</span>
            <span className="relative z-10 text-[10px] font-bold">Services</span>
          </button>
          <button
            onClick={() => {
              app.handleTabChange('products');
              window.setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }, 0);
            }}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              app.activeTab === 'products' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {app.activeTab === 'products' && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">&#128722;</span>
            <span className="relative z-10 text-[10px] font-bold">Shop</span>
          </button>
          <button
            onClick={() => app.handleTabChange('wellness')}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              app.activeTab === 'wellness' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {app.activeTab === 'wellness' && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">&#10084;&#65039;</span>
            <span className="relative z-10 text-[10px] font-bold">Other Services</span>
          </button>
          <button
            onClick={() => app.handleTabChange('offers')}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              app.activeTab === 'offers' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {app.activeTab === 'offers' && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">&#127873;</span>
            <span className="relative z-10 text-[10px] font-bold">Offers</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      <a
          href="https://wa.me/971559510794"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 md:bottom-8 right-4 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>

      {/* 5. Deep Blue Healthcare Footer */}
      <Footer onNavigationClick={app.handleTabChange} />

      {/* Social proof popup */}
      <SocialProofPopup services={app.db.services.filter((s: any) => s.category !== 'lab-tests')} products={app.db.products} cartOpen={app.isCartOpen} />

      {/* 6. Sliding Side Cart Drawer */}
      <CartDrawer
        isOpen={app.isCartOpen}
        onClose={() => app.setIsCartOpen(false)}
        cartItems={app.cart}
        onUpdateQty={app.handleUpdateCartQty}
        onRemoveItem={app.handleRemoveCartItem}
        onClearCart={app.handleClearCart}
        loggedInUser={app.loggedInUser}
        loggedInUserEmail={app.loggedInUserEmail}
        loggedInUserPhone={app.loggedInUserPhone}
        loggedInUserAddress={app.loggedInUserAddress}
        onAuthOpen={() => app.setIsAuthOpen(true)}
      />

      {/* 7. Interactive Scheduling Wizard dialog */}
      <BookingModal
        isOpen={app.isBookingOpen}
        onClose={() => {
          app.setIsBookingOpen(false);
          app.setPreselectedServiceTitle('');
          app.setPreselectedPrice(0);
          app.setBookingIsLabTest(false);
        }}
        preselectedServiceTitle={app.preselectedServiceTitle}
        preselectedPrice={app.preselectedPrice}
        isLabTest={app.bookingIsLabTest}
        loggedInUser={app.loggedInUser}
        loggedInUserEmail={app.loggedInUserEmail}
        loggedInUserPhone={app.loggedInUserPhone}
        onSuccessToast={app.triggerToast}
        onBookingSuccess={() => {
          app.setIsBookingOpen(false);
          app.setPreselectedServiceTitle('');
          app.setPreselectedPrice(0);
          app.setBookingIsLabTest(false);
          app.setShowBookingSuccess(true);
        }}
      />

      {/* 7.5 Interactive Hospital Service Enquiry dialog */}
      <EnquiryModal
        isOpen={app.isEnquiryOpen}
        onClose={() => {
          app.setIsEnquiryOpen(false);
          app.setPreselectedEnquiryServiceTitle('');
        }}
        preselectedServiceTitle={app.preselectedEnquiryServiceTitle}
        onSuccessToast={app.triggerToast}
        loggedInUser={app.loggedInUser}
        loggedInUserEmail={app.loggedInUserEmail}
        loggedInUserPhone={app.loggedInUserPhone}
      />

      {/* 8. HIPAA Secured User Authentication dialog */}
      <AuthModal
        isOpen={app.isAuthOpen}
        onClose={() => app.setIsAuthOpen(false)}
        onSuccess={(username, email) => {
          app.setLoggedInUser(username);
          app.setLoggedInUserEmail(email);
          app.setIsAuthOpen(false);
          app.triggerToast(`Profile successfully loaded: Welcome back, ${username}!`);
        }}
      />

      {/* 8.5 Personal Patient Profile modal */}
      <ProfileModal
        isOpen={app.isProfileOpen}
        onClose={() => app.setIsProfileOpen(false)}
        fullName={app.loggedInUser || ''}
        email={app.loggedInUserEmail}
        phone={app.loggedInUserPhone}
        address={app.loggedInUserAddress}
        onSave={(updatedName, updatedEmail, updatedPhone, updatedAddress) => {
          app.setLoggedInUser(updatedName);
          app.setLoggedInUserEmail(updatedEmail);
          app.setLoggedInUserPhone(updatedPhone);
          app.setLoggedInUserAddress(updatedAddress);
        }}
        onSuccessToast={app.triggerToast}
      />

      {/* 9. Rental Equipment Booking modal */}
      <RentalBookingModal
        isOpen={app.isRentalOpen}
        onClose={() => { app.setIsRentalOpen(false); app.setSelectedRentalProduct(null); }}
        product={app.selectedRentalProduct}
        onSuccessToast={app.triggerToast}
        loggedInUser={app.loggedInUser}
        loggedInUserEmail={app.loggedInUserEmail}
        loggedInUserPhone={app.loggedInUserPhone}
        loggedInUserAddress={app.loggedInUserAddress}
      />

    </div>
  );
}
