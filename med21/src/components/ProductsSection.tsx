/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronLeft, CalendarClock, Heart, Send, Eye } from 'lucide-react';
import { DEFAULT_HEALTHCARE_SERVICE_IMAGE, resolveHealthcareServiceImage } from '../data';
import { HealthcareService } from '../types';
import { formatAedWhole } from '../utils/money';

const getServiceAttributeValue = (srv: HealthcareService, label: string) => {
  const attributes = srv.attributes;
  if (Array.isArray(attributes)) {
    return attributes.find((item: any) => item.label === label)?.value;
  }
  if (attributes && typeof attributes === 'object') {
    const key = label.replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase()).replace(/^[A-Z]/, (char) => char.toLowerCase());
    const snakeKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return (attributes as Record<string, any>)[key] || (attributes as Record<string, any>)[snakeKey] || (attributes as Record<string, any>)[label];
  }
  return undefined;
};

const hasExtraDetails = (srv: HealthcareService) =>
  ['Key Ingredients', 'Clinical Benefits', 'Disclaimer'].some(label => getServiceAttributeValue(srv, label)) ||
  Boolean(srv.fullDescription && srv.fullDescription !== srv.description) ||
  Boolean(srv.inclusions?.length) ||
  Boolean(srv.preparationInstructions) ||
  Boolean(srv.whoIsItFor) ||
  Boolean(srv.availability);

interface ProductsSectionProps {
  onServiceSelect: (title: string, price: number) => void;
  onServiceEnquire?: (title: string) => void;
  onAddToCart?: (service: HealthcareService) => void;
  onViewDetails?: (service: HealthcareService) => void;
  onExploreMore: () => void;
  servicesList?: HealthcareService[];
}

export default function ProductsSection({ 
  onServiceSelect, 
  onServiceEnquire, 
  onAddToCart,
  onViewDetails,
  onExploreMore, 
  servicesList = [] 
}: ProductsSectionProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fav => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getServiceImage = (service: HealthcareService) =>
    resolveHealthcareServiceImage(service).image || DEFAULT_HEALTHCARE_SERVICE_IMAGE;

  const handleServiceImageError = (event: React.SyntheticEvent<HTMLImageElement>, service: HealthcareService) => {
    const image = event.currentTarget;
    const fallback = getServiceImage(service);
    if (image.src.endsWith(fallback) || image.dataset.fallbackApplied === 'true') {
      image.src = DEFAULT_HEALTHCARE_SERVICE_IMAGE;
      return;
    }
    image.dataset.fallbackApplied = 'true';
    image.src = fallback;
  };

  return (
    <section id="products-section" className="bg-slate-50 py-6 px-4 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        
        {/* Title Block on Top */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-medical-blue">
              Popular Services
            </h2>
          </div>
          <button
            id="view-all-services-link"
            onClick={onExploreMore}
            className="text-xs sm:text-sm font-bold text-medical-green hover:text-emerald-700 hover:underline transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>View all services</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Carousel Frame */}
        <div className="relative group/carousel">
          
          {/* Slider Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 sm:-ml-5 bg-white shadow-xl hover:bg-slate-50 text-slate-700 w-11 h-11 rounded-full z-10 flex items-center justify-center border border-slate-100/50 hover:scale-115 transition-all cursor-pointer sm:opacity-0 sm:group-hover/carousel:opacity-100"
            title="Slide Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Slider Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 sm:-mr-5 bg-white shadow-xl hover:bg-slate-50 text-slate-700 w-11 h-11 rounded-full z-10 flex items-center justify-center border border-slate-100/50 hover:scale-115 transition-all cursor-pointer sm:opacity-0 sm:group-hover/carousel:opacity-100"
            title="Slide Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Core Horizontal Scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-2"
          >
            {servicesList.length > 0 ? (
              servicesList.map((srv) => {
                const isFav = favorites.includes(srv.id);
                const hasPrice = srv.price > 0 && !srv.enquiryOnly;

                // Capitalize and format category titles for subtitle badge
                const displayCategoryName = srv.category
                  ? srv.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                  : 'Nursing Care';

                return (
                  <div
                    key={srv.id}
                    className="snap-start bg-white rounded-2xl border border-slate-150/60 p-0 min-w-[200px] sm:min-w-[220px] max-w-[220px] flex-shrink-0 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden"
                  >
                    
                    {/* Gradient overlay on image */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-medical-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />

                    {/* Absolute Badge tags (e.g. Popular, Duration, Favorite button) */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                      {srv.popular && (
                        <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-amber-500/30">
                          ⭐ POPULAR
                        </span>
                      )}
                      <span className="bg-slate-900/95 backdrop-blur-md text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
                        ⏱️ {srv.duration}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 z-20">
                      <button
                        onClick={(e) => toggleFavorite(srv.id, e)}
                        className={`p-1.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer bg-white/95 backdrop-blur-sm border border-slate-200 ${
                          isFav ? 'text-rose-500 border-rose-200' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <Heart className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Service Image Stage */}
                    <div className="h-28 w-full flex items-center justify-center overflow-hidden relative">
                      <img
                        src={getServiceImage(srv)}
                        alt={srv.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                        onError={(event) => handleServiceImageError(event, srv)}
                      />
                      {/* Subtle overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Name and description details */}
                    <div className="p-3 text-left flex-grow relative z-10">
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-[7px] font-bold uppercase text-medical-blue tracking-wider bg-medical-blue/10 px-1.5 py-0.5 rounded-full">
                          {displayCategoryName}
                        </span>
                      </div>
                      <h3 className="text-[11px] sm:text-[12px] font-black text-slate-900 leading-tight mb-1.5 line-clamp-2 min-h-[28px]">
                        {srv.title}
                      </h3>
                      <p className="text-[11px] sm:text-[10px] text-slate-500 line-clamp-2 leading-relaxed min-h-[26px]">
                        {srv.description}
                      </p>
                      {hasExtraDetails(srv) && (
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(srv)}
                          className="mt-2 inline-flex items-center gap-1 text-[9px] font-extrabold text-medical-green hover:underline cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>
                      )}
                    </div>

                    {/* Service Price & Action Call footer */}
                    <div className="p-3 pt-2 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-end relative z-10">
                      <div className="flex items-baseline gap-0.5 mb-2 justify-between">
                        {hasPrice ? (
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">FROM</span>
                            <span className="text-sm font-black text-medical-green">
                              AED {formatAedWhole(srv.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                            Quote
                          </span>
                        )}
                      </div>

                      {hasPrice ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onAddToCart && onAddToCart(srv)}
                            className="w-full py-2 bg-medical-blue hover:bg-blue-900 active:scale-95 text-white font-black text-[9px] rounded-lg tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-medical-blue/20"
                          >
                            <span>Add to Cart</span>
                          </button>
                          <button
                            onClick={() => onServiceSelect(srv.title, srv.price)}
                            className="w-full py-2 bg-medical-green hover:bg-emerald-600 active:scale-95 text-white font-black text-[9px] rounded-lg tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1 shadow-lg shadow-medical-green/30 hover:shadow-medical-green/40"
                          >
                            <CalendarClock className="w-3 h-3" />
                            <span>BOOK</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onServiceEnquire && onServiceEnquire(srv.title)}
                          className="w-full py-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-[10px] rounded-lg tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/30"
                        >
                          <Send className="w-3 h-3 text-white/90" />
                          <span>ENQUIRE</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="w-full py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200">
                No popular services available to display in this snapshot. Please explore our services tab.
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
