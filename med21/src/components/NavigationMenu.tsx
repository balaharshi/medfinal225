/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ActiveTab } from '../types';

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
  { label: 'Speech and Language Therapy', tab: 'services', sectionId: 'speech-therapy-section' },
  { label: 'Occupational Therapy', tab: 'services', sectionId: 'occupational-therapy-section' },
  { label: 'IV Therapy', tab: 'services', sectionId: 'iv-therapy-section' },
];

const labTestsItems: { label: string; tab: ActiveTab; sectionId: string }[] = [
  { label: 'Routine Blood Tests', tab: 'lab-tests', sectionId: 'routine-blood-tests-section' },
  { label: 'Preventive Health Packages', tab: 'lab-tests', sectionId: 'preventive-health-packages-section' },
  { label: "Men's Health Packages", tab: 'lab-tests', sectionId: 'mens-health-packages-section' },
  { label: "Women's Health Packages", tab: 'lab-tests', sectionId: 'womens-health-packages-section' },
  { label: 'STD / Sexual Health', tab: 'lab-tests', sectionId: 'std-sexual-health-section' },
  { label: 'Specialized Diagnostic Tests', tab: 'lab-tests', sectionId: 'specialized-diagnostic-tests-section' },
  { label: 'Genetic Testing', tab: 'lab-tests', sectionId: 'genetic-testing-section' },
];

const productItems: { label: string; tab: ActiveTab; sectionId: string }[] = [
  { label: 'Rent Medical Equipment', tab: 'products', sectionId: 'rent-medical-equipments-section' },
];

export default function NavigationMenu({ activeTab, activeSectionId, onTabChange }: NavigationMenuProps) {
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [showHomeHealthcareDropdown, setShowHomeHealthcareDropdown] = useState(false);
  const [showLabTestsDropdown, setShowLabTestsDropdown] = useState(false);
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);

  const menuItems: { label: string; value: ActiveTab }[] = [
    { label: 'Other Services', value: 'wellness' },
    { label: 'Offers', value: 'offers' },
    { label: 'For Providers', value: 'providers' },
    { label: 'Help & Support', value: 'support' }
  ];

  return (
    <nav id="navigation-menu" className="bg-white border-b border-slate-100 py-0.5 px-4 z-30 hidden md:block">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-2.5">
        {/* Center: Main Horizontal Tabs */}
        <div className="flex items-center overflow-x-auto md:overflow-visible w-full md:w-auto no-scrollbar py-1 md:py-0 tab-navigation">
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
                  activeTab === 'services' || ((activeTab === 'lab-tests' || activeTab === 'health-packages') && activeSectionId !== 'customize-lab-package-section')
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
                      <div className="absolute left-full top-0 -ml-8 w-64 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-2">
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
                      <div className="absolute left-full top-0 -ml-8 w-64 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-2">
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

            <div
              className="relative"
              onMouseEnter={() => setShowProductsDropdown(true)}
              onMouseLeave={() => setShowProductsDropdown(false)}
            >
              <button
                onClick={() => setShowProductsDropdown((current) => !current)}
                className={`relative px-3 py-3 text-xs sm:text-[13px] font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeTab === 'products'
                    ? 'text-medical-blue border-b-2 border-medical-green font-extrabold pb-3'
                    : 'text-slate-600 hover:text-medical-blue'
                }`}
                aria-expanded={showProductsDropdown}
                aria-haspopup="menu"
              >
                <span>Products</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProductsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProductsDropdown && (
                <div className="absolute left-0 top-full w-56 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-2">
                  {productItems.map((item) => {
                    const isActive = activeSectionId === item.sectionId;
                    return (
                      <button
                        key={item.sectionId}
                        onClick={() => {
                          onTabChange(item.tab, item.sectionId);
                          setShowProductsDropdown(false);
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
              onClick={() => onTabChange('lab-tests', 'customize-lab-package-section')}
              className={`relative px-3 py-3 text-xs sm:text-[13px] font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                activeSectionId === 'customize-lab-package-section'
                  ? 'text-medical-blue border-b-2 border-medical-green font-extrabold pb-3'
                  : 'text-slate-600 hover:text-medical-blue'
              }`}
            >
              Create your own Package
            </button>

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
