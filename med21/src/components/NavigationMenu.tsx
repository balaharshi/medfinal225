/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Menu, ChevronDown, Sparkles } from 'lucide-react';
import { ActiveTab } from '../types';
import { SERVICE_CATEGORIES } from '../data';

interface NavigationMenuProps {
  activeTab: ActiveTab;
  activeSectionId?: string | null;
  onTabChange: (tab: ActiveTab, sectionId?: string) => void;
}

const homeHealthcareItems: { label: string; tab: ActiveTab; sectionId: string }[] = [
  { label: 'Nursing Care at Home', tab: 'services', sectionId: 'home-healthcare-section' },
  { label: 'Physiotherapy at Home', tab: 'services', sectionId: 'physiotherapy-section' },
  { label: 'Doctor on Call', tab: 'services', sectionId: 'doctor-on-call-section' },
  { label: 'Long-Term / Specialized Care', tab: 'services', sectionId: 'long-term-care-section' },
  { label: 'Therapy Services', tab: 'services', sectionId: 'therapy-services-section' },
];

const labTestsItems: { label: string; tab: ActiveTab; sectionId: string }[] = [
  { label: 'Routine Blood Tests', tab: 'lab-tests', sectionId: 'routine-blood-tests-section' },
  { label: 'Preventive Health Packages', tab: 'health-packages', sectionId: 'preventive-health-packages-section' },
  { label: "Men's Health Packages", tab: 'health-packages', sectionId: 'mens-health-packages-section' },
  { label: "Women's Health Packages", tab: 'health-packages', sectionId: 'womens-health-packages-section' },
  { label: 'STD / Sexual Health', tab: 'lab-tests', sectionId: 'std-sexual-health-section' },
  { label: 'Specialized Diagnostic Tests', tab: 'lab-tests', sectionId: 'specialized-diagnostic-tests-section' },
  { label: 'Genetic Testing', tab: 'lab-tests', sectionId: 'genetic-testing-section' },
];

export default function NavigationMenu({ activeTab, activeSectionId, onTabChange }: NavigationMenuProps) {
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showHomeHealthcareDropdown, setShowHomeHealthcareDropdown] = useState(false);
  const [showLabTestsDropdown, setShowLabTestsDropdown] = useState(false);

  const menuItems: { label: string; value: ActiveTab }[] = [
    { label: 'Products', value: 'products' },
    { label: 'Wellness', value: 'wellness' },
    { label: 'Offers', value: 'offers' },
    { label: 'For Providers', value: 'providers' },
    { label: 'Help & Support', value: 'support' }
  ];

  return (
    <nav id="navigation-menu" className="bg-white border-b border-slate-100 py-1.5 px-4 z-30 hidden md:block">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Leftmost side: "All Categories" drop trigger - Hidden on mobile */}
        <div className="relative w-full md:w-auto mt-2 md:mt-0 hidden md:block">
          <button
            id="nav-categories-dropdown"
            onClick={() => setShowCategoriesDropdown(!showCategoriesDropdown)}
            className="w-full md:w-auto h-11 bg-white hover:bg-slate-50 border border-slate-200 text-medical-blue font-bold text-xs uppercase tracking-wider px-5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
          >
            <Menu className="hidden md:block w-4 h-4 text-medical-green" />
            <span>All Categories</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
          
          {showCategoriesDropdown && (
            <div className="absolute left-0 mt-1.5 w-64 md:w-80 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-3 grid grid-cols-1 gap-1">
              <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-4 pb-2 border-b border-slate-50 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.5} />
                <span>Popular Health Departments</span>
              </div>
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    // Navigate according to the clicked categories slug
                    if (cat.slug === 'lab-tests') {
                      onTabChange('lab-tests');
                    } else if (cat.slug === 'devices-for-rent') {
                      onTabChange('products');
                    } else {
                      onTabChange('services');
                    }
                    setShowCategoriesDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-teal-50/60 text-xs text-slate-700 hover:text-medical-green flex items-center gap-3 transition-all cursor-pointer"
                >
                  <img src={cat.image} className="w-6.5 h-6.5 rounded-full object-cover border border-slate-100" alt={cat.title} referrerPolicy="no-referrer" />
                  <span className="font-semibold">{cat.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Main Horizontal Tabs */}
        <div className="flex items-center overflow-x-auto md:overflow-visible w-full md:w-auto no-scrollbar py-2 md:py-0 tab-navigation">
          <div className="flex items-center gap-1 sm:gap-2.5">
            <button
              onClick={() => onTabChange('home')}
              className={`relative px-3 py-3 text-xs sm:text-[13px] font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'home'
                  ? 'text-medical-blue border-b-2 border-medical-green font-extrabold pb-3'
                  : 'text-slate-600 hover:text-medical-blue'
              }`}
            >
              Home
            </button>

            <div
              className="relative"
              onMouseEnter={() => setShowServicesDropdown(true)}
              onMouseLeave={() => setShowServicesDropdown(false)}
            >
              <button
                onClick={() => setShowServicesDropdown((current) => !current)}
                className={`relative px-3 py-3 text-xs sm:text-[13px] font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeTab === 'services' || activeTab === 'lab-tests' || activeTab === 'health-packages'
                    ? 'text-medical-blue border-b-2 border-medical-green font-extrabold pb-3'
                    : 'text-slate-600 hover:text-medical-blue'
                }`}
                aria-expanded={showServicesDropdown}
                aria-haspopup="menu"
              >
                <span>Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showServicesDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showServicesDropdown && (
                <div className="absolute left-0 top-full w-56 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-2">
                  <div
                    className="relative"
                    onMouseEnter={() => setShowHomeHealthcareDropdown(true)}
                    onMouseLeave={() => setShowHomeHealthcareDropdown(false)}
                  >
                    <button
                      onClick={() => setShowHomeHealthcareDropdown((current) => !current)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                        activeTab === 'services'
                          ? 'bg-teal-50/80 text-medical-green'
                          : 'text-slate-600 hover:bg-teal-50/60 hover:text-medical-green'
                      }`}
                      aria-expanded={showHomeHealthcareDropdown}
                      aria-haspopup="menu"
                      role="menuitem"
                    >
                      <span>Home Healthcare</span>
                      <ChevronDown className={`w-3.5 h-3.5 -rotate-90 transition-transform ${showHomeHealthcareDropdown ? '-translate-x-0.5' : ''}`} />
                    </button>

                    {showHomeHealthcareDropdown && (
                      <div className="absolute left-full top-0 ml-1 w-64 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-2">
                        {homeHealthcareItems.map((item) => {
                          const isActive = activeSectionId === item.sectionId || (!activeSectionId && item.sectionId === 'home-healthcare-section' && activeTab === 'services');
                          return (
                            <button
                              key={item.sectionId}
                              onClick={() => {
                                onTabChange(item.tab, item.sectionId);
                                setShowHomeHealthcareDropdown(false);
                                setShowServicesDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-teal-50/80 text-medical-green'
                                  : 'text-slate-600 hover:bg-teal-50/60 hover:text-medical-green'
                              }`}
                              role="menuitem"
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onTabChange('services', 'iv-therapy-section');
                      setShowServicesDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                      activeSectionId === 'iv-therapy-section'
                        ? 'bg-teal-50/80 text-medical-green'
                        : 'text-slate-600 hover:bg-teal-50/60 hover:text-medical-green'
                    }`}
                    role="menuitem"
                  >
                    IV Therapy
                  </button>

                  <div
                    className="relative"
                    onMouseEnter={() => setShowLabTestsDropdown(true)}
                    onMouseLeave={() => setShowLabTestsDropdown(false)}
                  >
                    <button
                      onClick={() => setShowLabTestsDropdown((current) => !current)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                        activeTab === 'lab-tests' || activeTab === 'health-packages'
                          ? 'bg-teal-50/80 text-medical-green'
                          : 'text-slate-600 hover:bg-teal-50/60 hover:text-medical-green'
                      }`}
                      aria-expanded={showLabTestsDropdown}
                      aria-haspopup="menu"
                      role="menuitem"
                    >
                      <span>Lab Tests at Home</span>
                      <ChevronDown className={`w-3.5 h-3.5 -rotate-90 transition-transform ${showLabTestsDropdown ? '-translate-x-0.5' : ''}`} />
                    </button>

                    {showLabTestsDropdown && (
                      <div className="absolute left-full top-0 ml-1 w-64 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-2">
                        {labTestsItems.map((item) => {
                          const isActive = activeSectionId === item.sectionId || (!activeSectionId && item.sectionId === 'routine-blood-tests-section' && activeTab === 'lab-tests');
                          return (
                            <button
                              key={item.sectionId}
                              onClick={() => {
                                onTabChange(item.tab, item.sectionId);
                                setShowLabTestsDropdown(false);
                                setShowServicesDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-teal-50/80 text-medical-green'
                                  : 'text-slate-600 hover:bg-teal-50/60 hover:text-medical-green'
                              }`}
                              role="menuitem"
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {menuItems.map((item) => {
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => onTabChange(item.value)}
                  className={`relative px-3 py-3 text-xs sm:text-[13px] font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'text-medical-blue border-b-2 border-medical-green font-extrabold pb-3' 
                      : 'text-slate-600 hover:text-medical-blue'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </nav>
  );
}
