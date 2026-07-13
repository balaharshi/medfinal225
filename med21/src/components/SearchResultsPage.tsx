/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SyntheticEvent } from 'react';
import { ShoppingCart, CalendarClock, Eye, Clock, MessageCircle } from 'lucide-react';
import SafeImage from './SafeImage';
import { formatAedWhole } from '../utils/money';
import {
  DEFAULT_HEALTHCARE_SERVICE_IMAGE,
  resolveHealthcareServiceImage,
} from '../data';
import type { CartItem, HealthcareService } from '../types';

interface SearchResultsPageProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setActiveTab: (tab: any) => void;
  searchResults: { services: any[]; products: any[]; customLabs: any[] };
  cart: CartItem[];
  handleAddToCart: (item: any) => void;
  triggerServiceBooking: (title: string, price: number, isLabTest?: boolean) => void;
  triggerServiceEnquiry: (title: string) => void;
  setServiceDetails: (srv: HealthcareService | null) => void;
  hasExtraDetails: (srv: HealthcareService) => boolean;
}

export default function SearchResultsPage({
  searchQuery,
  setSearchQuery,
  setActiveTab,
  searchResults,
  cart,
  handleAddToCart,
  triggerServiceBooking,
  triggerServiceEnquiry,
  setServiceDetails,
  hasExtraDetails,
}: SearchResultsPageProps) {

  const getServiceImage = (srv: any) =>
    resolveHealthcareServiceImage(srv).image || DEFAULT_HEALTHCARE_SERVICE_IMAGE;

  const handleServiceImageError = (event: SyntheticEvent<HTMLImageElement>, srv: any) => {
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
                            &#9201;&#65039; {srv.duration}
                          </span>
                        )}
                      </div>

                      {/* Service Image */}
                      <div className="h-24 w-full flex items-center justify-center rounded-xl overflow-hidden mb-2.5 bg-[#F8FAFC] relative">
                        {srv.image && (
                        <SafeImage
                          src={getServiceImage(srv)}
                          alt={srv.title}
                          containerClassName="group-hover:scale-105 transition-transform duration-300"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(event) => handleServiceImageError(event, srv)}
                        >
                        {/* Hover Quick Look Overlay */}
                        <div className="absolute inset-0 bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/95 text-slate-800 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5 text-medical-green" />
                            <span>Quick View</span>
                          </div>
                        </div>
                        </SafeImage>
                        )}
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
                        <SafeImage
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
                          <SafeImage
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
  );
}
