/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ShoppingCart, CalendarClock, MessageCircle } from 'lucide-react';
import SafeImage from './SafeImage';
import ProductsSection from './ProductsSection';
import ServicesSection from './ServicesSection';
import PromotionalBanners from './PromotionalBanners';
import TrustFeatures from './TrustFeatures';
import { formatAedWhole } from '../utils/money';
import type { HealthcareService, ServiceCategory } from '../types';

interface HomePageProps {
  onTabChange: (tab: any, sectionId?: string) => void;
  triggerServiceBooking: (title: string, price: number, isLabTest?: boolean) => void;
  triggerServiceEnquiry: (title: string) => void;
  handleAddToCart: (item: any) => void;
  setServiceDetails: (srv: HealthcareService | null) => void;
  triggerRentalBooking: (product: any) => void;
  triggerCustomServiceRequest: () => void;
  db: { categories: any[]; products: any[]; services: any[] };
  homeHealthcareCategories: ServiceCategory[];
  homeHealthcareServices: HealthcareService[];
}

export default function HomePage({
  onTabChange,
  triggerServiceBooking,
  triggerServiceEnquiry,
  handleAddToCart,
  setServiceDetails,
  triggerRentalBooking,
  triggerCustomServiceRequest,
  db,
  homeHealthcareCategories,
  homeHealthcareServices,
}: HomePageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-0"
    >
      {/* Hero Banner */}
      <section className="relative w-full">
        <SafeImage
          src="/b23.png"
          alt="Complete Healthcare Anytime Anywhere"
          className="w-full h-auto object-cover"
        />
        <div className="absolute bottom-[12%] left-[4%] flex gap-3 sm:gap-4">
          <button
            onClick={() => onTabChange('services')}
            className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg flex items-center gap-2"
          >
            Book a Service <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTabChange('products')}
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
        onExploreMore={() => onTabChange('services')}
        servicesList={(() => { const pop = db.services.filter(s => s.popular); if (pop.length >= 8) return pop.slice(0, 8); const nonPop = db.services.filter(s => !s.popular && s.subcategory !== 'customize-lab-package'); return [...pop, ...nonPop.slice(0, 8 - pop.length)]; })()}
      />

      {/* Home Healthcare Services slide container */}
      <ServicesSection
        onServiceSelect={triggerServiceBooking}
        onServiceEnquire={triggerServiceEnquiry}
        onAddToCart={handleAddToCart}
        onExploreMore={() => onTabChange('services')}
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
              onClick={() => onTabChange('products')}
              className="text-xs sm:text-sm font-bold text-medical-green hover:text-emerald-700 hover:underline transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>View all products</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative group/carousel">
            <button
              onClick={() => { const el = document.getElementById('popular-products-scroll'); if (el) el.scrollBy({ left: -300, behavior: 'smooth' }); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 sm:-ml-5 bg-white shadow-xl hover:bg-slate-50 text-slate-700 w-11 h-11 rounded-full z-10 flex items-center justify-center border border-slate-100/50 hover:scale-110 transition-all cursor-pointer"
              title="Slide Left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => { const el = document.getElementById('popular-products-scroll'); if (el) el.scrollBy({ left: 300, behavior: 'smooth' }); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 sm:-mr-5 bg-white shadow-xl hover:bg-slate-50 text-slate-700 w-11 h-11 rounded-full z-10 flex items-center justify-center border border-slate-100/50 hover:scale-110 transition-all cursor-pointer"
              title="Slide Right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

          <div id="popular-products-scroll" className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-2 px-8 sm:px-10">
            {db.products.filter(p => p.category === 'devices-for-rent').slice(0, 8).map((prod) => (
              <div
                key={prod.id}
                className="snap-start bg-white rounded-2xl border border-slate-150/60 p-0 min-w-[200px] sm:min-w-[220px] max-w-[220px] flex-shrink-0 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div className="relative h-28 w-full overflow-hidden">
                    <SafeImage
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/30">
                      &#11088; POPULAR
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
        onOffersClick={() => onTabChange('offers')}
      />

      {/* Direct Vetted Safety guarantees */}
      <TrustFeatures />
    </motion.div>
  );
}
