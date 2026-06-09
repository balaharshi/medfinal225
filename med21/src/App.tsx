/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Search, 
  User, 
  Phone, 
  Menu, 
  X, 
  CalendarClock, 
  CheckCircle2, 
  Home, 
  Activity, 
  Beaker, 
  UserCircle, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Compass, 
  Flame, 
  Sparkles, 
  BadgeCheck, 
  Lock, 
  CreditCard, 
  HelpCircle, 
  Check, 
  PhoneCall, 
  ArrowUpRight, 
  Award, 
  Copy,
  ChevronDown,
  MessageCircle
} from 'lucide-react';

// Static Data and Types
import { SERVICE_CATEGORIES, PRODUCTS, HEALTHCARE_SERVICES, DUBAI_LOCATIONS } from './data';
import { ActiveTab, CartItem, Product, HealthcareService } from './types';

// UI Components
import HeaderTopBar from './components/HeaderTopBar';
import MainHeader from './components/MainHeader';
import NavigationMenu from './components/NavigationMenu';
import HeroSection from './components/HeroSection';
import ServicesSection from './components/ServicesSection';
import ProductsSection from './components/ProductsSection';
import PromotionalBanners from './components/PromotionalBanners';
import TrustFeatures from './components/TrustFeatures';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import BookingModal from './components/BookingModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import AdminDashboard from './components/AdminDashboard';
import VendorDashboard from './components/VendorDashboard';
import EnquiryModal from './components/EnquiryModal';

export default function AppWrapper() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/admin" element={<AdminDashboardApp />} />
          <Route path="/vendor" element={<VendorDashboardApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
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

function AdminDashboardApp() {
  const [db, setDb] = useState({
    categories: [],
    products: [],
    services: []
  });
  const triggerToast = (msg: string) => {
    toast.success(msg);
  };

  const fetchDb = async () => {
    try {
      const [catRes, prodRes, srvRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
        fetch('/api/services')
      ]);

      if (catRes.ok) {
        const categories = await catRes.json();
        setDb(prev => ({ ...prev, categories }));
      }
      if (prodRes.ok) {
        const products = await prodRes.json();
        setDb(prev => ({ ...prev, products }));
      }
      if (srvRes.ok) {
        const services = await srvRes.json();
        setDb(prev => ({ ...prev, services }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

function MainApp() {
  // Core Platform States
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(DUBAI_LOCATIONS[0]);

  // Drawer & Overlay Triggers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [showBottomServicesMenu, setShowBottomServicesMenu] = useState(false);
  const [showBottomHomeHealthcareMenu, setShowBottomHomeHealthcareMenu] = useState(false);
  const [showBottomLabTestsMenu, setShowBottomLabTestsMenu] = useState(false);

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
  const [preselectedEnquiryServiceTitle, setPreselectedEnquiryServiceTitle] = useState('');

  // Authenticated profile state is kept in memory so personal data is not exposed in browser storage.
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string>('');
  const [loggedInUserPhone, setLoggedInUserPhone] = useState<string>('');
  const [loggedInUserAddress, setLoggedInUserAddress] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) return;

        const data = await response.json();
        if (data?.user?.role !== 'customer') return;

        setLoggedInUser(data.user.fullName || '');
        setLoggedInUserEmail(data.user.email || '');
        setLoggedInUserPhone(data.user.phone || '');
        setLoggedInUserAddress(data.user.address || '');
      } catch (error) {
        console.error('Failed to restore customer session', error);
      }
    };

    restoreCustomerSession();
  }, []);

  // Success Feedback state variables
  const [providerApplied, setProviderApplied] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);

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
    // Temporarily disabled to use local data only
    // try {
    //   const response = await fetch('/api/db');
    //   if (response.ok) {
    //     const data = await response.json();
    //     setDb({
    //       categories: data.categories || SERVICE_CATEGORIES,
    //       products: data.products || PRODUCTS,
    //       services: data.services || HEALTHCARE_SERVICES
    //     });
    //   }
    // } catch (e) {
    //   console.error("Failed to load live backend database, using static fallback:", e);
    // }
  };

  useEffect(() => {
    fetchDb();
  }, []);

  // Search filter query lookup helper
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return db.products;
    const query = searchQuery.toLowerCase();
    return db.products.filter(
      p => p.name.toLowerCase().includes(query) || 
           p.subtitle.toLowerCase().includes(query) || 
           p.brand?.toLowerCase().includes(query)
    );
  }, [searchQuery, db.products]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return db.services;
    const query = searchQuery.toLowerCase();
    return db.services.filter(
      s => s.title.toLowerCase().includes(query) || 
           s.description.toLowerCase().includes(query) || 
           s.category.toLowerCase().includes(query)
    );
  }, [searchQuery, db.services]);

  // Cart Interactions
  const handleAddToCart = (product: Product | HealthcareService) => {
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
  const triggerServiceBooking = (serviceTitle: string, price: number) => {
    if (!loggedInUser) {
      triggerToast('Please log in with your customer account first to proceed with booking.');
      setIsAuthOpen(true);
      return;
    }
    setPreselectedServiceTitle(serviceTitle);
    setPreselectedPrice(price);
    setIsBookingOpen(true);
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
    setShowBottomServicesMenu(false);
    setShowBottomHomeHealthcareMenu(false);
    setShowBottomLabTestsMenu(false);
    setActiveTab(tab);
    setActiveSectionId(sectionId || null);

    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  // Copy offer coupons text
  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => {
      setCopiedCoupon(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all selection:bg-teal-500 selection:text-white">
      
      {/* 1. Dark Blue Top bar announcement element */}
      <HeaderTopBar />

      {/* 2. Interactive Main medical branding header */}
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
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        searchQuery={searchQuery}
        onSearchQueryChange={(query) => {
          setSearchQuery(query);
          // Auto route to appropriate listing view if search begins
          if (query.trim().length > 0 && activeTab === 'home') {
            setActiveTab('products');
          }
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

      {/* 4. Display Core layouts based on dynamic state ActiveTab */}
      <main className="flex-grow">
        
        {activeTab === 'home' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-0"
          >
            {/* Hero Banner Grid */}
            <HeroSection 
              onBookServiceClick={() => {
                if (!loggedInUser) {
                  triggerToast('Please log in with your customer account first to proceed with booking.');
                  setIsAuthOpen(true);
                  return;
                }
                setPreselectedServiceTitle('');
                setPreselectedPrice(0);
                setIsBookingOpen(true);
              }}
              onExploreProductsClick={() => handleTabChange('products')}
            />

            {/* Popular Healthcare Services carousel */}
            <ProductsSection 
              onServiceSelect={triggerServiceBooking}
              onServiceEnquire={triggerServiceEnquiry}
              onAddToCart={handleAddToCart}
              onExploreMore={() => handleTabChange('services')}
              servicesList={db.services.filter(s => s.popular)}
            />

            {/* Home Healthcare Services slide container */}
            <ServicesSection 
              onServiceSelect={triggerServiceBooking}
              onServiceEnquire={triggerServiceEnquiry}
              onAddToCart={handleAddToCart}
              onExploreMore={() => handleTabChange('services')}
              categoriesList={db.categories}
              servicesList={db.services}
              overlapHero={false}
            />

            {/* Popular Products section */}
            <section className="bg-white py-12 px-4 border-b border-slate-100">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="text-left">
                    <div className="h-5 mb-1" aria-hidden="true" />
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-medical-blue">
                      Popular Products
                    </h2>
                  </div>
                  <button
                    onClick={() => handleTabChange('products')}
                    className="text-xs sm:text-sm font-bold text-medical-green hover:text-emerald-700 hover:underline transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all products</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {db.products.slice(0, 4).map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-slate-50 rounded-2xl border border-slate-150/70 p-4 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-36 w-full flex items-center justify-center rounded-xl overflow-hidden mb-4 bg-white relative">
                          <img src={prod.image} alt={prod.name} className="max-h-28 max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                          <span className="absolute top-2 left-2 bg-emerald-50 border border-emerald-100 text-medical-green text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                            Popular
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          {prod.brand || 'Medziva Store'}
                        </span>
                        <h3 className="text-sm font-extrabold text-blue-950 mt-0.5 leading-snug line-clamp-1">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4 line-clamp-2 min-h-[32px]">
                          {prod.subtitle}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-medical-green">AED {prod.price}</span>
                            <span className="text-[10px] font-medium text-slate-400 line-through">AED {prod.originalPrice}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 leading-none mt-1 font-semibold">Express delivery available</span>
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
              onHealthPackClick={() => handleTabChange('health-packages')}
              onLabClick={() => handleTabChange('lab-tests')}
              onRentClick={() => handleTabChange('products')}
              onOffersClick={() => handleTabChange('offers')}
            />

            {/* Direct Vetted Safety guarantees */}
            <TrustFeatures />
          </motion.div>
        )}

        {/* Dedicated view: SERVICES catalog page */}
        {activeTab === 'services' && (
          <div id="home-healthcare-section" className="max-w-7xl mx-auto py-10 px-4 text-left page-section scroll-mt-32">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">Medziva home visits</span>
              <h1 className="text-3xl font-black text-blue-950">At-Home Vetted Vistation Services</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                DHA-certified nurse visitations, home physiotherapists, elderly support providers, speech therapists, and child wellness companions available around the clock.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((srv, index) => {
                const isFirstPhysiotherapy = srv.category === 'physiotherapy' && filteredServices.findIndex((item) => item.category === 'physiotherapy') === index;
                const isFirstDoctorOnCall = srv.category === 'doctor-on-call' && filteredServices.findIndex((item) => item.category === 'doctor-on-call') === index;
                const isFirstLongTermCare = (srv.id.includes('longterm') || srv.title.toLowerCase().includes('long-term')) && filteredServices.findIndex((item) => item.id.includes('longterm') || item.title.toLowerCase().includes('long-term')) === index;
                const isFirstTherapyService = (srv.category === 'speech-therapy' || srv.category === 'occupational-therapy') && filteredServices.findIndex((item) => item.category === 'speech-therapy' || item.category === 'occupational-therapy') === index;
                const isFirstIvTherapy = srv.category === 'iv-therapy' && filteredServices.findIndex((item) => item.category === 'iv-therapy') === index;
                const sectionAnchorId =
                  isFirstPhysiotherapy ? 'physiotherapy-section' :
                  isFirstDoctorOnCall ? 'doctor-on-call-section' :
                  isFirstLongTermCare ? 'long-term-care-section' :
                  isFirstTherapyService ? 'therapy-services-section' :
                  isFirstIvTherapy ? 'iv-therapy-section' :
                  undefined;
                return (
                <div 
                  key={srv.id} 
                  id={sectionAnchorId}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between scroll-mt-32"
                >
                  <div>
                    <div className="relative h-44 rounded-2xl overflow-hidden mb-4 border border-slate-100">
                      <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-slate-800 text-[10.5px] font-extrabold px-3 py-1 rounded-full shadow-md">
                        ⏱️ {srv.duration}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-blue-950 line-clamp-1 mb-1">{srv.title}</h3>
                    <span className="text-[10px] bg-sky-50 text-blue-800 font-bold tracking-wider uppercase px-2 py-0.5 rounded-md inline-block mb-3">
                      {srv.category.replace('-', ' ')}
                    </span>
                    <p className="text-[13px] sm:text-xs text-slate-500 leading-relaxed font-normal mb-5">{srv.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block leading-none uppercase">Starts from</span>
                      <span className="text-base font-black text-medical-green mt-1 block">AED {srv.price}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(srv)}
                        className="bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex-grow text-center whitespace-nowrap"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => triggerServiceBooking(srv.title, srv.price)}
                        className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs py-3 px-4 rounded-xl cursor-pointer transition-all active:scale-95 flex-grow text-center whitespace-nowrap"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dedicated view: LAB TESTS page */}
        {activeTab === 'lab-tests' && (
          <div id="lab-tests-section" className="max-w-7xl mx-auto py-10 px-4 text-left page-section scroll-mt-32">
            <div id="std-sexual-health-section" className="scroll-mt-32" aria-hidden="true" />
            <div id="specialized-diagnostic-tests-section" className="scroll-mt-32" aria-hidden="true" />
            <div id="genetic-testing-section" className="scroll-mt-32" aria-hidden="true" />
            <div className="border-b border-slate-100 pb-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">Accurate diagnostic reporting</span>
                <h1 className="text-3xl font-black text-blue-950">At-Home Laboratory Diagnostics</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-xl">
                  Save time and prevent clinic queues. Vetted care officers conduct safe blood drawings straight at your dining table, with certified reports matched in 12 hours.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {db.services.filter(s => s.category === 'lab-tests').map((srv, index, list) => {
                const isFirstRoutineBloodTest = srv.subcategory === 'routine-blood-tests' && list.findIndex((item) => item.subcategory === 'routine-blood-tests') === index;
                const labSectionAnchorId = isFirstRoutineBloodTest ? 'routine-blood-tests-section' : undefined;
                return (
                <div 
                  key={srv.id} 
                  id={labSectionAnchorId}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between scroll-mt-32"
                >
                  <div>
                    <div className="relative h-44 rounded-2xl overflow-hidden mb-4 border border-slate-100">
                      <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-3 right-3 bg-red-50 text-red-600 text-[10.5px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        Partner Vetted Labs
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-blue-950 line-clamp-1 mb-1">{srv.title}</h3>
                    <p className="text-[13px] sm:text-xs text-slate-500 leading-relaxed font-normal mb-5">{srv.description}</p>
                    {(srv.who || srv.prep || srv.result) && (
                      <div className="space-y-2 mb-5">
                        {srv.who && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-extrabold text-blue-950">Who:</span> {srv.who}
                          </p>
                        )}
                        {srv.prep && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-extrabold text-blue-950">Prep:</span> {srv.prep}
                          </p>
                        )}
                        {srv.result && (
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            <span className="font-extrabold text-blue-950">Result:</span> {srv.result}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block leading-none uppercase">Inclusive sample fee</span>
                      <span className="text-base font-black text-medical-green mt-1 block">AED {srv.price}</span>
                    </div>

                    <button
                      onClick={() => triggerServiceBooking(srv.title, srv.price)}
                      className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all"
                    >
                      Book Blood Draw
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dedicated view: PRODUCTS eCommerce Page */}
        {activeTab === 'products' && (
          <div id="products-page-section" className="max-w-7xl mx-auto py-10 px-4 text-left page-section scroll-mt-32">
            <div className="border-b border-slate-100 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-blue-950">Equipment Rental</h1>
                <p className="text-slate-500 text-sm mt-1 max-w-xl">
                  Order certified blood sugar glucometers, digital thermometer readers, posture support belts, oxygenators or isolate whey proteins delivered under UAE free shipping safety.
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
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-44 w-full flex items-center justify-center rounded-2xl overflow-hidden mb-4 bg-slate-50/50 relative">
                        <img src={prod.image} alt={prod.name} className="max-h-36 max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                        <span className="absolute top-2 left-2 bg-emerald-50 border border-emerald-100 text-medical-green text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                          DHA Vetted
                        </span>
                      </div>

                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        {prod.brand || 'Medziva Store'}
                      </span>
                      <h3 className="text-sm font-extrabold text-blue-950 mt-0.5 leading-snug line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4 line-clamp-2 min-h-[32px]">
                        {prod.subtitle}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-medical-green">AED {prod.price}</span>
                          <span className="text-[10px] font-medium text-slate-400 line-through">AED {prod.originalPrice}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 leading-none mt-1 font-semibold">Free Express Shipping available</span>
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
              <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">Medziva comprehensive checkups</span>
              <h1 className="text-3xl font-black text-blue-950">Vetted At-Home Clinical Packages</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Full physical cardiovascular evaluations, diabetes profile bundles, endocrine screenings, and comprehensive elder care monthly subscriptions designed for optimized families.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: 'hp-premium',
                  title: 'Medziva Platinum Comprehensive Pack',
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
                      <span className="text-amber-500 text-xs font-black">★ 4.9 Rating</span>
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
                        <span className="text-base font-black text-medical-green leading-none">AED {pack.price}</span>
                        {pack.oldPrice && (
                          <span className="text-xs font-medium text-slate-400 line-through leading-none">AED {pack.oldPrice}</span>
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
        {activeTab === 'wellness' && (
          <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">Elite lifestyle and fitness directory</span>
              <h1 className="text-3xl font-black text-blue-950">Medziva Wellness &amp; Strength Coaching</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Certified home stretching coordinators, physical kinetic trainers, dietary nutritionists and mental wellness stress counseling designed for absolute restoration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {db.services.filter(s => s.category.includes('trainer') || s.category.includes('mental') || s.category.includes('nutrition') || s.category.includes('physio')).map((srv) => (
                <div 
                  key={srv.id} 
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 rounded-2xl overflow-hidden mb-4 border border-slate-100">
                      <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-3 right-3 bg-medical-blue text-white text-[10px] font-extrabold px-3 py-1 rounded-full">
                        ⏱️ {srv.duration}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-blue-950 line-clamp-1 mb-1">{srv.title}</h3>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold tracking-wider uppercase px-2 py-0.5 rounded-md inline-block mb-3">
                      {srv.category.replace('-', ' ')}
                    </span>
                    <p className="text-[13px] sm:text-xs text-slate-500 leading-relaxed font-normal mb-5">{srv.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block leading-none uppercase">Starting from</span>
                      <span className="text-base font-black text-medical-green mt-1 block">AED {srv.price}</span>
                    </div>

                    <button
                      onClick={() => triggerServiceBooking(srv.title, srv.price)}
                      className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all"
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated view: OFFERS Page */}
        {activeTab === 'offers' && (
          <div id="offers-section" className="max-w-7xl mx-auto py-10 px-4 text-left scroll-mt-32">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">Medziva Wellness Campaigns</span>
              <h1 className="text-3xl font-black text-blue-950">Active Promo Codes &amp; Coupons</h1>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Click any coupon to copy it and apply discounts during your checkout. Stay tuned to weekly health bulletins for more wellness credits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { code: 'DXBHEALTH30', percent: '30%', text: 'Get 30% off any diagnostic lab test. Active for new customer registers.' },
                { code: 'MEDZIVA20', percent: '20%', text: 'Get 20% off any home nursing consultation over 1 hour.' },
                { code: 'RENTAL11', percent: '11%', text: 'Get 11% off heavy hospital-bed or wheelchair rental monthly agreements.' }
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
              <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest block mb-1">Medziva Clinician Roster</span>
              <h1 className="text-2xl sm:text-3xl font-black">Join UAE&apos;s Premium Healthcare Network</h1>
              <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-lg mx-auto">
                Are you a DHA-registered nurse, licensed physiotherapist, speech therapist, or certified care agency? Partner with Medziva to connect with premium customers.
              </p>
            </div>

            <div className="bg-white rounded-b-3xl border border-slate-200 border-t-0 p-6 sm:p-8 space-y-6">
              {providerApplied ? (
                <div className="bg-emerald-50/75 border border-emerald-100 rounded-2xl p-6 text-center space-y-3.5">
                  <div className="w-12 h-12 bg-emerald-100/70 text-medical-green rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="font-extrabold text-medical-blue text-base">Application Dispatched Safely</h4>
                  <p className="text-xs text-slate-500 leading-normal max-w-md mx-auto">
                    Medziva clinical partner application successfully stored. Our regulatory licensing team will reach out to you within 48 hours for verification of your DHA credentials.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-sm sm:text-base font-extrabold text-medical-blue border-b border-slate-100 pb-2.5">
                    Register Your Clinician Vetting Form
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Clinician First Name</label>
                      <input type="text" placeholder="e.g. Salim" className="w-full text-xs border border-slate-200 rounded-xl p-3" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">DHA License Number</label>
                      <input type="text" placeholder="e.g. DHA-LIC-12048" className="w-full text-xs border border-slate-200 rounded-xl p-3" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Primary Specialization</label>
                    <select className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white">
                      <option>At-Home Nursing Care</option>
                      <option>Licensed Physiotherapy</option>
                      <option>Elderly Companion Support</option>
                      <option>At-home blood collection phlebotomy</option>
                      <option>Speech Pathology &amp; Therapy</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProviderApplied(true)}
                    className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all shadow-md text-center cursor-pointer"
                  >
                    SUBMIT PARTNER DOCUMENTATION
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Dedicated view: HELP & SUPPORT FAQ page */}
        {activeTab === 'support' && (
          <div className="max-w-4xl mx-auto py-12 px-4 text-left">
            <div className="border-b border-slate-100 pb-5 mb-8">
              <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">Help Desk</span>
              <h1 className="text-3xl font-black text-blue-950">Customer Support &amp; FAQ Center</h1>
              <p className="text-slate-500 text-sm mt-1">
                Frequently asked queries about our home visits, order dispatches, certified DHA licenses, and money guarantee rules.
              </p>
            </div>

            <div className="space-y-3.5">
              {[
                { q: 'How long does the Medziva nurse or therapist take to arrive?', a: 'Once registered securely through the scheduling wizard, the dispatch completes on the exact date and custom hour selected. On-call providers call 15 minutes before arrival.' },
                { q: 'Are all clinicians officially licensed in United Arab Emirates?', a: 'Yes. Every designated practitioner on the Medziva platform possesses an active registration with the Dubai Health Authority (DHA), has undergone HIPAA medical data reviews, and passed complete criminal background vetting.' },
                { q: 'Is shipping on medical products and rentals always free?', a: 'All eCommerce purchases and rental agreements over AED 49 qualify for 100% free delivery across all residences of Dubai. For orders below, an express charge of AED 15 gets aggregated.' },
                { q: 'How does the 30-day health guarantee work?', a: 'If any clinical equipment you purchase displays mechanical flaws or structural issues, we dispatch an officer to retrieve it and credit complete refunds within 24 working hours.' }
              ].map((faq, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#11224D] mb-2 flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed pl-5 font-normal">
                    {faq.a}
                  </p>
                </div>
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
                    <input type="text" placeholder="Your Name" className="text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
                    <input type="email" placeholder="Your Email" className="text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
                  </div>
                  <textarea placeholder="Write detail of your support request..." rows={3} className="w-full text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
                  <button
                    onClick={() => setSupportSubmitted(true)}
                    className="bg-medical-green hover:bg-emerald-600 text-white text-xs font-bold py-3.5 px-6 rounded-xl cursor-pointer transition-all"
                  >
                    Send Support Signal
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Mobile Bottom Tab Bar - Only visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-2 safe-area-bottom bottom-nav-bar">
        {showBottomServicesMenu && (
          <div className="absolute left-4 right-4 bottom-full mb-2 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
            <button
              onClick={() => setShowBottomHomeHealthcareMenu((current) => !current)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-slate-50 ${
                activeTab === 'services' ? 'bg-teal-50 text-medical-green' : 'text-slate-600'
              }`}
            >
              <span className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-medical-blue" />
                <span className="text-xs font-bold">Home Healthcare</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBottomHomeHealthcareMenu ? 'rotate-180' : ''}`} />
            </button>

            {showBottomHomeHealthcareMenu && (
              <div className="border-b border-slate-50 bg-slate-50/40 py-1">
                {[
                  { label: 'Nursing Care at Home', tab: 'services' as ActiveTab, sectionId: 'home-healthcare-section', icon: Activity },
                  { label: 'Physiotherapy at Home', tab: 'services' as ActiveTab, sectionId: 'physiotherapy-section', icon: Activity },
                  { label: 'Doctor on Call', tab: 'services' as ActiveTab, sectionId: 'doctor-on-call-section', icon: Activity },
                  { label: 'Long-Term / Specialized Care', tab: 'services' as ActiveTab, sectionId: 'long-term-care-section', icon: Activity },
                  { label: 'Therapy Services', tab: 'services' as ActiveTab, sectionId: 'therapy-services-section', icon: Activity },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSectionId === item.sectionId;
                  return (
                    <button
                      key={item.sectionId}
                      onClick={() => handleTabChange(item.tab, item.sectionId)}
                      className={`w-full flex items-center gap-3 px-6 py-2.5 text-left ${
                        isActive ? 'text-medical-green' : 'text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-medical-blue" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => handleTabChange('services', 'iv-therapy-section')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 ${
                activeSectionId === 'iv-therapy-section' ? 'bg-teal-50 text-medical-green' : 'text-slate-600'
              }`}
            >
              <Flame className="w-4 h-4 text-medical-blue" />
              <span className="text-xs font-bold">IV Therapy</span>
            </button>

            <button
              onClick={() => setShowBottomLabTestsMenu((current) => !current)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left ${
                activeTab === 'lab-tests' || activeTab === 'health-packages' ? 'bg-teal-50 text-medical-green' : 'text-slate-600'
              }`}
            >
              <span className="flex items-center gap-3">
                <Beaker className="w-4 h-4 text-medical-blue" />
                <span className="text-xs font-bold">Lab Tests at Home</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showBottomLabTestsMenu ? 'rotate-180' : ''}`} />
            </button>

            {showBottomLabTestsMenu && (
              <div className="bg-slate-50/40 py-1">
                {[
                  { label: 'Routine Blood Tests', tab: 'lab-tests' as ActiveTab, sectionId: 'routine-blood-tests-section', icon: Beaker },
                  { label: 'Preventive Health Packages', tab: 'health-packages' as ActiveTab, sectionId: 'preventive-health-packages-section', icon: Beaker },
                  { label: "Men's Health Packages", tab: 'health-packages' as ActiveTab, sectionId: 'mens-health-packages-section', icon: Beaker },
                  { label: "Women's Health Packages", tab: 'health-packages' as ActiveTab, sectionId: 'womens-health-packages-section', icon: Beaker },
                  { label: 'STD / Sexual Health', tab: 'lab-tests' as ActiveTab, sectionId: 'std-sexual-health-section', icon: Beaker },
                  { label: 'Specialized Diagnostic Tests', tab: 'lab-tests' as ActiveTab, sectionId: 'specialized-diagnostic-tests-section', icon: Beaker },
                  { label: 'Genetic Testing', tab: 'lab-tests' as ActiveTab, sectionId: 'genetic-testing-section', icon: Beaker },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSectionId === item.sectionId;
                  return (
                    <button
                      key={item.sectionId}
                      onClick={() => handleTabChange(item.tab, item.sectionId)}
                      className={`w-full flex items-center gap-3 px-6 py-2.5 text-left ${
                        isActive ? 'text-medical-green' : 'text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-medical-blue" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-start gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTabChange('home')}
            className={`flex min-w-[64px] flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'home' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button
            onClick={() => setShowBottomServicesMenu((current) => !current)}
            className={`flex min-w-[64px] flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'services' || activeTab === 'lab-tests' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-bold">Services</span>
          </button>
          <button
            onClick={() => handleTabChange('products')}
            className={`flex min-w-[64px] flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'products' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-[10px] font-bold">Products</span>
          </button>
          <button
            onClick={() => handleTabChange('wellness')}
            className={`flex min-w-[70px] flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'wellness' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Wellness</span>
          </button>
          <button
            onClick={() => handleTabChange('offers')}
            className={`flex min-w-[64px] flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'offers' ? 'text-medical-green' : 'text-slate-500'
            }`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px] font-bold">Offers</span>
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
      />

      {/* 7. Interactive Scheduling Wizard dialog */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setPreselectedServiceTitle('');
          setPreselectedPrice(0);
        }}
        preselectedServiceTitle={preselectedServiceTitle}
        preselectedPrice={preselectedPrice}
        loggedInUser={loggedInUser}
        loggedInUserEmail={loggedInUserEmail}
        loggedInUserPhone={loggedInUserPhone}
        onSuccessToast={triggerToast}
        onBookingSuccess={() => {
          setIsBookingOpen(false);
          setPreselectedServiceTitle('');
          setPreselectedPrice(0);
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
          setLoggedInUserPhone((prev) => prev || '507654321');
          setLoggedInUserAddress((prev) => prev || 'Villa 15, Al Wasl Road, Umm Suqeim, Dubai');
          setIsAuthOpen(false);
          // High fidelity toast notification trigger instead of alert
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

    </div>
  );
}
