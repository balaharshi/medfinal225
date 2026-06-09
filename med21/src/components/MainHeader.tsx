/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, MapPin, User, ShoppingCart, LogOut, ChevronDown, Check, Menu, X, Home, Activity, Beaker, Flame } from 'lucide-react';
import { DUBAI_LOCATIONS } from '../data';
import { ActiveTab } from '../types';
import ConfirmDialog from './ConfirmDialog';

const newlogo = '/newlogo.png';

interface MainHeaderProps {
  cartCount: number;
  onCartOpen: () => void;
  onBookingOpen: () => void;
  onAuthOpen: () => void;
  onProfileOpen: () => void;
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
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
  { label: 'Therapy Services', tab: 'services', sectionId: 'therapy-services-section', icon: Activity },
];

const mobileLabTestsItems: { label: string; tab: ActiveTab; sectionId: string; icon: typeof Beaker }[] = [
  { label: 'Routine Blood Tests', tab: 'lab-tests', sectionId: 'routine-blood-tests-section', icon: Beaker },
  { label: 'Preventive Health Packages', tab: 'health-packages', sectionId: 'preventive-health-packages-section', icon: Beaker },
  { label: "Men's Health Packages", tab: 'health-packages', sectionId: 'mens-health-packages-section', icon: Beaker },
  { label: "Women's Health Packages", tab: 'health-packages', sectionId: 'womens-health-packages-section', icon: Beaker },
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
  selectedLocation,
  onSelectLocation,
  searchQuery,
  onSearchQueryChange,
  loggedInUser,
  onLogout,
  activeTab,
  activeSectionId,
  onTabChange
}: MainHeaderProps) {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileServices, setShowMobileServices] = useState(false);
  const [showMobileHomeHealthcare, setShowMobileHomeHealthcare] = useState(false);
  const [showMobileLabTests, setShowMobileLabTests] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
    setShowMobileServices(false);
    setShowMobileHomeHealthcare(false);
    setShowMobileLabTests(false);
  };

  return (
    <header id="main-header" className="bg-white border-b border-gray-100 py-3.5 px-4 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Mobile Hamburger Menu Button - Left side */}
        <button
          className="md:hidden p-2 text-slate-700 hover:text-medical-blue"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Left Side: Brand Logo */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <a href="#home" className="flex items-center gap-2 group">
            <img 
              src={newlogo} 
              alt="Medziva Logo" 
              className="h-44 md:h-28 w-auto object-contain" 
              referrerPolicy="no-referrer" 
            />
          </a>
        </div>

        {/* Center: Search Bar with suggestion helper */}
        <div className="relative w-full md:max-w-xl flex-1 search-bar-container">
          <div className="flex items-center w-full border border-slate-200 search-bar focus-within:ring-2 focus-within:ring-medical-green/20 bg-white overflow-hidden shadow-xs transition-all">
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
                if (searchQuery.length > 0) setShowSearchSuggestions(true);
              }}
              className="w-full py-2.5 px-3 bg-transparent text-sm focus:outline-hidden text-slate-800"
            />
            <button 
              id="header-search-btn"
              className="bg-medical-green hover:bg-emerald-600 active:scale-95 text-white font-semibold text-sm px-7 py-2.5 rounded-r-full transition-all cursor-pointer mr-0.5"
            >
              Search
            </button>
          </div>

          {/* Search dynamic floating helper dropdown */}
          {showSearchSuggestions && (
            <div className="absolute left-0 right-0 top-12 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 p-3 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase font-bold tracking-wider mb-2 px-2">
                <span>Refining matches for &quot;{searchQuery}&quot;</span>
                <button 
                  onClick={() => setShowSearchSuggestions(false)}
                  className="hover:text-amber-500 cursor-pointer text-xs font-normal capitalize"
                >
                  Clear
                </button>
              </div>
              <div className="text-xs text-slate-500 hover:bg-slate-50 p-2 rounded cursor-pointer transition-colors" onClick={() => { onSearchQueryChange(''); setShowSearchSuggestions(false); }}>
                🔍 Show all available healthcare items and listings
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Location, Member Account, Active Bookings list, Cart with counter badge */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 lg:gap-5 location-profile-row">
          
          {/* 1. Location Selector Dropdown - Hidden on mobile */}
          <div className="relative hidden md:block">
            <button
              id="header-location-selector"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-1.5 text-slate-700 hover:text-medical-blue transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
            >
              <div className="p-1.5 bg-sky-50 rounded-full text-medical-green">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium leading-none">Location</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-0.5">
                  {selectedLocation.split(',')[0]}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              </div>
            </button>

            {/* Dropdown Box */}
            {showLocationDropdown && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2.5">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider px-3.5 pb-2 border-b border-slate-50 mb-1.5">
                  Select Active Care Region
                </div>
                {DUBAI_LOCATIONS.map((loc) => {
                  const isSelected = selectedLocation === loc;
                  return (
                    <button
                      key={loc}
                      onClick={() => {
                        onSelectLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-teal-50/70 text-emerald-700 font-bold' : 'text-slate-600'
                      }`}
                    >
                      <span>{loc}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Account Login/Signup - Hidden on mobile */}
          <div className="border-l border-gray-100 pl-3 md:pl-4 hidden md:block">
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
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-50">
          <div className="p-4 space-y-2">
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
                            closeMobileMenu();
                            onTabChange?.(item.tab, item.sectionId);
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
                  onClick={() => {
                    closeMobileMenu();
                    onTabChange?.('services', 'iv-therapy-section');
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left ${
                    activeSectionId === 'iv-therapy-section' ? 'bg-emerald-50 text-medical-green' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Flame className="w-4 h-4 text-medical-blue" />
                  <span className="text-sm font-semibold">IV Therapy</span>
                </button>

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
                            closeMobileMenu();
                            onTabChange?.(item.tab, item.sectionId);
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
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('products');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                activeTab === 'products' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <ShoppingCart className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold">Products</span>
            </button>
            <button
              onClick={() => {
                closeMobileMenu();
                onTabChange?.('wellness');
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
                activeTab === 'wellness' ? 'bg-teal-50/80 text-medical-green' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <User className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold">Wellness</span>
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
                onCartOpen();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left"
            >
              <ShoppingCart className="w-5 h-5 text-medical-blue" />
              <span className="font-semibold text-slate-700">Cart</span>
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
