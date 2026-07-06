/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Search, User, ShoppingCart, LogOut, ChevronDown, Menu, X, Home, Activity, Beaker, Flame, Phone } from 'lucide-react';
import { ActiveTab } from '../types';
import ConfirmDialog from './ConfirmDialog';

const newlogo = '/newlogo.png';

interface MainHeaderProps {
  cartCount: number;
  onCartOpen: () => void;
  onBookingOpen: () => void;
  onAuthOpen: () => void;
  onProfileOpen: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  searchHistory: string[];
  onClearSearchHistory: () => void;
  loggedInUser: string | null;
  onLogout: () => void;
  activeTab?: ActiveTab;
  activeSectionId?: string | null;
  onTabChange?: (tab: ActiveTab, sectionId?: string) => void;
}

const mobileHomeHealthcareItems: { label: string; tab: ActiveTab; sectionId: string; icon: typeof Activity }[] = [
  { label: 'Nursing Care at Home', tab: 'services', sectionId: 'home-healthcare-section', icon: Activity },
  { label: 'Physiotherapy at Home', tab: 'services', sectionId: 'physiotherapy-section', icon: Activity },
  { label: 'Doctor on Call', tab: 'services', sectionId: 'doctor-on-call-section', icon: Activity },
  { label: 'Long-Term / Specialized Care', tab: 'services', sectionId: 'long-term-care-section', icon: Activity },
  { label: 'Speech and Language Therapy', tab: 'services', sectionId: 'speech-therapy-section', icon: Activity },
  { label: 'Occupational Therapy', tab: 'services', sectionId: 'occupational-therapy-section', icon: Activity },
  { label: 'IV Therapy', tab: 'services', sectionId: 'iv-therapy-section', icon: Activity },
];

const mobileLabTestsItems: { label: string; tab: ActiveTab; sectionId: string; icon: typeof Beaker }[] = [
  { label: 'Routine Blood Tests', tab: 'lab-tests', sectionId: 'routine-blood-tests-section', icon: Beaker },
  { label: 'Preventive Health Packages', tab: 'lab-tests', sectionId: 'preventive-health-packages-section', icon: Beaker },
  { label: "Men's Health Packages", tab: 'lab-tests', sectionId: 'mens-health-packages-section', icon: Beaker },
  { label: "Women's Health Packages", tab: 'lab-tests', sectionId: 'womens-health-packages-section', icon: Beaker },
  { label: 'STD / Sexual Health', tab: 'lab-tests', sectionId: 'std-sexual-health-section', icon: Beaker },
  { label: 'Specialized Diagnostic Tests', tab: 'lab-tests', sectionId: 'specialized-diagnostic-tests-section', icon: Beaker },
  { label: 'Genetic Testing', tab: 'lab-tests', sectionId: 'genetic-testing-section', icon: Beaker },
];

export default function MainHeader({
  cartCount,
  onCartOpen,
  onBookingOpen,
  onAuthOpen,
  onProfileOpen,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  searchHistory,
  onClearSearchHistory,
  loggedInUser,
  onLogout,
  activeTab,
  activeSectionId,
  onTabChange
}: MainHeaderProps) {
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileServices, setShowMobileServices] = useState(false);
  const [showMobileHomeHealthcare, setShowMobileHomeHealthcare] = useState(false);
  const [showMobileLabTests, setShowMobileLabTests] = useState(false);
  const [showMobileProducts, setShowMobileProducts] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileMenuTop, setMobileMenuTop] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const onSearchSubmitRef = useRef(onSearchSubmit);

  useEffect(() => {
    onSearchSubmitRef.current = onSearchSubmit;
  }, [onSearchSubmit]);

  useEffect(() => {
    if (!showMobileMenu) return undefined;

    const updateMobileMenuTop = () => {
      setMobileMenuTop(headerRef.current?.getBoundingClientRect().bottom || 0);
    };

    updateMobileMenuTop();
    window.addEventListener('resize', updateMobileMenuTop);
    window.addEventListener('orientationchange', updateMobileMenuTop);

    return () => {
      window.removeEventListener('resize', updateMobileMenuTop);
      window.removeEventListener('orientationchange', updateMobileMenuTop);
    };
  }, [showMobileMenu]);

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
    setShowMobileServices(false);
    setShowMobileHomeHealthcare(false);
    setShowMobileLabTests(false);
    setShowMobileProducts(false);
  };

  const handleMobileNavigation = (tab: ActiveTab, sectionId?: string) => {
    closeMobileMenu();
    onTabChange?.(tab, sectionId);
    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 0);
  };

  return (
    <header ref={headerRef} id="main-header" className="bg-white border-b border-gray-100 py-0 px-3 md:py-0 md:px-6 sticky top-0 z-40 shadow-xs">
      {/* Mobile-only header */}
      <div className="md:hidden">
        <a href="/" className="mx-auto mb-0.5 flex w-fit items-center justify-center" aria-label="Go to homepage">
          <img
            src={newlogo}
            alt="MedZiva Logo"
            className="h-24 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </a>
        <a 
          href="tel:+971559510794" 
          className="flex items-center justify-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1"
        >
          <Phone className="w-3 h-3 text-medical-green" />
          +971 55 951 0794
        </a>

        <div className="relative flex w-full items-center gap-2">
          <button
            type="button"
            aria-label="Open navigation menu"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              showMobileMenu
                ? 'border-emerald-200 bg-emerald-50 text-medical-green'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setShowSearchSuggestions(false);
              onSearchSubmit(searchQuery);
            }}
            className="flex h-12 min-w-0 flex-1 items-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md focus-within:border-emerald-200 focus-within:ring-2 focus-within:ring-medical-green/15"
          >
            <Search className="ml-4 h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="search"
              placeholder="Search doctors, lab tests, medicines..."
              value={searchQuery}
              onChange={(event) => {
                onSearchQueryChange(event.target.value);
                setShowSearchSuggestions(event.target.value.length > 0);
              }}
              onFocus={() => {
                if (searchQuery.length > 0 || searchHistory.length > 0) setShowSearchSuggestions(true);
              }}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-xs text-slate-800 outline-none"
            />
          </form>

          <button
            type="button"
            onClick={onCartOpen}
            aria-label="Open cart"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-medical-green"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-medical-green px-1 text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={loggedInUser ? onProfileOpen : onAuthOpen}
            aria-label={loggedInUser ? 'Open profile' : 'Sign in or sign up'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-medical-blue"
          >
            <User className="h-5 w-5" />
          </button>

          {showSearchSuggestions && (searchQuery.length > 0 || searchHistory.length > 0) && (
            <div className="absolute left-13 right-26 top-12 z-[70] max-h-64 overflow-y-auto rounded-xl border border-slate-100 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="truncate">{searchQuery ? `Matches for "${searchQuery}"` : 'Recent searches'}</span>
                <button
                  type="button"
                  onClick={() => {
                    onSearchQueryChange('');
                    onClearSearchHistory();
                    setShowSearchSuggestions(false);
                  }}
                  className="shrink-0 text-xs font-semibold normal-case text-slate-500"
                >
                  Clear
                </button>
              </div>
              {searchHistory.map((term) => (
                <button
                  type="button"
                  key={term}
                  onClick={() => {
                    onSearchQueryChange(term);
                    setShowSearchSuggestions(false);
                    onSearchSubmit(term);
                  }}
                  className="w-full rounded-lg p-2 text-left text-xs text-slate-600 hover:bg-slate-50"
                >
                  🔍 {term}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto hidden md:flex items-stretch justify-between gap-4">
        
        {/* Mobile Hamburger Menu Button - Left side */}
        <button
          className="md:hidden p-2 text-slate-700 hover:text-medical-blue"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Left Side: Brand Logo */}
        <div className="flex items-center shrink-0">
          <a href="/" className="flex items-center h-full group" aria-label="Go to homepage">
            <img 
              src={newlogo} 
              alt="MedZiva Logo" 
              className="h-[5.5rem] w-auto object-contain"
              referrerPolicy="no-referrer" 
            />
          </a>
        </div>

        {/* Center: Search Bar with suggestion helper */}
        <div className="relative w-full md:max-w-xl flex-1 self-center search-bar-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setShowSearchSuggestions(false);
              onSearchSubmit(searchQuery);
            }}
            className="flex items-center w-full border border-slate-200 search-bar focus-within:ring-2 focus-within:ring-medical-green/20 bg-white shadow-xs transition-all"
          >
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search for services, products, specialists, lab tests..."
              value={searchQuery}
              onChange={(e) => {
                onSearchQueryChange(e.target.value);
                setShowSearchSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (searchQuery.length > 0 || searchHistory.length > 0) setShowSearchSuggestions(true);
              }}
              className="w-full py-2 px-3 bg-transparent text-sm focus:outline-hidden text-slate-800"
            />
            <button 
              type="submit"
              id="header-search-btn"
              className="bg-medical-green hover:bg-emerald-600 active:scale-95 text-white font-semibold text-sm px-5 py-2 rounded-r-full transition-all cursor-pointer mr-0.5"
            >
              Search
            </button>
          </form>

          {/* Search dynamic floating helper dropdown */}
          {showSearchSuggestions && (searchQuery.length > 0 || searchHistory.length > 0) && (
            <div className="absolute left-0 right-0 top-12 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 p-3 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-2 px-2">
                <span>{searchQuery ? `Refining matches for "${searchQuery}"` : 'Recent searches'}</span>
                <button 
                  type="button"
                  onClick={() => {
                    onSearchQueryChange('');
                    onClearSearchHistory();
                    setShowSearchSuggestions(false);
                  }}
                  className="hover:text-amber-500 cursor-pointer text-xs font-normal capitalize"
                >
                  Clear
                </button>
              </div>
              {searchHistory.map((term) => (
                <button
                  type="button"
                  key={term}
                  onClick={() => {
                    onSearchQueryChange(term);
                    setShowSearchSuggestions(false);
                    onSearchSubmit(term);
                  }}
                  className="w-full text-left text-xs text-slate-600 hover:bg-slate-50 p-2 rounded cursor-pointer transition-colors"
                >
                  🔍 {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Member Account, Active Bookings list, Cart with counter badge */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 lg:gap-5 self-center location-profile-row">

          {/* Phone Number */}
          <a 
            href="tel:+971559510794" 
            aria-label="Call +971 55 951 0794"
            className="hidden md:flex items-center gap-1.5 text-slate-600 hover:text-medical-green transition-colors font-semibold text-xs cursor-pointer"
          >
            <Phone className="w-4 h-4 text-medical-green" />
            <span>+971 55 951 0794</span>
          </a>

          {/* 1. Account Login/Signup - Hidden on mobile */}
          <div className="hidden md:block">
            {loggedInUser ? (
              <div className="flex items-center gap-2">
                <button
                  id="action-view-profile-btn"
                  onClick={onProfileOpen}
                  title="View/Edit Profile"
                  className="flex items-center gap-1.5 hover:bg-emerald-50/60 p-1 rounded-lg transition-all text-left cursor-pointer border border-transparent hover:border-emerald-100"
                >
                  <div className="p-1.5 bg-emerald-50 rounded-full text-emerald-700">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-emerald-600 font-extrabold uppercase leading-none">Profile</span>
                    <span className="text-xs font-bold text-slate-800 max-w-[85px] truncate leading-none mt-1">{loggedInUser}</span>
                  </div>
                </button>
                <button
                  id="action-logout-btn"
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Logout"
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-auth-trigger"
                onClick={onAuthOpen}
                className="flex items-center gap-2 text-slate-700 hover:text-medical-blue transition-colors text-left cursor-pointer"
              >
                <div className="p-1.5 bg-slate-50 rounded-full text-medical-blue">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 font-medium leading-none">Account</span>
                  <span className="text-xs font-bold text-slate-800 hover:text-medical-green transition-colors leading-none mt-1">
                    Sign in / Sign up
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* 4. Interactive Cart with count badge */}
          <button
            id="header-cart-trigger"
            onClick={onCartOpen}
            className="relative flex items-center gap-2 text-slate-700 hover:text-medical-green transition-colors text-left cursor-pointer p-1"
          >
            <div className="p-1.5 bg-teal-50 rounded-full text-medical-green">
              <ShoppingCart className="w-4.5 h-4.5" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[11px] text-slate-400 font-medium leading-none">Cart</span>
              <span className="text-xs font-bold text-slate-800 leading-none mt-1">View Bag</span>
            </div>
            <span className="absolute -top-1 -right-1 bg-medical-green text-white text-[10px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
              {cartCount}
            </span>
          </button>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div
          className="md:hidden fixed left-0 right-0 bottom-0 bg-white border-b border-gray-100 shadow-lg z-[60] overflow-y-auto overscroll-contain touch-pan-y"
          style={{ top: mobileMenuTop }}
        >
          <div className="p-4 pb-28 space-y-2">
            <button
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('home');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                activeTab === 'home' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Home className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold text-slate-700">Home</span>
            </button>
            <button
              onClick={() => setShowMobileServices((current) => !current)}
              className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left ${
                activeTab === 'services' || activeTab === 'lab-tests' || activeTab === 'health-packages' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
              aria-expanded={showMobileServices}
            >
              <span className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-medical-blue" />
                <span className="font-semibold">Services</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMobileServices ? 'rotate-180' : ''}`} />
            </button>
            {showMobileServices && (
              <div className="ml-4 border-l border-slate-100 pl-3 space-y-1">
                <button
                  onClick={() => setShowMobileHomeHealthcare((current) => !current)}
                  className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-lg text-left ${
                    activeTab === 'services' ? 'bg-emerald-50 text-medical-green' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                  aria-expanded={showMobileHomeHealthcare}
                >
                  <span className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-medical-blue" />
                    <span className="text-sm font-semibold">Home Healthcare</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMobileHomeHealthcare ? 'rotate-180' : ''}`} />
                </button>

                {showMobileHomeHealthcare && (
                  <div className="ml-4 border-l border-slate-100 pl-3 space-y-1">
                    {mobileHomeHealthcareItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSectionId === item.sectionId;
                      return (
                        <button
                          key={item.sectionId}
                          onClick={() => {
                            handleMobileNavigation(item.tab, item.sectionId);
                          }}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left ${
                            isActive ? 'bg-emerald-50 text-medical-green' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-medical-blue" />
                          <span className="text-sm font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => setShowMobileLabTests((current) => !current)}
                  className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-lg text-left ${
                    activeTab === 'lab-tests' || activeTab === 'health-packages' ? 'bg-emerald-50 text-medical-green' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                  aria-expanded={showMobileLabTests}
                >
                  <span className="flex items-center gap-3">
                    <Beaker className="w-4 h-4 text-medical-blue" />
                    <span className="text-sm font-semibold">Lab Tests at Home</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMobileLabTests ? 'rotate-180' : ''}`} />
                </button>

                {showMobileLabTests && (
                  <div className="ml-4 border-l border-slate-100 pl-3 space-y-1">
                    {mobileLabTestsItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeSectionId === item.sectionId;
                      return (
                        <button
                          key={item.sectionId}
                          onClick={() => {
                            handleMobileNavigation(item.tab, item.sectionId);
                          }}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left ${
                            isActive ? 'bg-emerald-50 text-medical-green' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-medical-blue" />
                          <span className="text-sm font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowMobileProducts((current) => !current)}
              className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left ${
                activeTab === 'products' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
              aria-expanded={showMobileProducts}
            >
              <span className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-medical-blue" />
                <span className="font-semibold">Products</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showMobileProducts ? 'rotate-180' : ''}`} />
            </button>
            {showMobileProducts && (
              <div className="ml-4 border-l border-slate-100 pl-3">
                <button
                  onClick={() => {
                    handleMobileNavigation('products', 'rent-medical-equipments-section');
                  }}
                  className={`w-full p-2.5 rounded-lg text-left text-sm font-semibold ${
                    activeSectionId === 'rent-medical-equipments-section'
                      ? 'bg-emerald-50 text-medical-green'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Rent Medical Equipment
                </button>
              </div>
            )}
            <button
              onClick={() => {
                handleMobileNavigation('lab-tests', 'customize-lab-package-section');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                activeSectionId === 'customize-lab-package-section'
                  ? 'bg-teal-50/80 text-medical-green'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Beaker className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold">Create your own Package</span>
            </button>
            <button
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('wellness', 'medical-tourism-section');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                activeTab === 'wellness' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <User className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold">Other Services</span>
            </button>
            <button
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('wellness', 'medical-tourism-section');
              }}
              className={`w-full text-left pl-12 pr-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'wellness' ? 'text-medical-green hover:bg-teal-50/60' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Medical Tourism Facilitation
            </button>
            <button
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('wellness', 'shipping-crews-section');
              }}
              className={`w-full text-left pl-12 pr-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'wellness' ? 'text-medical-green hover:bg-teal-50/60' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Medical Facilitation for Shipping Crews
            </button>
            <button
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('offers');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                activeTab === 'offers' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Flame className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold">Offers</span>
            </button>
            <button
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('providers');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                activeTab === 'providers' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <User className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold">For Providers</span>
            </button>
            <button
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('support');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                activeTab === 'support' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Activity className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold">Help &amp; Support</span>
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}
