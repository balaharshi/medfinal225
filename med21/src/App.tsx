/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, lazy, Suspense, type SyntheticEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { trackPageView, trackEvent, AnalyticsEvents } from './services/analytics';
import { 
  Search, 
  Phone, 
  X, 
  CalendarClock, 
  CheckCircle2, 
  Home, 
  Activity, 
  Beaker, 
  UserCircle, 
  ShoppingCart, 
  HelpCircle, 
  Check, 
  ChevronRight, 
  Copy,
  Clock,
  MessageCircle,
  Eye,
  Stethoscope,
  Shield,
  Globe,
  HeartPulse,
  MapPin,
  Mail
} from 'lucide-react';
import { useSEO } from './hooks/useSEO';
import { api } from './lib/api';
import NotFoundPage from './components/NotFoundPage';

const SITE_DEFAULT_DESCRIPTION = 'Premium healthcare marketplace in Dubai — book home healthcare, lab tests, IV therapy, and medical equipment rental from DHA compliant providers.';

// Static Data and Types
import {
  DEFAULT_HEALTHCARE_SERVICE_IMAGE,
  SERVICE_CATEGORIES,
  PRODUCTS,
  HEALTHCARE_SERVICES,
  DUBAI_LOCATIONS,
  resolveHealthcareServiceImage,
} from './data';
import { ActiveTab, CartItem, Product, HealthcareService, ServiceCategory } from './types';
import { LAB_TESTS_AT_HOME_CATEGORIES } from '../../shared/labTestsAtHomeCatalog.js';

// UI Components
import MainHeader from './components/MainHeader';
import NavigationMenu from './components/NavigationMenu';
import ServicesSection from './components/ServicesSection';
import ProductsSection from './components/ProductsSection';
import PromotionalBanners from './components/PromotionalBanners';
import TrustFeatures from './components/TrustFeatures';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const VendorDashboard = lazy(() => import('./components/VendorDashboard'));
import EnquiryModal from './components/EnquiryModal';
import RentalBookingModal from './components/RentalBookingModal';
import PhoneInput from './components/PhoneInput';
import medicalTourismImg from './assets/images/services/medical-tourism.jpg';
import shippingCrewImg from './assets/images/services/shipping-crew.jpg';
import ErrorBoundary from './components/ErrorBoundary';
import { subscribeToNotifications } from './services/pusherClient';
import { checkEnbdpayStatus } from './services/enbdpay';
import { FAQ_SECTIONS, PRIVACY_SECTIONS, TERMS_SECTIONS } from './content/legalContent';
import { formatAedWhole } from './utils/money';

const SERVICE_ROUTE_BY_SECTION_ID: Record<string, string> = {
  'home-healthcare-section': 'nursing-care-at-home',
  'long-term-care-section': 'long-term-specialized-care',
  'physiotherapy-section': 'physiotherapy-at-home',
  'doctor-on-call-section': 'doctor-on-call',
  'speech-therapy-section': 'speech-and-language-therapy',
  'occupational-therapy-section': 'occupational-therapy',
  'iv-therapy-section': 'iv-therapy',
};

const SERVICE_SECTION_ID_BY_ROUTE: Record<string, string> = {
  'nursing-care-at-home': 'home-healthcare-section',
  'long-term-specialized-care': 'long-term-care-section',
  'physiotherapy-at-home': 'physiotherapy-section',
  'doctor-on-call': 'doctor-on-call-section',
  'speech-and-language-therapy': 'speech-therapy-section',
  'occupational-therapy': 'occupational-therapy-section',
  'iv-therapy': 'iv-therapy-section',
};

const DEFAULT_SERVICE_ROUTE = 'nursing-care-at-home';

const LAB_TESTS_AT_HOME_ROUTE_PREFIX = '/services/lab-tests-at-home';
const LAB_TESTS_SECTION_ID_BY_ROUTE: Record<string, string> = LAB_TESTS_AT_HOME_CATEGORIES.reduce((acc, category) => {
  acc[category.slug] = `${category.slug}-section`;
  return acc;
}, {} as Record<string, string>);
const LAB_TESTS_ROUTE_BY_SECTION_ID: Record<string, string> = LAB_TESTS_AT_HOME_CATEGORIES.reduce((acc, category) => {
  acc[`${category.slug}-section`] = category.slug;
  return acc;
}, {} as Record<string, string>);
const LAB_TESTS_PAGE_COPY: Record<string, { title: string; description: string }> = LAB_TESTS_AT_HOME_CATEGORIES.reduce((acc, category) => {
  acc[category.slug] = {
    title: category.title,
    description:
      category.slug === 'routine-blood-tests'
        ? 'Convenient home-based blood sample collection for routine health checks, diagnostic testing, and regular monitoring with reliable laboratory support.'
        : category.slug === 'preventive-health-packages'
        ? 'Comprehensive health screening packages designed for early detection, wellness monitoring, and proactive management of your overall health.'
        : category.slug === 'mens-health-packages'
        ? "Specialized health screening packages designed to support men’s wellness, including preventive care, early detection, and monitoring of key health conditions."
        : category.slug === 'womens-health-packages'
        ? "Comprehensive health screening packages designed to support women’s wellness, preventive care, early detection, and monitoring of key health needs."
        : category.slug === 'std-sexual-health'
        ? 'Confidential testing and screening services for sexually transmitted infections, supporting early detection, prevention, and informed health management.'
        : category.slug === 'specialized-diagnostic-tests'
        ? 'Advanced diagnostic testing services for accurate detection, specialized health assessments, and personalized care planning.'
        : category.slug === 'genetic-testing'
        ? 'Advanced genetic testing services to assess inherited conditions, health risks, and personalized insights for informed healthcare decisions.'
        : '12 hours prior booking slots.',
  };
  return acc;
}, {} as Record<string, { title: string; description: string }>);
const DEFAULT_LAB_TESTS_ROUTE = 'routine-blood-tests';

const HOME_ADDITIONAL_HEALTHCARE_CATEGORIES = [
  {
    id: 'cat-long-term-care',
    title: 'Long-Term / Specialized Care',
    slug: 'long-term-care',
    description: 'Dedicated nursing support at home for long-term and specialized care needs, including ongoing monitoring, chronic condition management, and personalised patient assistance.',
  },
  {
    id: 'cat-rent-medical-equipments',
    title: 'Rent Medical Equipment',
    slug: 'devices-for-rent',
    description: 'Rent certified medical equipment with weekly and monthly options for home healthcare support.',
  },
  {
    id: 'cat-iv-therapy',
    title: 'IV Therapy',
    slug: 'iv-therapy',
    description: 'Professional IV therapy administered at home under medical guidance, offering convenient access to prescribed treatments, hydration support, and wellness infusions.',
  },
  ...LAB_TESTS_AT_HOME_CATEGORIES.map((category) => ({
    id: `cat-lab-${category.slug}`,
    title: category.title,
    slug: category.slug,
    description: category.slug === 'routine-blood-tests'
      ? 'Convenient home-based blood sample collection for routine health checks, diagnostic testing, and regular monitoring with reliable laboratory support.'
      : category.slug === 'preventive-health-packages'
      ? 'Comprehensive health screening packages designed for early detection, wellness monitoring, and proactive management of your overall health.'
      : category.slug === 'mens-health-packages'
      ? "Specialised health screening packages designed to support men's wellness, including preventive care, early detection, and monitoring of key health conditions."
      : category.slug === 'womens-health-packages'
      ? "Comprehensive health screening packages designed to support women's wellness, preventive care, early detection, and monitoring of key health needs."
      : category.slug === 'std-sexual-health'
      ? 'Confidential testing and screening services for sexually transmitted infections, supporting early detection, prevention, and informed health management.'
      : category.slug === 'specialized-diagnostic-tests'
      ? 'Advanced diagnostic testing services for accurate detection, specialised health assessments, and personalised care planning.'
      : category.slug === 'genetic-testing'
      ? 'Advanced genetic testing services to assess inherited conditions, health risks, and personalised insights for informed healthcare decisions.'
      : 'Lab tests at home with 12 hours prior booking, available in Dubai and Sharjah.',
    image: undefined,
  })),
];

const PRODUCT_ROUTE_BY_SECTION_ID: Record<string, string> = {
  'rent-medical-equipments-section': 'rent-medical-equipments',
  'buy-medical-equipments-section': 'buy-medical-equipments',
  'supplements-section': 'supplements',
};

const PRODUCT_SECTION_ID_BY_ROUTE: Record<string, string> = {
  'rent-medical-equipments': 'rent-medical-equipments-section',
  'buy-medical-equipments': 'buy-medical-equipments-section',
  'supplements': 'supplements-section',
};

const PRODUCT_CATEGORY_BY_ROUTE: Record<string, string> = {
  'rent-medical-equipments': 'devices-for-rent',
  'buy-medical-equipments': 'buy-medical-equipments',
  'supplements': 'supplements',
};

const PRODUCT_PAGE_COPY: Record<string, { title: string; description: string }> = {
  'rent-medical-equipments': {
    title: 'Rent Medical Equipment',
    description: 'Weekly and monthly rental options with listed security deposits.',
  },
  'buy-medical-equipments': {
    title: 'Buy Medical Equipment',
    description: 'Order certified medical equipment and home healthcare accessories delivered across the UAE.',
  },
  supplements: {
    title: 'Supplements',
    description: 'Nutrition and wellness supplements available through the MedZiva product store.',
  },
};

const DEFAULT_PRODUCT_ROUTE = 'rent-medical-equipments';
const IV_THERAPY_ALLOWED_IDS = new Set([
  'srv-iv-skin-glow',
  'srv-iv-hair-skin-nail-care',
  'srv-iv-energy-weight-loss',
  'srv-iv-immune-hydration-drip',
  'srv-iv-antistress-relax',
  'srv-iv-gut-cleanse-acne-cure',
  'srv-iv-memory-boost',
  'srv-iv-surgery-recovery',
  'srv-iv-women-health-fertilty',
  'srv-iv-men-power-drip',
  'srv-iv-liver-detox-after-party',
  'srv-iv-nad-100',
  'srv-iv-nad-250',
  'srv-iv-nad-500',
]);

const addSpacesAroundSlashes = (value?: string) =>
  value?.replace(/\s*\/\s*/g, ' / ');

const addSpacesAroundOnePlusOne = (value?: string) =>
  value?.replace(/\s*\(1\+1\)\s*/g, ' (1+1) ');

const normalizeLongTermTextSpacing = (value?: string) =>
  addSpacesAroundOnePlusOne(addSpacesAroundSlashes(value))?.replace(/\s{2,}/g, ' ').trim();

const normalizeLongTermServiceSlashSpacing = (service: HealthcareService): HealthcareService => ({
  ...service,
  title: normalizeLongTermTextSpacing(service.title) || service.title,
  duration: normalizeLongTermTextSpacing(service.duration) || service.duration,
  shortDescription: normalizeLongTermTextSpacing(service.shortDescription),
  fullDescription: normalizeLongTermTextSpacing(service.fullDescription),
  description: normalizeLongTermTextSpacing(service.description) || service.description,
  preparationInstructions: normalizeLongTermTextSpacing(service.preparationInstructions),
  whoIsItFor: normalizeLongTermTextSpacing(service.whoIsItFor),
  availability: normalizeLongTermTextSpacing(service.availability),
  bookingNotice: normalizeLongTermTextSpacing(service.bookingNotice),
  remarks: normalizeLongTermTextSpacing(service.remarks),
  who: normalizeLongTermTextSpacing(service.who),
  prep: normalizeLongTermTextSpacing(service.prep),
  result: normalizeLongTermTextSpacing(service.result),
  inclusions: service.inclusions?.map((item) => normalizeLongTermTextSpacing(item) || item),
  attributes: Array.isArray(service.attributes)
    ? service.attributes.map((attribute) => ({
        ...attribute,
        label:
          typeof attribute.label === 'string'
            ? normalizeLongTermTextSpacing(attribute.label)
            : attribute.label,
        value:
          typeof attribute.value === 'string'
            ? normalizeLongTermTextSpacing(attribute.value)
            : attribute.value,
      }))
    : service.attributes,
});

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

  const fetchDb = async () => {
    try {
      const [catRes, prodRes, srvRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
        fetch('/api/services/all', {
          headers: localStorage.getItem('medziva_admin_token')
            ? { Authorization: `Bearer ${localStorage.getItem('medziva_admin_token')}` }
            : undefined,
          credentials: 'include',
        })
      ]);

      if (catRes.ok) {
        const categories = await catRes.json();
        if (categories.length > 0) setDb(prev => ({ ...prev, categories }));
      }
      if (prodRes.ok) {
        const products = await prodRes.json();
        if (products.length > 0) setDb(prev => ({ ...prev, products }));
      }
      if (srvRes.ok) {
        const services = await srvRes.json();
        const servicesWithLocalImages = services.map(resolveHealthcareServiceImage);
        if (servicesWithLocalImages.length > 0) setDb(prev => ({ ...prev, services: servicesWithLocalImages }));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  useEffect(() => {
    fetchDb();
  }, []);

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
          setTimeout(pollStatus, retryDelay);
        }
      } catch {
        if (cancelled) return;
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(pollStatus, retryDelay);
        } else {
          setSyncState('failed');
        }
      }
    };

    pollStatus();

    return () => {
      cancelled = true;
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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);
  const currentLabTestsRoute = location.pathname.startsWith(`${LAB_TESTS_AT_HOME_ROUTE_PREFIX}/`)
    ? location.pathname.split(`${LAB_TESTS_AT_HOME_ROUTE_PREFIX}/`)[1]?.split('/')[0] || null
    : null;
  const currentLabTestsSectionId = currentLabTestsRoute ? LAB_TESTS_SECTION_ID_BY_ROUTE[currentLabTestsRoute] || null : null;
  const currentServiceRoute = location.pathname.startsWith('/services/') && !location.pathname.startsWith(LAB_TESTS_AT_HOME_ROUTE_PREFIX)
    ? location.pathname.split('/services/')[1]?.split('/')[0] || null
    : null;
  const currentServiceSectionId = currentServiceRoute ? SERVICE_SECTION_ID_BY_ROUTE[currentServiceRoute] || null : null;
  const currentProductRoute = location.pathname.startsWith('/products/')
    ? location.pathname.split('/products/')[1]?.split('/')[0] || null
    : null;
  const currentProductSectionId = currentProductRoute ? PRODUCT_SECTION_ID_BY_ROUTE[currentProductRoute] || null : null;

  // Core Platform States
  const [activeTab, setActiveTab] = useState<ActiveTab>(currentLabTestsRoute ? 'lab-tests' : currentServiceRoute ? 'services' : currentProductRoute ? 'products' : 'home');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(currentLabTestsSectionId || currentServiceSectionId || currentProductSectionId);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('medziva_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState(() =>
    typeof window !== 'undefined' ? String(localStorage.getItem('medziva_search_query') || '') : ''
  );
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedHistory = JSON.parse(localStorage.getItem('medziva_search_history') || '[]');
      return Array.isArray(savedHistory)
        ? savedHistory.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  });
  const [customLabSearch, setCustomLabSearch] = useState('');
  const [labTestsAtHomeSearch, setLabTestsAtHomeSearch] = useState('');

  useEffect(() => {
    if (searchQuery) {
      localStorage.setItem('medziva_search_query', searchQuery);
    } else {
      localStorage.removeItem('medziva_search_query');
    }
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('medziva_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('medziva_cart', JSON.stringify(cart));
  }, [cart]);

  // Drawer & Overlay Triggers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [isRentalOpen, setIsRentalOpen] = useState(false);
  const [selectedRentalProduct, setSelectedRentalProduct] = useState<any>(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  // Auto-redirect to My Bookings after 3 seconds
  useEffect(() => {
    if (showBookingSuccess) {
      const timer = setTimeout(() => {
        setShowBookingSuccess(false);
        setIsProfileOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBookingSuccess]);

  // Prefilled parameters for home visiting scheduler selection
  const [preselectedServiceTitle, setPreselectedServiceTitle] = useState('');
  const [preselectedPrice, setPreselectedPrice] = useState(0);
  const [bookingIsLabTest, setBookingIsLabTest] = useState(false);
  const [preselectedEnquiryServiceTitle, setPreselectedEnquiryServiceTitle] = useState('');

  // Authenticated profile state is kept in memory so personal data is not exposed in browser storage.
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string>('');
  const [loggedInUserPhone, setLoggedInUserPhone] = useState<string>('');
  const [loggedInUserAddress, setLoggedInUserAddress] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (!loggedInUserEmail) return undefined;

    return subscribeToNotifications((payload) => {
      const message = String(payload.message || 'You have a new MedZiva notification.');
      toast.success(message);
    });
  }, [loggedInUserEmail]);


  useEffect(() => {
    localStorage.removeItem('medziva_user_name');
    localStorage.removeItem('medziva_user_email');
    localStorage.removeItem('medziva_user_phone');
    localStorage.removeItem('medziva_user_address');
  }, []);

  useEffect(() => {
    const restoreCustomerSession = async () => {
      try {
        const token = localStorage.getItem('medziva_user_token');
        if (!token) return;
        const data = await api.get<{ user?: { role?: string; fullName?: string; email?: string; phone?: string; address?: string } }>('/api/auth/session');
        if (data?.user?.role !== 'customer') return;

        setLoggedInUser(data.user.fullName || '');
        setLoggedInUserEmail(data.user.email || '');
        setLoggedInUserPhone(data.user.phone || '');
        setLoggedInUserAddress(data.user.address || '');
      } catch {
        localStorage.removeItem('medziva_user_token');
      }
    };

    restoreCustomerSession();
  }, []);

  // Success Feedback state variables
  const [providerApplied, setProviderApplied] = useState(false);
  const [providerSpecializations, setProviderSpecializations] = useState<string[]>([]);
  const [providerName, setProviderName] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [serviceDetails, setServiceDetails] = useState<HealthcareService | null>(null);

  const triggerToast = (msg: string) => {
    toast.success(msg);
  };

  // Toast / Copy notification states
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Reactive ERP states loaded from back-end
  const [db, setDb] = useState<{
    categories: any[];
    products: any[];
    services: any[];
  }>({
    categories: SERVICE_CATEGORIES,
    products: PRODUCTS,
    services: HEALTHCARE_SERVICES
  });

  const fetchDb = async () => {
    try {
      const [catRes, srvRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/services'),
      ]);

      if (catRes.ok) {
        const categories = await catRes.json();
        if (categories.length > 0) setDb(prev => ({ ...prev, categories }));
      }

      if (srvRes.ok) {
        const liveServices = (await srvRes.json())
          .map(resolveHealthcareServiceImage)
          .filter((service: any) =>
            !(service.category === 'iv-therapy' || service.subcategory === 'iv-therapy') ||
            IV_THERAPY_ALLOWED_IDS.has(service.id)
          );
        if (liveServices.length > 0) {
          const liveIds = new Set(liveServices.map((s: any) => s.id));
          const hasLiveIvTherapy = liveServices.some((s: any) => s.category === 'iv-therapy' || s.subcategory === 'iv-therapy');
          setDb(prev => ({
            ...prev,
            services: [
              ...prev.services.filter(s => !liveIds.has(s.id) && !(hasLiveIvTherapy && (s.category === 'iv-therapy' || s.subcategory === 'iv-therapy'))),
              ...liveServices,
            ],
          }));
        }
      }
    } catch (e) {
      console.error('Error fetching service data:', e);
    }
  };

  useEffect(() => {
    fetchDb();
  }, []);

  useEffect(() => {
    if (activeTab !== 'search-results') {
      setSearchQuery('');
    }
    setCustomLabSearch('');
    setLabTestsAtHomeSearch('');

    if (currentLabTestsRoute && LAB_TESTS_SECTION_ID_BY_ROUTE[currentLabTestsRoute]) {
      setActiveTab('lab-tests');
      setActiveSectionId(LAB_TESTS_SECTION_ID_BY_ROUTE[currentLabTestsRoute]);
      return;
    }

    if (currentServiceRoute && SERVICE_SECTION_ID_BY_ROUTE[currentServiceRoute]) {
      setActiveTab('services');
      setActiveSectionId(SERVICE_SECTION_ID_BY_ROUTE[currentServiceRoute]);
      return;
    }

    if (currentProductRoute && PRODUCT_SECTION_ID_BY_ROUTE[currentProductRoute]) {
      setActiveTab('products');
      setActiveSectionId(PRODUCT_SECTION_ID_BY_ROUTE[currentProductRoute]);
      return;
    }

    if (location.pathname === '/') {
      if (activeTab === 'services' || activeTab === 'products') {
        setActiveTab('home');
        setActiveSectionId(null);
      }
    }
  }, [currentLabTestsRoute, currentServiceRoute, currentProductRoute, location.pathname]);

  // Search filter query lookup helper
  const filteredProducts = useMemo(() => {
    return db.products;
  }, [db.products]);

  const displayedProducts = useMemo(() => {
    if (!currentProductRoute) return filteredProducts;
    const category = PRODUCT_CATEGORY_BY_ROUTE[currentProductRoute];
    if (!category) return filteredProducts;
    return filteredProducts.filter((product) => product.category === category || product.subcategory === currentProductRoute);
  }, [currentProductRoute, filteredProducts]);

  const filteredServices = useMemo(() => {
    return db.services;
  }, [db.services]);

  const homeHealthcareCategories = useMemo(() => {
    const categoriesBySlug = new Map<string, ServiceCategory>(
      SERVICE_CATEGORIES.map((category) => [category.slug, category as ServiceCategory]),
    );

    db.categories
      .filter((category) => category.slug !== 'service')
      .forEach((category) => {
        const existing = categoriesBySlug.get(category.slug);
        categoriesBySlug.set(category.slug, {
          ...(category as ServiceCategory),
          image: existing?.image || (category as ServiceCategory).image || '',
        } as ServiceCategory);
      });

    HOME_ADDITIONAL_HEALTHCARE_CATEGORIES.forEach((category) => {
      const existingCategory = categoriesBySlug.get(category.slug);
      const matchingService = db.services.find(
        (service) => service.category === category.slug || service.subcategory === category.slug,
      );

      const catImage = (category as any).image;
      categoriesBySlug.set(category.slug, {
        ...existingCategory,
        ...category,
        image:
          catImage ||
          existingCategory?.image ||
          matchingService?.image ||
          '',
      });
    });

    return Array.from(categoriesBySlug.values());
  }, [db.categories, db.services]);

  const homeHealthcareServices = useMemo<HealthcareService[]>(() => {
    const normalizedServices = db.services.map((service) =>
      service.category === 'long-term-care' || service.subcategory === 'long-term-care'
        ? normalizeLongTermServiceSlashSpacing(service)
        : service,
    );
    const rentalEquipment = db.products
      .filter(
        (product) =>
          product.category === 'devices-for-rent' ||
          product.subcategory === 'rent-medical-equipments',
      )
      .map((product) => ({
        id: product.id,
        title: product.name,
        category: 'devices-for-rent',
        subcategory: 'rent-medical-equipments',
        price: product.price,
        originalPrice: product.originalPrice,
        duration: 'Weekly / Monthly Rental',
        image: product.image,
        description: product.description || product.subtitle,
        shortDescription: product.subtitle,
        popular: false,
        bookingNotice: '12 hours prior booking',
        remarks: 'Available across the UAE except Abu Dhabi.',
        attributes: product.attributes,
        vendorPrices: product.vendorPrices,
      }));

    const serviceIds = new Set(normalizedServices.map((service) => service.id));
    return [
      ...normalizedServices,
      ...rentalEquipment.filter((product) => !serviceIds.has(product.id)),
    ];
  }, [db.products, db.services]);

  const nursingServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'home-healthcare'),
    [filteredServices],
  );
  const placeVentilatorCareAfterLessThan12Hours = (services: HealthcareService[]) => {
    const itemId = 'srv-longterm-dha-ventillator-trach-peg-24-hours-30-days';
    const afterId = 'srv-longterm-dha-nurse-less-than-12-hours-per-day';
    const itemIndex = services.findIndex((srv) => srv.id === itemId);
    const afterIndex = services.findIndex((srv) => srv.id === afterId);
    if (itemIndex === -1 || afterIndex === -1) return services;

    const nextServices = [...services];
    const [item] = nextServices.splice(itemIndex, 1);
    const nextAfterIndex = nextServices.findIndex((srv) => srv.id === afterId);
    nextServices.splice(nextAfterIndex + 1, 0, item);
    return nextServices;
  };
  const longTermServices = useMemo(
    () =>
      placeVentilatorCareAfterLessThan12Hours(
        filteredServices
          .filter((srv) => srv.category === 'long-term-care' || srv.subcategory === 'long-term-care')
          .map(normalizeLongTermServiceSlashSpacing),
      ),
    [filteredServices],
  );
  const physioServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'physiotherapy'),
    [filteredServices],
  );
  const doctorServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'doctor-on-call'),
    [filteredServices],
  );
  const speechServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'speech-therapy'),
    [filteredServices],
  );
  const occupationalServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'occupational-therapy'),
    [filteredServices],
  );
  const ivServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'iv-therapy' || srv.subcategory === 'iv-therapy'),
    [filteredServices],
  );
  const displayedLabServices = useMemo(() => {
    if (activeSectionId === 'customize-lab-package-section') {
      const labServices = db.services.filter((service) => service.category === 'lab-tests');
      const customizeServices = labServices.filter((service) => service.subcategory === 'customize-lab-package');
      const query = customLabSearch.trim().toLowerCase();
      if (!query) return customizeServices;
      return customizeServices.filter((service) => {
        const testCode = Array.isArray(service.attributes) ? service.attributes.find((item: any) => item.label === 'Test Code')?.value || '' : '';
        return (
          String(service.title || '').toLowerCase().includes(query) ||
          String(service.description || '').toLowerCase().includes(query) ||
          String(testCode).toLowerCase().includes(query)
        );
      });
    }
    if (!currentLabTestsRoute) return [];
    const categoryServices = db.services.filter((service) => service.category === 'lab-tests-at-home' && service.subcategory === currentLabTestsRoute);
    const query = labTestsAtHomeSearch.trim().toLowerCase();
    if (!query) return categoryServices;

    return categoryServices.filter((service) => {
      const attributeText = (service.attributes || [])
        .map((item: any) => `${item.label || ''} ${item.value || ''}`)
        .join(' ');
      return (
        String(service.title || '').toLowerCase().includes(query) ||
        String(service.description || '').toLowerCase().includes(query) ||
        attributeText.toLowerCase().includes(query)
      );
    });
  }, [activeSectionId, currentLabTestsRoute, customLabSearch, labTestsAtHomeSearch, db.services]);

  const getServiceAttributeValue = (srv: HealthcareService, label: string) => {
    const attributes = srv.attributes;
    if (Array.isArray(attributes)) {
      return attributes.find((item: any) => item.label === label)?.value;
    }

    if (attributes && typeof attributes === 'object') {
      const key = label
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[A-Z]/, (char) => char.toLowerCase());
      const snakeKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return (attributes as Record<string, any>)[key] || (attributes as Record<string, any>)[snakeKey] || (attributes as Record<string, any>)[label];
    }

    return undefined;
  };

  const isIvTherapyService = (srv: HealthcareService) =>
    srv.category === 'iv-therapy' || srv.subcategory === 'iv-therapy';

  const getVendorPriceValue = (srv: HealthcareService, vendorName: string) => {
    const vendorPrices = srv.vendorPrices;
    if (Array.isArray(vendorPrices)) {
      return vendorPrices.find((item: any) => item.vendorName === vendorName)?.price;
    }

    if (vendorPrices && typeof vendorPrices === 'object') {
      return (vendorPrices as Record<string, any>)[vendorName];
    }

    return undefined;
  };

  const formatVendorPriceValue = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return undefined;
    return `AED ${formatAedWhole(value)}`;
  };

  const getVisibleServiceDetailAttributes = (srv: HealthcareService) =>
    (isIvTherapyService(srv)
      ? [
          [
            'Doctor Plus Home Healthcare',
            formatVendorPriceValue(getVendorPriceValue(srv, 'Doctor Plus Home Healthcare')),
          ],
          ['Pegasus', formatVendorPriceValue(getVendorPriceValue(srv, 'Pegasus'))],
        ]
      : []
    ).concat([
      ['Key Ingredients', getServiceAttributeValue(srv, 'Key Ingredients')],
      ['Clinical Benefits', getServiceAttributeValue(srv, 'Clinical Benefits')],
      ['Disclaimer', getServiceAttributeValue(srv, 'Disclaimer')],
    ]).filter(([, value]) => value);

  const hasExtraDetails = (srv: HealthcareService) =>
    getVisibleServiceDetailAttributes(srv).length > 0 ||
    Boolean(srv.fullDescription && srv.fullDescription !== srv.description) ||
    Boolean(srv.inclusions?.length) ||
    Boolean(srv.preparationInstructions) ||
    Boolean(srv.whoIsItFor) ||
    Boolean(srv.availability);

  const getVisibleLabAttributes = (srv: HealthcareService) =>
    (srv.attributes || []).filter((item: any) =>
      !['Excel Row', 'Category', 'Collection', 'Coverage'].includes(item.label) && item.value,
    );

  const getServiceImageClassName = (_srv: HealthcareService) => 'w-full h-full object-cover';

  const getServiceImage = (srv: HealthcareService) =>
    resolveHealthcareServiceImage(srv).image || DEFAULT_HEALTHCARE_SERVICE_IMAGE;

  const handleServiceImageError = (event: SyntheticEvent<HTMLImageElement>, srv: HealthcareService) => {
    const image = event.currentTarget;
    const fallback = getServiceImage(srv);
    if (image.src.endsWith(fallback) || image.dataset.fallbackApplied === 'true') {
      image.src = DEFAULT_HEALTHCARE_SERVICE_IMAGE;
      return;
    }
    image.dataset.fallbackApplied = 'true';
    image.src = fallback;
  };

  const renderServiceCard = (srv: HealthcareService) => (
    <div
      key={srv.id}
      className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between scroll-mt-32"
    >
      <div>
        <div className="h-44 w-full flex items-center justify-center rounded-2xl overflow-hidden mb-4 bg-slate-50 relative">
          <img
            src={getServiceImage(srv)}
            alt={srv.title}
            className={getServiceImageClassName(srv)}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(event) => handleServiceImageError(event, srv)}
          />
          {srv.popular && (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow">
              Popular
            </span>
          )}
          {srv.enquiryOnly && (
            <span className="absolute top-3 right-3 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow">
              Enquiry
            </span>
          )}
        </div>
        <h3 className="text-base font-extrabold text-blue-950 mt-0.5 leading-snug line-clamp-2">{srv.title}</h3>
        <p className="text-xs text-slate-500 mt-2 mb-4 line-clamp-3 min-h-[48px]">{srv.shortDescription || srv.description}</p>
        {hasExtraDetails(srv) && (
          <button
            type="button"
            onClick={() => setServiceDetails(srv)}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-medical-green hover:text-emerald-700 hover:underline cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>
        )}
        {(srv.bookingNotice) && (
          <div className="space-y-1 mb-3">
            {srv.bookingNotice && (
              <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span>{srv.bookingNotice}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-baseline gap-2 justify-start">
          {srv.price > 0 ? (
            <>
              <span className="text-[7px] text-slate-400 font-extrabold uppercase leading-none mr-0.5">FROM</span>
              <span className="text-xs font-black text-medical-green">AED {formatAedWhole(srv.price)}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Enquiry Only</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleAddToCart(srv)}
            className="flex-1 py-3 px-4 bg-medical-blue hover:bg-blue-900 active:scale-95 text-white font-black text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
          {!srv.enquiryOnly && srv.price > 0 && (
            <button
              onClick={() => triggerServiceBooking(srv.title, srv.price)}
              className="flex-1 py-3 px-4 bg-medical-green hover:bg-emerald-600 active:scale-95 text-white font-black text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <CalendarClock className="w-4 h-4" />
              <span>BOOK NOW</span>
            </button>
          )}
          {srv.enquiryOnly && (
            <button
              onClick={() => triggerServiceEnquiry(srv.title)}
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>ENQUIRE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderServiceGroup = (
    sectionId: string,
    label: string,
    title: string,
    description: string,
    items: HealthcareService[],
  ) => (
    <section id={sectionId} className="mb-12 scroll-mt-32">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-2xl font-black text-blue-950">{title}</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">{description}</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((srv) => renderServiceCard(srv))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
          No services available in this section.
        </div>
      )}
    </section>
  );

  // Cart Interactions
  const handleAddToCart = (product: Product | HealthcareService) => {
    if ('enquiryOnly' in product && product.enquiryOnly) return;
    const existing = cart.find((it) => it.product.id === product.id);
    setCart((prevCart) =>
      existing
        ? prevCart.map((it) =>
            it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
          )
        : [...prevCart, { product, quantity: 1 }]
    );
    if (existing) {
      triggerToast('Item quantity updated in cart');
      return;
    }
    triggerToast('Added to cart');
  };

  const handleUpdateCartQty = (productId: string, qty: number) => {
    setCart((prevCart) =>
      prevCart.map((it) => (it.product.id === productId ? { ...it, quantity: qty } : it))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((it) => it.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartTotalItems = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.quantity, 0);
  }, [cart]);

  // Trigger home visit wizard with presets
  const triggerServiceBooking = (serviceTitle: string, price: number, isLabTest?: boolean) => {
    if (!loggedInUser) {
      triggerToast('Please log in with your customer account first to proceed with booking.');
      setIsAuthOpen(true);
      return;
    }
    setPreselectedServiceTitle(serviceTitle);
    setPreselectedPrice(price);
    setBookingIsLabTest(isLabTest || false);
    setIsBookingOpen(true);
  };

  const triggerRentalBooking = (product: any) => {
    if (!loggedInUser) {
      triggerToast('Please log in with your customer account first to proceed with booking.');
      setIsAuthOpen(true);
      return;
    }
    setSelectedRentalProduct(product);
    setIsRentalOpen(true);
  };

  // Trigger service custom enquiry panel
  const triggerServiceEnquiry = (serviceTitle: string) => {
    setPreselectedEnquiryServiceTitle(serviceTitle);
    setIsEnquiryOpen(true);
  };

  const triggerCustomServiceRequest = () => {
    setPreselectedEnquiryServiceTitle('Custom Service Request');
    setIsEnquiryOpen(true);
  };

  // Switch tab trigger & optional in-page section scroll.
  const handleTabChange = (tab: ActiveTab, sectionId?: string) => {
    if (tab === 'services') {
      const targetSectionId = sectionId || 'home-healthcare-section';
      const targetRoute = SERVICE_ROUTE_BY_SECTION_ID[targetSectionId] || DEFAULT_SERVICE_ROUTE;
      setActiveTab('services');
      setActiveSectionId(targetSectionId);
      navigate(`/services/${targetRoute}`);
      return;
    }

    if (tab === 'products') {
      const targetSectionId = sectionId || 'rent-medical-equipments-section';
      const targetRoute = PRODUCT_ROUTE_BY_SECTION_ID[targetSectionId] || DEFAULT_PRODUCT_ROUTE;
      setActiveTab('products');
      setActiveSectionId(targetSectionId);
      navigate(`/products/${targetRoute}`);
      return;
    }

    if (tab === 'lab-tests' || tab === 'health-packages') {
      if (sectionId === 'customize-lab-package-section') {
        setActiveTab('lab-tests');
        setActiveSectionId(sectionId);
        navigate('/');
        window.setTimeout(() => {
          const section = document.getElementById(sectionId);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 80);
        return;
      }

      const targetSectionId = sectionId || 'routine-blood-tests-section';
      const targetRoute = LAB_TESTS_ROUTE_BY_SECTION_ID[targetSectionId] || DEFAULT_LAB_TESTS_ROUTE;
      setActiveTab('lab-tests');
      setActiveSectionId(targetSectionId);
      navigate(`${LAB_TESTS_AT_HOME_ROUTE_PREFIX}/${targetRoute}`);
      return;
    }

    setActiveTab(tab);
    setActiveSectionId(sectionId || null);
    navigate('/');

    if (!sectionId) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
      return;
    }

    window.setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  const handleGlobalSearch = (submittedQuery: string) => {
    const normalizedSearch = submittedQuery.trim();
    const query = normalizedSearch.toLowerCase();
    if (!query) {
      triggerToast('Enter a search term.');
      return;
    }

    setSearchQuery(normalizedSearch);
    setSearchHistory((current) => [
      normalizedSearch,
      ...current.filter((item) => typeof item === 'string' && item.toLowerCase() !== query),
    ].slice(0, 8));

    setActiveTab('search-results');
    setActiveSectionId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { services: [], products: [], customLabs: [] };

    const matchService = (s: any) => {
      const title = String(s.title || '').toLowerCase();
      const desc = String(s.description || '').toLowerCase();
      const shortDesc = String(s.shortDescription || '').toLowerCase();
      const attrs = Array.isArray(s.attributes) ? s.attributes : [];
      const testCode = attrs.find((a: any) => a.label === 'Test Code')?.value || '';
      const includedTests = attrs.find((a: any) => /include|test|parameter|marker/i.test(a.label))?.value || '';
      return (
        title.includes(query) ||
        desc.includes(query) ||
        shortDesc.includes(query) ||
        String(testCode).toLowerCase().includes(query) ||
        String(includedTests).toLowerCase().includes(query)
      );
    };

    const matchProduct = (p: any) => {
      return (
        String(p.name || '').toLowerCase().includes(query) ||
        String(p.subtitle || '').toLowerCase().includes(query) ||
        String(p.description || '').toLowerCase().includes(query) ||
        String(p.brand || '').toLowerCase().includes(query)
      );
    };

    const allMatching = db.services.filter(matchService);
    const customLabs = allMatching.filter((s: any) => s.category === 'lab-tests' && s.subcategory === 'customize-lab-package');
    const services = allMatching.filter((s: any) => !(s.category === 'lab-tests' && s.subcategory === 'customize-lab-package'));

    return {
      services,
      products: db.products.filter(matchProduct),
      customLabs,
    };
  }, [searchQuery, db.services, db.products]);

  // Copy offer coupons text
  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => {
      setCopiedCoupon(null);
    }, 2000);
  };

  // Dynamic SEO per tab/page
  const seoData = useMemo(() => {
    if (activeTab === 'services' && currentServiceRoute) {
      const routeLabels: Record<string, { title: string; desc: string }> = {
        'nursing-care-at-home': { title: 'Nursing Care at Home', desc: 'Professional nursing support delivered at the comfort of your home, including routine nurse visits, wound dressing, catheterisation, and prescription-based IV antibiotic administration.' },
        'long-term-specialized-care': { title: 'Long-Term / Specialized Care', desc: 'Dedicated nursing support at home for long-term and specialized care needs, including ongoing monitoring, chronic condition management, and personalized patient assistance.' },
        'physiotherapy-at-home': { title: 'Physiotherapy at Home', desc: 'Professional physiotherapy sessions delivered at the comfort of your home, including rehabilitation support, mobility improvement, pain management, and recovery-focused exercises.' },
        'doctor-on-call': { title: 'Doctor on Call', desc: 'Convenient medical consultations at your home with qualified doctors providing assessment, advice, treatment guidance, and follow-up care.' },
        'speech-and-language-therapy': { title: 'Speech and Language Therapy', desc: 'Specialized therapy at home to support speech, communication, language development, and swallowing difficulties through personalized care plans.' },
        'occupational-therapy': { title: 'Occupational Therapy', desc: 'Personalized therapy at home to improve daily living skills, independence, mobility, and functional abilities through tailored rehabilitation programs.' },
        'iv-therapy': { title: 'IV Therapy', desc: 'Professional IV therapy administered at home under medical guidance, offering convenient access to prescribed treatments, hydration support, and wellness infusions.' },
      };
      const data = routeLabels[currentServiceRoute] || { title: 'Healthcare Services', desc: SITE_DEFAULT_DESCRIPTION };
      return { title: data.title, description: data.desc, canonicalPath: `/services/${currentServiceRoute}` };
    }
    if (activeTab === 'lab-tests') {
      return { title: 'Lab Tests at Home', description: 'Book lab tests at home in Dubai. Routine blood tests, preventive health packages, STD screening, and genetic testing with home sample collection.', canonicalPath: '/services/lab-tests-at-home' };
    }
    if (activeTab === 'products') {
      return { title: 'Medical Equipment', description: 'Rent certified medical equipment in Dubai. Hospital beds, oxygen concentrators, wheelchairs, BP monitors, and more.', canonicalPath: '/products' };
    }
    if (activeTab === 'wellness') {
      return { title: 'Other Services', description: 'Medical tourism facilitation and medical support for shipping crew members in Dubai and Sharjah.' };
    }
    if (activeTab === 'providers') {
      return { title: 'For Healthcare Providers', description: 'Join MedZiva\'s premium healthcare network. Register as a provider to offer home healthcare, lab tests, and medical services.' };
    }
    if (activeTab === 'support') {
      return { title: 'Help & Support', description: 'Customer support and FAQs center for bookings, cancellations, payments, accounts, and services.' };
    }
    if (activeTab === 'offers') {
      return { title: 'Offers & Promotions', description: 'Exclusive healthcare deals, promo codes, and seasonal offers from MedZiva.' };
    }
    if (activeTab === 'privacy') {
      return { title: 'Privacy Policy', description: 'MedZiva privacy policy — how we collect, use, and protect your personal and health data.' };
    }
    if (activeTab === 'terms') {
      return { title: 'Terms & Conditions', description: 'MedZiva terms and conditions for using our healthcare marketplace platform.' };
    }
    if (activeTab === 'about') {
      return { title: 'About Us', description: 'MedZiva International Healthcare L.L.C — premium healthcare marketplace in Dubai connecting patients with DHA compliant providers.', canonicalPath: '/about' };
    }
    return { title: 'Home', description: SITE_DEFAULT_DESCRIPTION, canonicalPath: '/' };
  }, [activeTab, currentServiceRoute]);

  useSEO(seoData);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all selection:bg-teal-500 selection:text-white">
      
      {/* Interactive Main medical branding header */}
      <MainHeader 
          cartCount={cartTotalItems}
          onCartOpen={() => setIsCartOpen(true)}
          onBookingOpen={() => {
          if (!loggedInUser) {
            triggerToast('Please log in with your customer account first to proceed with booking.');
            setIsAuthOpen(true);
            return;
          }
          setPreselectedServiceTitle('');
          setPreselectedPrice(0);
          setIsBookingOpen(true);
        }}
        onAuthOpen={() => setIsAuthOpen(true)}
        onProfileOpen={() => setIsProfileOpen(true)}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={handleGlobalSearch}
        searchHistory={searchHistory}
        onClearSearchHistory={() => {
          setSearchHistory([]);
          localStorage.removeItem('medziva_search_history');
          localStorage.removeItem('medziva_search_query');
        }}
        onTabChange={handleTabChange}
        activeTab={activeTab}
        activeSectionId={activeSectionId}
        loggedInUser={loggedInUser}
        onLogout={() => {
          setLoggedInUser(null);
          setLoggedInUserEmail('');
          setLoggedInUserPhone('');
          setLoggedInUserAddress('');
          localStorage.removeItem('medziva_user_token');
          fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
          // Clear localStorage
          localStorage.removeItem('medziva_user_name');
          localStorage.removeItem('medziva_user_email');
          localStorage.removeItem('medziva_user_phone');
          localStorage.removeItem('medziva_user_address');
          toast.success('Logged out successfully.');
        }}
      />

      {/* 3. Horizontal Navigation Menu bar */}
      <NavigationMenu 
        activeTab={activeTab} 
        activeSectionId={activeSectionId}
        onTabChange={handleTabChange} 
      />

      {/* 3.5 Service Category Navigation Bar */}
      {activeTab === 'services' && (
        <div className="bg-white border-b border-slate-100 sticky top-[52px] z-[29]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2.5 sm:justify-center">
              {[
                { label: 'Nursing Care', sectionId: 'home-healthcare-section' },
                { label: 'Physiotherapy', sectionId: 'physiotherapy-section' },
                { label: 'Doctor on Call', sectionId: 'doctor-on-call-section' },
                { label: 'Long-Term Care', sectionId: 'long-term-care-section' },
                { label: 'Speech Therapy', sectionId: 'speech-therapy-section' },
                { label: 'Occupational Therapy', sectionId: 'occupational-therapy-section' },
                { label: 'IV Therapy', sectionId: 'iv-therapy-section' },
              ].map((cat) => {
                const isActive = activeSectionId === cat.sectionId || (!activeSectionId && cat.sectionId === 'home-healthcare-section');
                return (
                  <button
                    key={cat.sectionId}
                    onClick={() => handleTabChange('services', cat.sectionId)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-medical-green text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lab-tests' && (
        <div className="bg-white border-b border-slate-100 sticky top-[52px] z-[29]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2.5 sm:justify-center">
              {[
                { label: 'Routine Blood Tests', sectionId: 'routine-blood-tests-section' },
                { label: 'Preventive Health Packages', sectionId: 'preventive-health-packages-section' },
                { label: "Men's Health Packages", sectionId: 'mens-health-packages-section' },
                { label: "Women's Health Packages", sectionId: 'womens-health-packages-section' },
                { label: 'STD / Sexual Health', sectionId: 'std-sexual-health-section' },
                { label: 'Specialized Diagnostic Tests', sectionId: 'specialized-diagnostic-tests-section' },
                { label: 'Genetic Testing', sectionId: 'genetic-testing-section' },
              ].map((cat) => {
                const isActive = activeSectionId === cat.sectionId || (!activeSectionId && cat.sectionId === 'routine-blood-tests-section');
                return (
                  <button
                    key={cat.sectionId}
                    onClick={() => handleTabChange('lab-tests', cat.sectionId)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-medical-green text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Display Core layouts based on dynamic state ActiveTab */}
      <main className="flex-grow">
        <ErrorBoundary>
        
        {activeTab === 'search-results' && (
          <div className="max-w-7xl mx-auto py-10 px-4 page-section">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">Search Results</span>
              <h1 className="text-3xl font-black text-blue-950">
                {searchResults.services.length + searchResults.products.length + searchResults.customLabs.length} results for "{searchQuery}"
              </h1>
            </div>

            {searchResults.services.length === 0 && searchResults.products.length === 0 && searchResults.customLabs.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
                <p className="text-slate-400 text-sm font-medium">No results found for "{searchQuery}".</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveTab('home'); }}
                  className="bg-medical-green text-white text-xs font-bold py-2.5 px-6 rounded-xl mt-3 hover:bg-emerald-600 cursor-pointer"
                >
                  Back to Home
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {searchResults.services.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-blue-950 mb-4">Services ({searchResults.services.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {searchResults.services.map((srv) => {
                        const isAdded = cart.some((item) => item.product.id === srv.id);
                        const testCode = Array.isArray(srv.attributes) ? srv.attributes.find((item: any) => item.label === 'Test Code')?.value : undefined;
                        return (
                          <div
                            key={srv.id}
                            onClick={() => setServiceDetails(srv)}
                            className="bg-white rounded-2xl border border-slate-150/60 p-2.5 sm:p-3 transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between h-full relative group cursor-pointer"
                          >
                            {/* Top Badges */}
                            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-0.5 z-10">
                              {srv.popular && (
                                <span className="bg-amber-500 text-white text-[7px] font-black px-1 py-0.5 rounded-sm uppercase tracking-wider">
                                  POPULAR
                                </span>
                              )}
                              {srv.duration && (
                                <span className="bg-slate-900/90 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs">
                                  ⏱️ {srv.duration}
                                </span>
                              )}
                            </div>

                            {/* Service Image */}
                            <div className="h-24 w-full flex items-center justify-center rounded-xl overflow-hidden mb-2.5 bg-[#F8FAFC] relative">
                              <img
                                src={getServiceImage(srv)}
                                alt={srv.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                                onError={(event) => handleServiceImageError(event, srv)}
                              />
                              {/* Hover Quick Look Overlay */}
                              <div className="absolute inset-0 bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="bg-white/95 text-slate-800 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                                  <Eye className="w-2.5 h-2.5 text-medical-green" />
                                  <span>Quick View</span>
                                </div>
                              </div>
                            </div>

                            {/* Name and description info */}
                            <div className="text-left mb-2.5 flex-grow">
                              <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">
                                {srv.category?.replace(/-/g, ' ')}
                              </span>
                              <h3 className="text-[10px] md:text-[11px] font-black text-blue-950 leading-tight mt-0.5 line-clamp-2 min-h-[28px]">
                                {srv.title}
                              </h3>
                              <p className="text-[9px] text-slate-500 line-clamp-2 mt-0.5 min-h-[26px] leading-relaxed">
                                {srv.shortDescription || srv.description}
                              </p>
                              {hasExtraDetails(srv) && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setServiceDetails(srv);
                                  }}
                                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold text-medical-green hover:text-emerald-700 hover:underline cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Details</span>
                                </button>
                              )}
                              {(srv.bookingNotice) && (
                                <div className="mt-2 space-y-1">
                                  <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 rounded-full">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{srv.bookingNotice}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Service Rate & Booking Footer */}
                            <div className="pt-2 border-t border-slate-100 flex flex-col justify-end">
                              <div className="flex items-baseline gap-0.5 mb-2 justify-start">
                                {srv.price > 0 ? (
                                  <>
                                    <span className="text-[7px] text-slate-400 font-extrabold uppercase leading-none mr-0.5">FROM</span>
                                    <span className="text-xs font-black text-medical-green">
                                      AED {formatAedWhole(srv.price)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded-sm">
                                    Enquiry Only
                                  </span>
                                )}
                              </div>

                              {/* Booking actions */}
                              <div className="flex gap-1">
                                {srv.enquiryOnly ? (
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      triggerServiceEnquiry(srv.title);
                                    }}
                                    className="flex-1 py-1.5 px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-[10px] rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                                  >
                                    <MessageCircle className="w-2.5 h-2.5" />
                                    <span>ENQUIRE</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleAddToCart(srv);
                                      }}
                                      className={`flex-1 py-1.5 px-3 font-black text-[10px] rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                                        isAdded
                                          ? 'bg-emerald-50 text-medical-green border border-emerald-200'
                                          : 'bg-medical-blue hover:bg-blue-900 active:scale-95 text-white'
                                      }`}
                                    >
                                      <ShoppingCart className="w-2.5 h-2.5" />
                                      <span>{isAdded ? 'Added' : 'Add to Cart'}</span>
                                    </button>
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        triggerServiceBooking(srv.title, srv.price, srv.category === 'lab-tests-at-home');
                                      }}
                                      className="flex-1 py-1.5 px-3 bg-medical-green hover:bg-emerald-600 active:scale-95 text-white font-black text-[10px] rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                                    >
                                      <CalendarClock className="w-2.5 h-2.5" />
                                      <span>BOOK</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchResults.products.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-blue-950 mb-4">Products ({searchResults.products.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {searchResults.products.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="h-44 w-full flex items-center justify-center rounded-2xl overflow-hidden mb-4 bg-slate-50/50 relative">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className={prod.subcategory === 'rent-medical-equipments' || prod.subcategory === 'buy-medical-equipments' || prod.subcategory === 'supplements' ? 'h-full w-full rounded-2xl object-cover' : 'max-h-36 max-w-full object-contain mix-blend-multiply'}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            </div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                              {prod.brand || 'MedZiva Store'}
                            </span>
                            <h3 className="text-sm font-extrabold text-blue-950 mt-0.5 leading-snug line-clamp-1">{prod.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 mb-4 line-clamp-2 min-h-[32px]">{prod.subtitle}</p>
                          </div>
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-medical-green">AED {formatAedWhole(prod.price)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddToCart(prod)}
                              className="bg-medical-green hover:bg-emerald-600 active:scale-95 p-2.5 text-white rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                              title="Add to Cart"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.customLabs.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-blue-950 mb-4">Create Your Own Package ({searchResults.customLabs.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {searchResults.customLabs.map((srv) => {
                        const isAdded = cart.some((item) => item.product.id === srv.id);
                        const testCode = Array.isArray(srv.attributes) ? srv.attributes.find((item: any) => item.label === 'Test Code')?.value : undefined;
                        return (
                          <div
                            key={srv.id}
                            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs"
                          >
                            {srv.image && (
                              <div className="h-28 w-full rounded-xl overflow-hidden mb-3 bg-slate-50/50">
                                <img
                                  src={getServiceImage(srv)}
                                  alt={srv.title}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  onError={(event) => handleServiceImageError(event, srv)}
                                />
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-sm font-extrabold text-blue-950 leading-snug line-clamp-2">{srv.title}</h3>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                                  <span className="text-medical-green font-black">AED {formatAedWhole(srv.price)}</span>
                                </div>
                                {testCode && (
                                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{testCode}</p>
                                )}
                              </div>
                          <button
                            type="button"
                            onClick={isAdded ? undefined : () => handleAddToCart(srv)}
                            disabled={isAdded}
                            className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                              isAdded
                                ? 'bg-emerald-50 text-medical-green border border-emerald-200 opacity-60 cursor-not-allowed'
                                : 'bg-medical-blue text-white hover:bg-blue-900'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isAdded ? 'Added' : 'Add to Cart'}</span>
                          </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'home' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-0"
          >
            {/* Hero Banner */}
            <section className="relative w-full">
              <img
                src="/b23.png"
                alt="Complete Healthcare Anytime Anywhere"
                className="w-full h-auto object-cover"
              />
              <div className="absolute bottom-[12%] left-[4%] flex gap-3 sm:gap-4">
                <button
                  onClick={() => handleTabChange('services')}
                  className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg flex items-center gap-2"
                >
                  Book a Service <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTabChange('products')}
                  className="bg-white hover:bg-slate-50 text-blue-900 font-bold text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg border border-slate-200 flex items-center gap-2"
                >
                  Explore Products <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>

            {/* Popular Healthcare Services carousel */}
            <ProductsSection 
              onServiceSelect={triggerServiceBooking}
              onServiceEnquire={triggerServiceEnquiry}
              onAddToCart={handleAddToCart}
              onViewDetails={setServiceDetails}
              onExploreMore={() => handleTabChange('services')}
              servicesList={db.services.filter(s => s.popular)}
            />

            {/* Home Healthcare Services slide container */}
            <ServicesSection 
              onServiceSelect={triggerServiceBooking}
              onServiceEnquire={triggerServiceEnquiry}
              onAddToCart={handleAddToCart}
              onExploreMore={() => handleTabChange('services')}
              categoriesList={homeHealthcareCategories}
              servicesList={homeHealthcareServices}
              overlapHero={false}
            />

            {/* Popular Products section */}
            <section className="bg-slate-50 py-6 px-4 border-b border-slate-100">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-left">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-medical-blue">
                      Popular Products
                    </h2>
                  </div>
                  <button
                    onClick={() => handleTabChange('products')}
                    className="text-xs sm:text-sm font-bold text-medical-green hover:text-emerald-700 hover:underline transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all products</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-2">
                  {db.products.filter(p => p.category === 'devices-for-rent').slice(0, 8).map((prod) => (
                    <div
                      key={prod.id}
                      className="snap-start bg-white rounded-2xl border border-slate-150/60 p-0 min-w-[200px] sm:min-w-[220px] max-w-[220px] flex-shrink-0 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        <div className="relative h-28 w-full overflow-hidden">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/30">
                            ⭐ POPULAR
                          </span>
                        </div>
                        <div className="p-3">
                          <span className="text-[7px] font-bold uppercase text-medical-blue tracking-wider bg-medical-blue/10 px-1.5 py-0.5 rounded-full">
                            {prod.brand || 'MedZiva Store'}
                          </span>
                          <h3 className="text-[11px] sm:text-[12px] font-black text-slate-900 leading-tight mt-1.5 mb-1 line-clamp-2 min-h-[28px]">
                            {prod.name}
                          </h3>
                          <p className="text-[11px] sm:text-[10px] text-slate-500 line-clamp-2 leading-relaxed min-h-[26px]">
                            {prod.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 pt-2 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-end">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">FROM</span>
                            <span className="text-sm font-black text-medical-green">
                              AED {formatAedWhole(prod.price)}
                            </span>
                          </div>
                          <button
                            onClick={() => triggerRentalBooking(prod)}
                            className="py-1.5 px-3 bg-medical-green hover:bg-emerald-600 active:scale-95 text-white font-black text-[9px] rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-medical-green/30"
                          >
                            <CalendarClock className="w-3 h-3" />
                            <span>Book</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Custom Request Service section */}
            <section className="bg-slate-50 py-12 px-4 border-b border-slate-100">
              <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-3xl border border-slate-150/70 p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="text-left max-w-2xl">
                    <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-2">
                      Custom care request
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-medical-blue">
                      Need a service not listed?
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      Request specialized diagnostics, monthly nurse schedules, therapy combinations, or long-term care requirements. Our team will review and respond with availability.
                    </p>
                  </div>
                  <button
                    onClick={triggerCustomServiceRequest}
                    className="bg-medical-green hover:bg-emerald-600 text-white font-black text-xs sm:text-sm py-3.5 px-6 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Request Custom Service</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Interactive Promotional Pastel Row */}
            <PromotionalBanners 
              onOffersClick={() => handleTabChange('offers')}
            />

            {/* Direct Vetted Safety guarantees */}
            <TrustFeatures />
          </motion.div>
        )}

        {/* Dedicated view: SERVICES catalog page */}
        {activeTab === 'services' && currentServiceRoute && (
          <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section scroll-mt-32">
            {currentServiceRoute === 'nursing-care-at-home' &&
              renderServiceGroup(
                'home-healthcare-section',
                'Nursing Care at Home',
                'Nursing Care at Home',
                'Professional nursing support delivered at the comfort of your home, including routine nurse visits, wound dressing, catheterisation, and prescription-based IV antibiotic administration.',
                nursingServices,
              )}

            {currentServiceRoute === 'long-term-specialized-care' &&
              renderServiceGroup(
                'long-term-care-section',
                'Long-Term / Specialized Care',
                'Long-Term / Specialized Care',
                'Dedicated nursing support at home for long-term and specialized care needs, including ongoing monitoring, chronic condition management, and personalized patient assistance.',
                longTermServices,
              )}

            {currentServiceRoute === 'physiotherapy-at-home' &&
              renderServiceGroup(
                'physiotherapy-section',
                'Physiotherapy at Home',
                'Physiotherapy at Home',
                'Professional physiotherapy sessions delivered at the comfort of your home, including rehabilitation support, mobility improvement, pain management, and recovery-focused exercises.',
                physioServices,
              )}

            {currentServiceRoute === 'doctor-on-call' &&
              renderServiceGroup(
                'doctor-on-call-section',
                'Doctor on Call',
                'Doctor on Call',
                'Convenient medical consultations at your home with qualified doctors providing assessment, advice, treatment guidance, and follow-up care.',
                doctorServices,
              )}

            {currentServiceRoute === 'speech-and-language-therapy' &&
              renderServiceGroup(
                'speech-therapy-section',
                'Speech and Language Therapy',
                'Speech and Language Therapy',
                'Specialized therapy at home to support speech, communication, language development, and swallowing difficulties through personalized care plans.',
                speechServices,
              )}

            {currentServiceRoute === 'occupational-therapy' &&
              renderServiceGroup(
                'occupational-therapy-section',
                'Occupational Therapy',
                'Occupational Therapy',
                'Personalized therapy at home to improve daily living skills, independence, mobility, and functional abilities through tailored rehabilitation programs.',
                occupationalServices,
              )}

            {currentServiceRoute === 'iv-therapy' &&
              renderServiceGroup(
                'iv-therapy-section',
                'IV Therapy',
                'IV Therapy',
                'Professional IV therapy administered at home under medical guidance, offering convenient access to prescribed treatments, hydration support, and wellness infusions.',
                ivServices,
              )}
          </div>
        )}

        {/* Dedicated view: LAB TESTS page */}
        {activeTab === 'lab-tests' && (
          <div id={currentLabTestsSectionId || 'lab-tests-section'} className="max-w-7xl mx-auto py-10 px-4 text-left page-section scroll-mt-32">
            <div id="std-sexual-health-section" className="scroll-mt-32" aria-hidden="true" />
            <div id="specialized-diagnostic-tests-section" className="scroll-mt-32" aria-hidden="true" />
            <div id="genetic-testing-section" className="scroll-mt-32" aria-hidden="true" />
            <div id="customize-lab-package-section" className="scroll-mt-32" aria-hidden="true" />
            <div className="border-b border-slate-100 pb-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                {activeSectionId !== 'customize-lab-package-section' && (
                  <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">
                    Lab Tests at Home
                  </span>
                )}
                <h1 className="text-3xl font-black text-blue-950">
                  {activeSectionId === 'customize-lab-package-section'
                    ? 'Create your own Package'
                    : LAB_TESTS_PAGE_COPY[currentLabTestsRoute || DEFAULT_LAB_TESTS_ROUTE]?.title || 'Lab Tests at Home'}
                </h1>
                <p className="text-slate-500 text-sm mt-1 max-w-xl">
                  {activeSectionId === 'customize-lab-package-section'
                    ? 'Choose individual lab tests with 12 hours prior booking.'
                    : LAB_TESTS_PAGE_COPY[currentLabTestsRoute || DEFAULT_LAB_TESTS_ROUTE]?.description || 'Lab tests at home with 12 hours prior booking slots.'}
                </p>
              </div>
            </div>

            {activeSectionId === 'customize-lab-package-section' ? (
              <>
                <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mb-8">
                  <div className="relative w-full sm:max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={customLabSearch}
                      onChange={(event) => setCustomLabSearch(event.target.value)}
                      placeholder="Search for Tests"
                      className="w-full h-14 rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-700 focus:outline-hidden focus:border-medical-green"
                    />
                  </div>
                </div>

                {displayedLabServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {displayedLabServices.map((srv) => {
                      const isAdded = cart.some((item) => item.product.id === srv.id);
                      const testCode = Array.isArray(srv.attributes) ? srv.attributes.find((item: any) => item.label === 'Test Code')?.value : undefined;
                      return (
                        <div
                          key={srv.id}
                          className="bg-white rounded-2xl border border-slate-200 px-4 py-3 min-h-[92px] flex items-start justify-between gap-4 shadow-2xs"
                        >
                          <div className="min-w-0">
                            {srv.popular && (
                              <span className="inline-block bg-amber-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow mb-1.5">
                                Popular
                              </span>
                            )}
                            <h3 className="text-sm font-extrabold text-blue-950 leading-snug line-clamp-2 min-h-[36px]">{srv.title}</h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                              <span className="text-medical-green font-black">AED {formatAedWhole(srv.price)}</span>
                            </div>
                            {testCode && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{testCode}</p>
                            )}
                          </div>
                              <button
                                type="button"
                                onClick={isAdded ? undefined : () => handleAddToCart(srv)}
                                disabled={isAdded}
                                className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isAdded
                                    ? 'bg-emerald-50 text-medical-green border border-emerald-200 opacity-60 cursor-not-allowed'
                                    : 'bg-medical-blue text-white hover:bg-blue-900'
                                }`}
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>{isAdded ? 'Added' : 'Add to Cart'}</span>
                              </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
                    <p className="text-slate-400 text-sm font-medium">No tests match your search.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedLabServices.map((srv) => {
                  const visibleAttributes = getVisibleLabAttributes(srv);
                  return (
                  <div 
                    key={srv.id} 
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between scroll-mt-32"
                  >
                    <div>
                      <div className="relative h-44 rounded-2xl overflow-hidden mb-4 border border-slate-100">
                        <img
                          src={getServiceImage(srv)}
                          alt={srv.title}
                          className={getServiceImageClassName(srv)}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(event) => handleServiceImageError(event, srv)}
                        />
                        {srv.popular && (
                          <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow">
                            Popular
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-blue-950 leading-snug line-clamp-2 min-h-[40px] mb-1">{srv.title}</h3>
                      {srv.bookingNotice && (
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full mb-4">
                          <Clock className="w-3 h-3" />
                          <span>{srv.bookingNotice}</span>
                        </div>
                      )}
                      {visibleAttributes.length > 0 && (
                        <div className="space-y-2 mb-5">
                          {visibleAttributes.map((item: any) => (
                            <p key={`${srv.id}-${item.label}`} className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">
                              <span className="font-extrabold text-blue-950">{item.label}:</span> {item.value}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block leading-none uppercase">{srv.category === 'lab-tests-at-home' || srv.category === 'lab-tests' || srv.category === 'customize-lab-package' ? 'Price' : 'Inclusive sample fee'}</span>
                        <span className="text-base font-black text-medical-green mt-1 block">AED {formatAedWhole(srv.price)}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(srv)}
                          className="bg-medical-blue hover:bg-blue-900 text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => triggerServiceBooking(srv.title, srv.price, true)}
                          className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dedicated view: PRODUCTS eCommerce Page */}
        {activeTab === 'products' && currentProductRoute && (
          <div id={PRODUCT_SECTION_ID_BY_ROUTE[currentProductRoute] || 'products-page-section'} className="max-w-7xl mx-auto py-10 px-4 text-left page-section scroll-mt-32">
            <div className="border-b border-slate-100 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-blue-950">{PRODUCT_PAGE_COPY[currentProductRoute]?.title || 'Products'}</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-xl">
                  {PRODUCT_PAGE_COPY[currentProductRoute]?.description || 'Order certified healthcare products delivered under UAE free shipping safety.'}
                </p>
              </div>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-medical-green/15 text-medical-green text-xs font-bold py-2.5 px-5 rounded-xl border border-emerald-500/20 cursor-pointer"
                >
                  Clear Search Filters ✖
                </button>
              )}
            </div>

            {/* Grid display with real-time searches */}
            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 w-full flex items-center justify-center rounded-2xl overflow-hidden mb-4 bg-slate-50/50 relative">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className={prod.subcategory === 'rent-medical-equipments' || prod.subcategory === 'buy-medical-equipments' || prod.subcategory === 'supplements' ? 'h-full w-full rounded-2xl object-cover' : 'max-h-36 max-w-full object-contain mix-blend-multiply'}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </div>

                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        {prod.brand || 'MedZiva Store'}
                      </span>
                      <h3 className="text-sm font-extrabold text-blue-950 mt-0.5 leading-snug line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4 line-clamp-2 min-h-[32px]">
                        {prod.subtitle}
                      </p>
                      {prod.subcategory === 'rent-medical-equipments' && (
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full mb-4">
                          <Clock className="w-3 h-3" />
                          <span>{Array.isArray(prod.attributes) ? prod.attributes.find((item) => item.label === 'Booking notice')?.value : undefined}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">FROM</span>
                          <span className="text-sm font-black text-medical-green">AED {formatAedWhole(prod.price)}</span>
                        </div>
                      </div>

                      {prod.category === 'devices-for-rent' ? (
                        <button
                          onClick={() => triggerRentalBooking(prod)}
                          className="bg-medical-green hover:bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                        >
                          Book Now
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(prod)}
                          className="bg-medical-green hover:bg-emerald-600 active:scale-95 p-2.5 text-white rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                          title="Add to Cart"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl">
                <p className="text-slate-400 text-sm font-medium">No medical accessories match your current search.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-medical-green text-white text-xs font-bold py-2.5 px-6 rounded-xl mt-3 hover:bg-emerald-600"
                >
                  Show All Products
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dedicated view: HEALTH PACKAGES screen details */}
        {activeTab === 'health-packages' && (
          <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
            <div id="preventive-health-packages-section" className="scroll-mt-32" aria-hidden="true" />
            <div id="womens-health-packages-section" className="scroll-mt-32" aria-hidden="true" />
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">MedZiva comprehensive checkups</span>
              <h1 className="text-3xl font-black text-blue-950">Vetted At-Home Clinical Packages</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Full physical cardiovascular evaluations, diabetes profile bundles, endocrine screenings, and comprehensive elder care monthly subscriptions designed for optimized families.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: 'hp-premium',
                  title: 'MedZiva Platinum Comprehensive Pack',
                  desc: 'Our gold standard full physical evaluation. Covers full profile lipids, diabetes checks, liver/kidney counts, heavy vitamins profile, and an at-home clinician consult.',
                  bullets: ['Complete lipid panel & HbA1c', 'Liver & kidney metrics assessment', 'Clinician visiting consult included', 'Qualified blood sample collection'],
                  price: 499,
                  oldPrice: 650,
                  tag: 'Most Popular'
                },
                {
                  id: 'hp-cardiac',
                  title: 'Cardiac Hazard Prevention Bundle',
                  desc: 'A diagnostic profile targeting coronary risk parameters. Identifies high density lipid levels, specific cardiac proteins, uric index, and high tension blood pressure evaluations.',
                  bullets: ['Total lipids & triglycerides index', 'High tension readings auditing', 'Uric acid indicators check', 'DHA approved physical analysis'],
                  price: 349,
                  oldPrice: 480,
                  tag: 'Coronary Vetted'
                },
                {
                  id: 'hp-fitness',
                  title: 'Elite Fitness and Body Mass Audit',
                  desc: 'Constructed for athletes or customers during body composition tracking. Monitors endocrine indices, creatine, basic lipid metabolism, and thyroid indicators.',
                  bullets: ['Thyroid profile & hormonal check', 'Creatine counts auditing', 'Safe home visit drawn vial', 'Metabolic rate overview report'],
                  price: 299,
                  oldPrice: 399,
                  tag: 'Metabolism Vetted'
                },
                {
                  id: 'hp-male-tumour-marker',
                  sectionId: 'mens-health-packages-section',
                  title: 'Cancer / Tumour Marker Profile (Male)',
                  desc: 'Screening profile for men focused on cancer risk markers and early detection through at-home sample collection.',
                  bullets: ['AFP', 'Total hCG', 'CA 19-9', 'CBC (19)', 'Prostate Profile: PSA Total, PSA Free, PSA Ratio'],
                  price: 260,
                  tag: "Men's Health",
                  who: 'Men for cancer screening & early detection',
                  prep: 'No fasting required',
                  result: 'Same day / Next day'
                }
              ].map((pack) => (
                <div 
                  key={pack.id}
                  id={pack.sectionId}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between scroll-mt-32"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-purple-50 text-purple-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-purple-100">
                        {pack.tag}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-blue-950 leading-snug mb-2">{pack.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal mb-5">{pack.desc}</p>
                    {(pack.who || pack.prep || pack.result) && (
                      <div className="space-y-2 mb-5">
                        {pack.who && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-extrabold text-blue-950">Who:</span> {pack.who}
                          </p>
                        )}
                        {pack.prep && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-extrabold text-blue-950">Prep:</span> {pack.prep}
                          </p>
                        )}
                        {pack.result && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-extrabold text-blue-950">Result:</span> {pack.result}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bullet elements */}
                    <div className="space-y-2 mb-6">
                      {pack.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block leading-none uppercase">Full package cost</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-base font-black text-medical-green leading-none">AED {formatAedWhole(pack.price)}</span>
                        {pack.oldPrice && (
                          <span className="text-xs font-medium text-slate-400 line-through leading-none">AED {formatAedWhole(pack.oldPrice)}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => triggerServiceBooking(pack.title, pack.price)}
                      className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all shrink-0"
                    >
                      Book Package Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated view: WELLNESS Page */}
        {activeTab === 'wellness' && !activeSectionId && (
          <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">Additional Healthcare Services</span>
              <h1 className="text-3xl font-black text-blue-950">Other Services</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Explore our medical tourism facilitation and shipping crew health services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleTabChange('wellness', 'medical-tourism-section')}
                className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all text-left cursor-pointer"
              >
                <div className="relative h-48 rounded-2xl overflow-hidden mb-5 border border-slate-100">
                  <img
                    src={medicalTourismImg}
                    alt="Medical Tourism Facilitation"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h2 className="text-lg font-extrabold text-blue-950 mb-2">Medical Tourism Facilitation</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  End-to-end medical tourism coordination — from hospital selection to post-treatment care.
                </p>
                <span className="inline-flex items-center gap-1.5 text-medical-green text-xs font-bold">
                  View Services →
                </span>
              </button>

              <button
                onClick={() => handleTabChange('wellness', 'shipping-crews-section')}
                className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all text-left cursor-pointer"
              >
                <div className="relative h-48 rounded-2xl overflow-hidden mb-5 border border-slate-100">
                  <img
                    src={shippingCrewImg}
                    alt="Medical Facilitation for Shipping Crews"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h2 className="text-lg font-extrabold text-blue-950 mb-2">Medical Facilitation for Shipping Crews</h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Comprehensive medical support for shipping crew members — fitness exams, consultations, and clearance.
                </p>
                <span className="inline-flex items-center gap-1.5 text-medical-green text-xs font-bold">
                  View Services →
                </span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'wellness' && activeSectionId === 'medical-tourism-section' && (
          <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <h1 className="text-3xl font-black text-blue-950">Medical Tourism Facilitation</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Comprehensive medical tourism coordination from start to finish.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs mb-8 flex flex-col md:flex-row overflow-hidden">
              <div className="relative h-44 md:h-auto md:w-2/5 shrink-0">
                <img
                  src={medicalTourismImg}
                  alt="Medical Tourism Facilitation"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-1">
                <ul className="space-y-2 mb-5">
                  {[
                    'Identification of suitable hospitals and doctors',
                    'Appointment scheduling with specialists',
                    'Treatment plan coordination',
                    'Pre-admission support and documentation assistance',
                    'Medical visa guidance and documentation support',
                    'Travel planning and coordination',
                    'Medical document management',
                    'Language and communication support',
                    'Post-treatment follow-up consultations',
                    'Home healthcare arrangements after discharge',
                    'Rehabilitation and physiotherapy support',
                    'Remote health monitoring and teleconsultations',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-medical-green shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => triggerServiceEnquiry('Medical Tourism Facilitation')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 px-8 rounded-xl cursor-pointer transition-all flex items-center gap-2 self-start"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enquire Now
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wellness' && activeSectionId === 'shipping-crews-section' && (
          <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <h1 className="text-3xl font-black text-blue-950">Medical Facilitation for Shipping Crews</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Comprehensive medical support tailored for shipping crew members.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs mb-8 flex flex-col md:flex-row overflow-hidden">
              <div className="relative h-44 md:h-auto md:w-2/5 shrink-0">
                <img
                  src={shippingCrewImg}
                  alt="Medical Facilitation for Shipping Crews"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-1">
                <ul className="space-y-2 mb-5">
                  {[
                    'Medical Fitness Examination for OGUK / OEUK / Seafarers Medical / Qatar Energy Requirements',
                    'Medical Consultations for Crew Members',
                    'Diagnostic and Laboratory Services',
                    'Emergency Medical Assistance',
                    'Hospital and Specialist Referrals',
                    'Medical Fitness and Clearance Services',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-medical-green shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => triggerServiceEnquiry('Medical Facilitation for Shipping Crews')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 px-8 rounded-xl cursor-pointer transition-all flex items-center gap-2 self-start"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enquire Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated view: OFFERS Page */}
        {activeTab === 'offers' && (
          <div id="offers-section" className="max-w-7xl mx-auto py-10 px-4 text-left scroll-mt-32">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">MedZiva Wellness Campaigns</span>
              <h1 className="text-3xl font-black text-blue-950">Active Promo Code</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Copy the code and apply it during checkout for savings on MedZiva products and services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { code: 'MEDZIVA10', percent: '10%', text: 'Get 10% off any product or service, up to AED 100.' }
              ].map((promo, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-3xl border border-dashed border-slate-350 p-6 flex flex-col justify-between hover:shadow-lg transition-all text-left relative overflow-hidden"
                >
                  {/* Decorative dot shape cutout of standard coupon */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-slate-50 border border-slate-300 rounded-full w-6 h-6" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-slate-50 border border-slate-300 rounded-full w-6 h-6" />

                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded">
                        {promo.percent} OFF
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Expires this month</span>
                    </div>

                    <p className="text-xs text-slate-600 mb-6 font-medium leading-relaxed">
                      {promo.text}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="font-mono font-bold text-sm text-blue-950 uppercase tracking-wider">{promo.code}</span>
                    <button
                      onClick={() => copyCouponCode(promo.code)}
                      className="bg-slate-100 p-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    >
                      {copiedCoupon === promo.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-medical-green" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated view: PROVIDERS Sign Up */}
        {activeTab === 'providers' && (
          <div className="max-w-3xl mx-auto py-12 px-4 text-left">
            <div className="bg-medical-blue text-white p-6 sm:p-10 rounded-t-3xl text-center relative overflow-hidden">
              <h1 className="text-2xl sm:text-3xl font-black">Partner with Us</h1>
            </div>

            <div className="bg-white rounded-b-3xl border border-slate-200 border-t-0 p-6 sm:p-8 space-y-6">
              {providerApplied ? (
                <div className="bg-emerald-50/75 border border-emerald-100 rounded-2xl p-6 text-center space-y-3.5">
                  <div className="w-12 h-12 bg-emerald-100/70 text-medical-green rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="font-extrabold text-medical-blue text-base">Application Dispatched Safely</h4>
                  <p className="text-xs text-slate-500 leading-normal max-w-md mx-auto">
                    MedZiva clinical partner application successfully stored. Our team will contact you within 48 hours.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-sm sm:text-base font-extrabold text-medical-blue border-b border-slate-100 pb-2.5">
                    Registration
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">First Name</label>
                      <input type="text" placeholder="e.g. Salim" required className="w-full text-xs border border-slate-200 rounded-xl p-3" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Mobile Number</label>
                      <PhoneInput
                        value={providerPhone}
                        onChange={setProviderPhone}
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-600">Email Address</label>
                      <input type="email" placeholder="e.g. clinician@example.com" required className="w-full text-xs border border-slate-200 rounded-xl p-3" value={providerEmail} onChange={(e) => setProviderEmail(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">Primary Specialization</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Nursing Care at Home',
                        'Physiotherapy at Home',
                        'Doctor on Call',
                        'Speech and Language Therapy',
                        'Occupational Therapy',
                        'IV Therapy',
                        'Long-Term Care',
                        'Lab Tests at Home',
                        'Medical Devices for Rent',
                        'Medical Tourism',
                        'Medical Facilitation for Shipping Crews',
                        'Other',
                      ].map((spec) => (
                        <label key={spec} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                          <input
                            type="checkbox"
                            value={spec}
                            checked={providerSpecializations.includes(spec)}
                            onChange={(e) => {
                              setProviderSpecializations((prev) =>
                                e.target.checked ? [...prev, spec] : prev.filter((s) => s !== spec)
                              );
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-medical-green focus:ring-medical-green"
                          />
                          {spec}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!providerName.trim() || !providerPhone.trim() || !providerEmail.trim()) {
                        triggerToast('Please fill in all fields.');
                        return;
                      }
                      try {
                        await api.post('/api/enquiries', {
                          body: {
                            name: providerName.trim(),
                            email: providerEmail.trim(),
                            message: `Provider Registration: ${providerName.trim()} | Phone: ${providerPhone.trim()} | Specializations: ${providerSpecializations.join(', ')}`,
                            serviceTitle: 'Provider Registration',
                          },
                        });
                       } catch {
                      }
                      setProviderApplied(true);
                    }}
                    className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all shadow-md text-center cursor-pointer"
                  >
                    SUBMIT
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Dedicated view: HELP & SUPPORT FAQs page */}
        {activeTab === 'support' && (
          <div className="max-w-4xl mx-auto py-12 px-4 text-left">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">Help Desk</span>
              <h1 className="text-3xl font-black text-blue-950">Customer Support &amp; FAQs Center</h1>
              <p className="text-slate-500 text-sm mt-1">
                Answers about bookings, cancellations, payments, accounts, services, privacy, and legal matters.
              </p>
            </div>

            <div className="space-y-8">
              {FAQ_SECTIONS.map((section) => (
                <section key={section.title}>
                  <h2 className="text-lg font-black text-blue-950 mb-3">{section.title}</h2>
                  <div className="space-y-3.5">
                    {section.items.map((faq) => (
                      <div key={faq.question} className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs">
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#11224D] mb-2 flex items-center gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{faq.question}</span>
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed pl-5">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Support ticket submission form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 mt-10 space-y-4">
              {supportSubmitted ? (
                <div className="bg-emerald-50/75 border border-emerald-100 rounded-2xl p-6 text-center space-y-2">
                  <div className="w-10 h-10 bg-emerald-100/70 text-medical-green rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <h4 className="font-extrabold text-medical-blue text-sm">Message Dispatched Safely</h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Our lead care coordinator has received your notes and will coordinate with you via WhatsApp or telephone within 15 minutes.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#11224D] border-b border-slate-100 pb-2">
                    Send Direct Message to Care Coordinator
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Your Name" value={supportName} onChange={(e) => setSupportName(e.target.value)} className="text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
                    <input type="email" placeholder="Your Email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
                  </div>
                  <textarea placeholder="Write detail of your support request..." rows={3} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} className="w-full text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
                  <button
                    onClick={async () => {
                      if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) {
                        triggerToast('Please fill in all fields.');
                        return;
                      }
                      try {
                        await api.post('/api/enquiries', {
                          body: {
                            name: supportName.trim(),
                            email: supportEmail.trim(),
                            message: supportMessage.trim(),
                            serviceTitle: 'Support Request',
                          },
                        });
                       } catch {
                      }
                      setSupportSubmitted(true);
                    }}
                    className="bg-medical-green hover:bg-emerald-600 text-white text-xs font-bold py-3.5 px-6 rounded-xl cursor-pointer transition-all"
                  >
                    Send Support Signal
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="max-w-4xl mx-auto py-12 px-4 text-left">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">Legal</span>
              <h1 className="text-3xl font-black text-blue-950">Privacy Policy</h1>
            </div>
            <div className="space-y-6">
              {PRIVACY_SECTIONS.map((section) => (
                <section key={section.title} className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
                  <h2 className="text-base font-black text-blue-950 mb-3">{section.title}</h2>
                  <div className="space-y-3">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm text-slate-600 leading-7">{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="max-w-4xl mx-auto py-12 px-4 text-left">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">Dubai, United Arab Emirates</span>
              <h1 className="text-3xl font-black text-blue-950">Terms &amp; Conditions</h1>
            </div>
            <div className="space-y-5">
              {TERMS_SECTIONS.map((section) => (
                <section id={section.id} key={section.title} className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 scroll-mt-32">
                  <h2 className="text-base font-black text-blue-950 mb-3">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="text-sm text-slate-600 leading-7 mb-3 last:mb-0">{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 leading-6">
                      {section.bullets.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto py-12 px-4 text-left">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">About Us</span>
              <h1 className="text-3xl font-black text-blue-950">MedZiva International Healthcare L.L.C</h1>
            </div>

            <div className="space-y-8">
              <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
                <h2 className="text-base font-black text-blue-950 mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-medical-green" />
                  Who We Are
                </h2>
                <p className="text-sm text-slate-600 leading-7">
                  MedZiva is a premium healthcare marketplace based in Dubai, United Arab Emirates. We connect patients with DHA compliant healthcare providers, enabling seamless booking of home healthcare services, lab tests at home, IV therapy, physiotherapy, and medical equipment rental.
                </p>
                <p className="text-sm text-slate-600 leading-7 mt-3">
                  As an aggregator and booking facilitation platform, MedZiva does not directly provide medical services. All healthcare services are delivered by independent, licensed third-party providers who meet Dubai Health Authority (DHA) standards.
                </p>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
                <h2 className="text-base font-black text-blue-950 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-medical-green" />
                  Our Services
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: <Home className="w-4 h-4" />, title: 'Home Healthcare', desc: 'Nursing care, doctor on call, long-term care, and specialized medical support at your doorstep.' },
                    { icon: <Beaker className="w-4 h-4" />, title: 'Lab Tests at Home', desc: 'Routine blood tests, preventive health packages, STD screening, and genetic testing with home sample collection.' },
                    { icon: <Activity className="w-4 h-4" />, title: 'Physiotherapy', desc: 'At-home physiotherapy sessions for recovery, rehab, and chronic pain management.' },
                    { icon: <HeartPulse className="w-4 h-4" />, title: 'IV Therapy', desc: 'Nurse-administered IV nutrient drips, energy infusions, and premium NAD+ therapy.' },
                    { icon: <UserCircle className="w-4 h-4" />, title: 'Speech & Occupational Therapy', desc: 'Specialized therapy sessions for children and adults at home.' },
                    { icon: <ShoppingCart className="w-4 h-4" />, title: 'Medical Equipment', desc: 'Rent certified medical equipment including hospital beds, oxygen concentrators, and monitoring devices.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 bg-medical-green/10 rounded-lg flex items-center justify-center text-medical-green shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-blue-950 mb-1">{item.title}</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
                <h2 className="text-base font-black text-blue-950 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-medical-green" />
                  Our Commitment
                </h2>
                <div className="space-y-3">
                  {[
                    { label: 'Licensed Providers', desc: 'Healthcare providers on our platform hold valid DHA and relevant authority licenses where applicable.' },
                    { label: 'Data Privacy', desc: 'We implement strict data protection standards to safeguard your personal and health information.' },
                    { label: 'Transparent Pricing', desc: 'All service prices are displayed upfront. No hidden charges or surprise fees.' },
                    { label: 'Quality Assurance', desc: 'We vet all providers through a rigorous onboarding process to ensure consistent care quality.' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-medical-green shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-extrabold text-blue-950">{item.label}: </span>
                        <span className="text-xs text-slate-600">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
                <h2 className="text-base font-black text-blue-950 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-medical-green" />
                  Contact Us
                </h2>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-medical-green shrink-0" />
                    <span>Al Gaizi Plaza, Al Garhoud, Dubai, UAE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-medical-green shrink-0" />
                    <a href="tel:+971559510794" className="hover:text-medical-green transition-colors">+971 55 951 0794</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-medical-green shrink-0" />
                    <a href="mailto:info@medzivahealthcare.com" className="hover:text-medical-green transition-colors">info@medzivahealthcare.com</a>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        <AnimatePresence>
          {serviceDetails && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => setServiceDetails(null)}
                  className="absolute right-3 top-3 z-20 rounded-full bg-white p-2 text-slate-600 shadow-lg hover:text-slate-900 cursor-pointer"
                  aria-label="Close service details"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="h-44 shrink-0 bg-slate-100 sm:h-52">
                  <img
                    src={getServiceImage(serviceDetails)}
                    alt={serviceDetails.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(event) => handleServiceImageError(event, serviceDetails)}
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
                  <div>
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-medical-green">
                      {serviceDetails.category.replaceAll('-', ' ')}
                    </span>
                    <h2 className="mt-3 text-xl font-black leading-tight text-blue-950 sm:text-2xl">
                      {serviceDetails.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {serviceDetails.fullDescription || serviceDetails.description}
                    </p>
                  </div>

                  {serviceDetails.inclusions?.length ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Included</h3>
                      <div className="space-y-2">
                        {serviceDetails.inclusions.map((item) => (
                          <div key={item} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-medical-green" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {getVisibleServiceDetailAttributes(serviceDetails).length ? (
                    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      {getVisibleServiceDetailAttributes(serviceDetails).map(([label, value]) => (
                        <div key={label}>
                          <h3 className="mb-1 text-xs font-black uppercase tracking-wider text-slate-500">{label}</h3>
                          <p className="whitespace-pre-line text-xs leading-5 text-slate-600">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-blue-50 p-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Starting Price</p>
                      <p className="text-2xl font-black text-medical-green">
                        {serviceDetails.price > 0 ? `FROM AED ${formatAedWhole(serviceDetails.price)}` : 'Enquiry Only'}
                      </p>
                    </div>
                    {serviceDetails.bookingNotice && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-medical-green" />
                        {serviceDetails.bookingNotice}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setServiceDetails(null)}
                      className="w-full rounded-xl border-2 border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:w-32 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = serviceDetails;
                        setServiceDetails(null);
                        if (selected.enquiryOnly || selected.price <= 0) {
                          triggerServiceEnquiry(selected.title);
                        } else {
                          triggerServiceBooking(selected.title, selected.price, selected.category === 'lab-tests-at-home');
                        }
                      }}
                      className="flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-medical-green px-5 py-3 text-xs font-extrabold text-white hover:bg-emerald-600 cursor-pointer"
                    >
                      <CalendarClock className="h-4 w-4" />
                      {serviceDetails.enquiryOnly || serviceDetails.price <= 0 ? 'ENQUIRE' : 'CONFIRM & BOOK'}
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
            onClick={() => handleTabChange('home')}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              activeTab === 'home' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {activeTab === 'home' && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">🏠</span>
            <span className="relative z-10 text-[10px] font-bold">Home</span>
          </button>
          <button
            onClick={() => {
              handleTabChange('services');
              window.setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }, 0);
            }}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              activeTab === 'services' || activeTab === 'lab-tests' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {(activeTab === 'services' || activeTab === 'lab-tests') && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">🩺</span>
            <span className="relative z-10 text-[10px] font-bold">Services</span>
          </button>
          <button
            onClick={() => {
              handleTabChange('products');
              window.setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }, 0);
            }}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              activeTab === 'products' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {activeTab === 'products' && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">🛒</span>
            <span className="relative z-10 text-[10px] font-bold">Shop</span>
          </button>
          <button
            onClick={() => handleTabChange('wellness')}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              activeTab === 'wellness' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {activeTab === 'wellness' && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">❤️</span>
            <span className="relative z-10 text-[10px] font-bold">Other Services</span>
          </button>
          <button
            onClick={() => handleTabChange('offers')}
            className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl cursor-pointer ${
              activeTab === 'offers' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            {activeTab === 'offers' && <motion.span layoutId="mobile-active-tab" className="absolute inset-0 rounded-xl bg-emerald-50" />}
            <span className="relative z-10 text-[22px] leading-none" aria-hidden="true">🎁</span>
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
      <Footer onNavigationClick={handleTabChange} />

      {/* 6. Sliding Side Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        loggedInUser={loggedInUser}
        loggedInUserEmail={loggedInUserEmail}
        loggedInUserPhone={loggedInUserPhone}
        loggedInUserAddress={loggedInUserAddress}
        onAuthOpen={() => setIsAuthOpen(true)}
      />

      {/* 7. Interactive Scheduling Wizard dialog */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setPreselectedServiceTitle('');
          setPreselectedPrice(0);
          setBookingIsLabTest(false);
        }}
        preselectedServiceTitle={preselectedServiceTitle}
        preselectedPrice={preselectedPrice}
        isLabTest={bookingIsLabTest}
        loggedInUser={loggedInUser}
        loggedInUserEmail={loggedInUserEmail}
        loggedInUserPhone={loggedInUserPhone}
        onSuccessToast={triggerToast}
        onBookingSuccess={() => {
          setIsBookingOpen(false);
          setPreselectedServiceTitle('');
          setPreselectedPrice(0);
          setBookingIsLabTest(false);
          setShowBookingSuccess(true);
        }}
      />

      {/* 7.5 Interactive Hospital Service Enquiry dialog */}
      <EnquiryModal 
        isOpen={isEnquiryOpen}
        onClose={() => {
          setIsEnquiryOpen(false);
          setPreselectedEnquiryServiceTitle('');
        }}
        preselectedServiceTitle={preselectedEnquiryServiceTitle}
        onSuccessToast={triggerToast}
        loggedInUser={loggedInUser}
        loggedInUserEmail={loggedInUserEmail}
        loggedInUserPhone={loggedInUserPhone}
      />

      {/* 8. HIPAA Secured User Authentication dialog */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(username, email) => {
          setLoggedInUser(username);
          setLoggedInUserEmail(email);
          setIsAuthOpen(false);
          triggerToast(`Profile successfully loaded: Welcome back, ${username}!`);
        }}
      />

      {/* 8.5 Personal Patient Profile modal */}
      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        fullName={loggedInUser || ''}
        email={loggedInUserEmail}
        phone={loggedInUserPhone}
        address={loggedInUserAddress}
        onSave={(updatedName, updatedEmail, updatedPhone, updatedAddress) => {
          setLoggedInUser(updatedName);
          setLoggedInUserEmail(updatedEmail);
          setLoggedInUserPhone(updatedPhone);
          setLoggedInUserAddress(updatedAddress);
        }}
        onSuccessToast={triggerToast}
      />

      {/* 9. Rental Equipment Booking modal */}
      <RentalBookingModal
        isOpen={isRentalOpen}
        onClose={() => { setIsRentalOpen(false); setSelectedRentalProduct(null); }}
        product={selectedRentalProduct}
        onSuccessToast={triggerToast}
        loggedInUser={loggedInUser}
        loggedInUserEmail={loggedInUserEmail}
        loggedInUserPhone={loggedInUserPhone}
        loggedInUserAddress={loggedInUserAddress}
      />

    </div>
  );
}
