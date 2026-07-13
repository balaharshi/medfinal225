/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShoppingCart, Clock } from 'lucide-react';
import SafeImage from './SafeImage';
import { formatAedWhole } from '../utils/money';
import { PRODUCT_PAGE_COPY, PRODUCT_SECTION_ID_BY_ROUTE, DEFAULT_PRODUCT_ROUTE } from '../hooks/useAppState';
import type { Product } from '../types';

interface ProductsPageProps {
  currentProductRoute: string | null;
  setSearchQuery: (q: string) => void;
  searchQuery: string;
  displayedProducts: Product[];
  handleAddToCart: (item: any) => void;
  triggerRentalBooking: (product: any) => void;
}

export default function ProductsPage({
  currentProductRoute,
  setSearchQuery,
  searchQuery,
  displayedProducts,
  handleAddToCart,
  triggerRentalBooking,
}: ProductsPageProps) {
  return (
    <div id={PRODUCT_SECTION_ID_BY_ROUTE[currentProductRoute || DEFAULT_PRODUCT_ROUTE] || 'products-page-section'} className="max-w-7xl mx-auto py-10 px-4 text-left page-section scroll-mt-32">
      <div className="border-b border-slate-100 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-blue-950">{PRODUCT_PAGE_COPY[currentProductRoute || 'rent-medical-equipments']?.title || 'Products'}</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            {PRODUCT_PAGE_COPY[currentProductRoute || 'rent-medical-equipments']?.description || 'Order certified healthcare products delivered under UAE free shipping safety.'}
          </p>
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="bg-medical-green/15 text-medical-green text-xs font-bold py-2.5 px-5 rounded-xl border border-emerald-500/20 cursor-pointer"
          >
            Clear Search Filters &#10006;
          </button>
        )}
      </div>

      {/* Grid display with real-time searches */}
      {displayedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedProducts.map((prod) => (
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
                <h3 className="text-sm font-extrabold text-blue-950 mt-0.5 leading-snug line-clamp-1">
                  {prod.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 line-clamp-2 min-h-[32px]">
                  {prod.subtitle}
                </p>
                {prod.subcategory === 'rent-medical-equipments' && (
                  <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{Array.isArray(prod.attributes) ? prod.attributes.find((item: any) => item.label === 'Booking notice')?.value : undefined}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase leading-none">FROM</span>
                    <span className="text-sm font-black text-medical-green">AED {formatAedWhole(prod.price)}</span>
                  </div>
                </div>

                {prod.category === 'devices-for-rent' ? (
                  <button
                    onClick={() => triggerRentalBooking(prod)}
                    className="bg-medical-green hover:bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    Book Now
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToCart(prod)}
                    className="bg-medical-green hover:bg-emerald-600 active:scale-95 p-2.5 text-white rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center"
                    title="Add to Cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                )}
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
  );
}
