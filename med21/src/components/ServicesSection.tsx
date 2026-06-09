/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronLeft, CalendarClock, ArrowRight, Sparkles, Eye, X, ShieldCheck, Heart, Clock, Star, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICE_CATEGORIES as STATIC_CATEGORIES, HEALTHCARE_SERVICES as STATIC_SERVICES } from '../data';
import { ServiceCategory, HealthcareService } from '../types';

interface ServicesSectionProps {
  onServiceSelect: (serviceTitle: string, price: number) => void;
  onServiceEnquire?: (serviceTitle: string) => void;
  onAddToCart?: (service: HealthcareService) => void;
  onExploreMore: () => void;
  categoriesList?: ServiceCategory[];
  servicesList?: HealthcareService[];
  overlapHero?: boolean;
}

export default function ServicesSection({ 
  onServiceSelect, 
  onServiceEnquire,
  onAddToCart,
  onExploreMore,
  categoriesList = STATIC_CATEGORIES,
  servicesList = STATIC_SERVICES,
  overlapHero = true
}: ServicesSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-home-health');
  const [quickViewService, setQuickViewService] = useState<HealthcareService | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter actual services based on the clicked category
  const activeCategoryObject = categoriesList.find(c => c.id === selectedCategory) || categoriesList[0];
  const activeServices = servicesList.filter(
    (s) => s.category === activeCategoryObject?.slug
  );

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fav => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="services-section" 
      className={`relative z-25 px-4 sm:px-6 lg:px-8 bg-transparent pb-14 ${overlapHero ? '-mt-16 sm:-mt-24 lg:-mt-28' : 'pt-12'}`}
    >
      {/* Large white rounded card overlapping the Hero Section bottom */}
      <div className="max-w-7xl mx-auto bg-white rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-100/50">
        
        {/* Header containing title and 'View all →' green redirection link */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-medical-blue tracking-tight">
            Healthcare Services
          </h2>
          <button
            id="view-all-services-link"
            onClick={onExploreMore}
            className="text-[12.5px] font-bold text-medical-green hover:underline flex items-center gap-1 transition-all cursor-pointer"
          >
            <span>View all services</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Category Cards Slider Frame */}
        <div className="relative mb-8 group/slider">
          
          {/* Slider controls - Left side */}
          <button 
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 sm:-ml-4 bg-white shadow-lg hover:bg-slate-50 text-slate-700 w-9 h-9 rounded-full z-10 flex items-center justify-center border border-slate-150 hover:scale-105 transition-all cursor-pointer opacity-0 group-hover/slider:opacity-100"
            title="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5 text-slate-800" />
          </button>

          {/* Slider controls - Right side */}
          <button 
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 sm:-mr-4 bg-white shadow-lg hover:bg-slate-50 text-slate-700 w-9 h-9 rounded-full z-10 flex items-center justify-center border border-slate-150 hover:scale-105 transition-all cursor-pointer opacity-0 group-hover/slider:opacity-100"
            title="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 text-slate-800" />
          </button>

          {/* Cards Flex row scrollbar less container */}
          <div 
            ref={scrollContainerRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar pb-3 pt-0.5 snap-x"
          >
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              
              // Map slugs to beautiful custom background styles or themes if needed
              return (
                <div 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`snap-start min-w-[130px] sm:min-w-[155px] max-w-[155px] flex-shrink-0 cursor-pointer rounded-2xl p-2.5 text-center transition-all bg-[#FAFBFD] border select-none group flex flex-col justify-between ${
                    isSelected 
                      ? 'border-2 border-medical-green bg-emerald-50/15 shadow-sm ring-2 ring-emerald-500/10' 
                      : 'border-slate-200/50 hover:border-slate-300 hover:shadow-xs hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    {/* Category Image (Rectangular, high-quality, as per mockup) */}
                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-2.5 border border-slate-100/50 bg-[#EBF3FE] shrink-0">
                      <img 
                        src={cat.image} 
                        alt={cat.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* Category Name (Centered below image) */}
                    <span className="text-[11.5px] sm:text-[12px] font-extrabold text-[#0E1E43] leading-tight line-clamp-2 min-h-[32px] flex items-center justify-center px-1">
                      {cat.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Category Details Display with clinician slot options */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="pt-4 pb-8"
          >
            {/* Top Category Information Bar - clean, attractive & centered */}
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-9 space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-[#0D1D42] flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-medical-green inline-block"></span>
                {activeCategoryObject.title}
              </h3>
              <p className="text-slate-500 text-[13px] sm:text-[14.5px] leading-relaxed max-w-2xl">
                {activeCategoryObject.description || 'DHA licensed nurses providing premium in-home clinical care, wound antiseptic dressing, and support.'}
              </p>
              
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500 bg-[#F8FAFC] border border-slate-200/50 rounded-full px-3.5 py-1.5 shadow-3xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>DHA licensed support background checked for peace of mind.</span>
              </div>
            </div>

            {/* Grid Column Layout - 4 custom service cards per row */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {activeServices.length > 0 ? (
                activeServices.map((srv) => {
                  const isFav = favorites.includes(srv.id);
                  return (
                    <div 
                      key={srv.id} 
                      className="bg-white rounded-2xl border border-slate-150/60 p-2.5 sm:p-3 transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between h-full relative group"
                    >
                      {/* Top Badges (Popular / Duration) */}
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-0.5 z-10">
                        {srv.popular && (
                          <span className="bg-amber-500 text-white text-[6px] sm:text-[7px] font-black px-0.5 sm:px-1 py-0.5 rounded-sm uppercase tracking-wider">
                            POPULAR
                          </span>
                        )}
                        <span className="bg-slate-900/90 text-white text-[6px] sm:text-[7px] font-bold px-0.5 sm:px-1 py-0.5 rounded-sm uppercase tracking-wider backdrop-blur-xs">
                          ⏱️ {srv.duration}
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                        <button
                          onClick={(e) => toggleFavorite(srv.id, e)}
                          className={`p-1 rounded-full shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer bg-white border border-slate-100 ${
                            isFav ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
                          }`}
                          title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Service Image Stage */}
                      <div 
                        onClick={() => setQuickViewService(srv)}
                        className="h-20 sm:h-24 w-full flex items-center justify-center rounded-xl overflow-hidden mb-2 sm:mb-2.5 bg-[#F8FAFC] relative cursor-pointer"
                      >
                        <img
                          src={srv.image || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400'}
                          alt={srv.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Visual Hover Quick Look Overlay button */}
                        <div className="absolute inset-0 bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/95 text-slate-800 text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                            <Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-medical-green" />
                            <span>Quick View</span>
                          </div>
                        </div>
                      </div>

                      {/* Name and description info */}
                      <div className="text-left mb-2 sm:mb-2.5 flex-grow">
                        <span className="text-[7px] sm:text-[8px] font-bold uppercase text-slate-400 tracking-wider">
                          {activeCategoryObject.title}
                        </span>
                        <h3 className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-blue-950 leading-tight mt-0.5 line-clamp-2 min-h-[24px] sm:min-h-[28px]">
                          {srv.title}
                        </h3>
                        <p className="text-[10px] sm:text-[9px] text-slate-500 line-clamp-2 mt-0.5 min-h-[22px] sm:min-h-[26px] leading-relaxed">
                          {srv.description}
                        </p>
                      </div>

                      {/* Service Rate & Custom Booking Footer */}
                      <div className="pt-1.5 sm:pt-2 border-t border-slate-100 flex flex-col justify-end">
                        <div className="flex items-baseline gap-0.5 mb-1.5 sm:mb-2 justify-start">
                          {srv.price > 0 ? (
                            <>
                              <span className="text-[6px] sm:text-[7px] text-slate-400 font-extrabold uppercase leading-none mr-0.5">FROM</span>
                              <span className="text-[10px] sm:text-xs font-black text-medical-green">
                                AED {srv.price}
                              </span>
                            </>
                          ) : (
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 bg-slate-100 px-0.5 sm:px-1 py-0.5 rounded-sm">
                              Enquiry Only
                            </span>
                          )}
                        </div>

                        {/* Booking actions */}
                        <div className="flex gap-0.5 sm:gap-1">
                          {onAddToCart && (
                            <button
                              onClick={() => onAddToCart(srv)}
                              className="flex-1 py-1 sm:py-1.5 px-2 sm:px-3 bg-blue-950 hover:bg-blue-900 active:scale-95 text-white font-black text-[9px] sm:text-[10px] rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <span>Add to Cart</span>
                            </button>
                          )}
                          <button
                            onClick={() => onServiceSelect(srv.title, srv.price)}
                            className="flex-1 py-1 sm:py-1.5 px-2 sm:px-3 bg-medical-green hover:bg-emerald-600 active:scale-95 text-white font-black text-[9px] sm:text-[10px] rounded-lg tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <CalendarClock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                            <span>BOOK</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No individual clinicians preset in this database branch. Please tap any slider category above or &quot;Book a Service&quot; at the top to secure custom visits.
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* FULLY DETAILED MULTI-FEATURE QUICK VIEW MODAL POPUP */}
      <AnimatePresence>
        {quickViewService && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white w-full max-w-sm sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[85vh] mb-0 sm:mb-0"
            >
              
              {/* Close Button */}
              <button
                onClick={() => setQuickViewService(null)}
                className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer text-slate-600 hover:text-slate-800"
                title="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Image Section */}
              <div className="relative h-36 sm:h-44 overflow-hidden shrink-0">
                <img
                  src={quickViewService?.image || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=800'}
                  className="w-full h-full object-cover"
                  alt={quickViewService?.title}
                  referrerPolicy="no-referrer"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Duration Badge */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-medical-green" />
                    <span className="text-xs font-bold text-slate-800">
                      {quickViewService?.duration}
                    </span>
                  </div>
                </div>

                {/* Popular Badge */}
                {quickViewService.popular && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full font-bold text-[10px] shadow-lg">
                    POPULAR
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
                
                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-medical-green bg-emerald-50 px-2 py-0.5 rounded-full">
                      {activeCategoryObject.title}
                    </span>
                    {quickViewService.popular && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Top Rated
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight mb-1.5">
                    {quickViewService?.title}
                  </h3>
                  
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {quickViewService?.description}
                  </p>
                </div>

                {/* Trust Features */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-medical-green" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-700">DHA Licensed</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-medical-blue" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-700">Flexible Scheduling</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Starting from</p>
                      <span className="text-lg sm:text-xl font-black text-medical-green">
                        {quickViewService && quickViewService.price > 0 ? `AED ${quickViewService.price}` : 'Enquiry Only'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-0.5 text-amber-500 mb-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">4.9 Rating</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1 quick-view-actions">
                  {quickViewService && (quickViewService.enquiryOnly || quickViewService.price === 0) ? (
                    <button
                      onClick={() => {
                        if (onServiceEnquire) onServiceEnquire(quickViewService.title);
                        setQuickViewService(null);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-98 text-white font-extrabold text-xs rounded-lg transition-all cursor-pointer shadow-lg hover:shadow-xl flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      SUBMIT ENQUIRY
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setQuickViewService(null)}
                        className="w-full sm:w-auto py-2.5 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (quickViewService) {
                            onServiceSelect(quickViewService.title, quickViewService.price);
                            setQuickViewService(null);
                          }
                        }}
                        className="flex-1 w-full sm:w-auto py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-98 text-white font-extrabold text-xs rounded-lg transition-all cursor-pointer shadow-lg hover:shadow-xl flex items-center justify-center gap-1.5"
                      >
                        <CalendarClock className="w-4 h-4" />
                        CONFIRM & BOOK
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
