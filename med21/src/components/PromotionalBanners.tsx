/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, Sparkles, Heart, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import SafeImage from './SafeImage';
import bloodTestImage from '../assets/images/lab-tests-at-home/srv-lab-home-complete-blood-count-cbc-with-differential.jpg';

interface PromoProps {
  onOffersClick?: () => void;
}

export default function PromotionalBanners({ 
  onOffersClick 
}: PromoProps) {
  return (
    <section id="promotions-section" className="bg-white py-12 px-4 border-b border-gray-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Unified "Exclusive Deals & Offers" Dark Green Container Banner (Image 4 Alignment) */}
        <div className="bg-gradient-to-br from-[#004A3C] via-[#013F33] to-[#012F26] rounded-[32px] p-6 lg:p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden text-left">
          
          {/* Decorative Subtle Glowing Background Radial */}
          <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-teal-400/10 blur-3xl -z-10 pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl -z-10 pointer-events-none" />

          {/* Left panel: Headers & Core View Call To Action */}
          <div className="space-y-4 max-w-sm shrink-0 w-full lg:w-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Exclusive Deals &amp; Offers
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm font-medium leading-relaxed">
              Save 10% on products and services, capped at AED 100, with our active MedZiva promo code.
            </p>
            
            <button
              onClick={onOffersClick}
              className="inline-flex items-center gap-2 bg-white text-[#004A3C] hover:bg-emerald-50 font-extrabold text-xs px-6 py-3.5 rounded-xl tracking-wide transition-all shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <span>View All Offers</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right panel: 3 Premium Promotion Box Columns with Artwork thumbnails */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            
            {/* Promo card 1: LAB Tests */}
            <div 
              className="bg-white/10 border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-3 group relative overflow-hidden"
            >
              <div className="space-y-1 z-10">
                <span className="text-[10px] text-teal-300 font-extrabold tracking-wider block uppercase">
                  Lab Tests
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  10%
                </h4>
                <span className="text-[10px] bg-teal-400/20 text-teal-300 font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  OFF
                </span>
              </div>
              
              {/* Promo image alignment */}
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/20">
                <SafeImage 
                  src={bloodTestImage}
                  alt="Blood Vial Drawing Lab"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Promo card 2: Health Packages */}
            <div 
              className="bg-white/10 border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-3 group relative overflow-hidden"
            >
              <div className="space-y-1 z-10">
                <span className="text-[10px] text-teal-300 font-extrabold tracking-wider block uppercase">
                  Services
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  10%
                </h4>
                <span className="text-[10px] bg-teal-400/20 text-teal-300 font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  OFF
                </span>
              </div>
              
              {/* Promo image alignment */}
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/20">
                <SafeImage 
                  src="/src/assets/images/services/long-term-care.jpg" 
                  alt="Smiling Nurses Consultation"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Promo card 3: Devices for Rent */}
            <div 
              className="bg-white/10 border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-3 group relative overflow-hidden"
            >
              <div className="space-y-1 z-10">
                <span className="text-[10px] text-teal-300 font-extrabold tracking-wider block uppercase">
                  Products
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  10%
                </h4>
                <span className="text-[10px] bg-teal-400/20 text-teal-300 font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">
                  OFF
                </span>
              </div>
              
              {/* Promo image alignment */}
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/20">
                <SafeImage 
                  src="/src/assets/images/services/medical-devices.jpg" 
                  alt="Wheelchair Devices for Rent"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
