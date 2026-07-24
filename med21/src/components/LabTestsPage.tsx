/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SyntheticEvent } from 'react';
import { Search, ShoppingCart, Clock } from 'lucide-react';
import SafeImage from './SafeImage';
import { formatAedWhole } from '../utils/money';
import {
  DEFAULT_HEALTHCARE_SERVICE_IMAGE,
  resolveHealthcareServiceImage,
} from '../data';
import {
  LAB_TESTS_PAGE_COPY,
  DEFAULT_LAB_TESTS_ROUTE,
} from '../hooks/useAppState';
import type { CartItem, HealthcareService } from '../types';

interface LabTestsPageProps {
  activeSectionId: string | null;
  currentLabTestsRoute: string | null;
  currentLabTestsSectionId: string | null;
  handleTabChange: (tab: any, sectionId?: string) => void;
  handleAddToCart: (item: any) => void;
  triggerServiceBooking: (title: string, price: number, isLabTest?: boolean) => void;
  displayedLabServices: HealthcareService[];
  customLabSearch: string;
  setCustomLabSearch: (val: string) => void;
  labTestsAtHomeSearch: string;
  setLabTestsAtHomeSearch: (val: string) => void;
  cart: CartItem[];
  getVisibleLabAttributes: (srv: HealthcareService) => any[];
}

export default function LabTestsPage({
  activeSectionId,
  currentLabTestsRoute,
  currentLabTestsSectionId,
  handleTabChange,
  handleAddToCart,
  triggerServiceBooking,
  displayedLabServices,
  customLabSearch,
  setCustomLabSearch,
  labTestsAtHomeSearch,
  setLabTestsAtHomeSearch,
  cart,
  getVisibleLabAttributes,
}: LabTestsPageProps) {

  const getServiceImage = (srv: HealthcareService) =>
    resolveHealthcareServiceImage(srv).image || DEFAULT_HEALTHCARE_SERVICE_IMAGE;

  const getServiceImageClassName = (_srv: HealthcareService) => 'w-full h-full object-cover';

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

  return (
    <>
      {/* Lab Tests Category Navigation Bar */}
      {activeSectionId !== 'customize-lab-package-section' && (
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

      {/* Lab Tests content */}
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
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">Code: {testCode} &middot; Coverage: Dubai &amp; Sharjah only</p>
                        )}
                      </div>
                          <button
                            type="button"
                            onClick={isAdded ? undefined : () => handleAddToCart(srv)}
                            disabled={isAdded}
                            className={`shrink-0 rounded-xl px-[13px] py-[9px] text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
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
                    <SafeImage
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
    </>
  );
}
