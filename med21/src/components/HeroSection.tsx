/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, CalendarRange, UserCheck, Headphones, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import SafeImage from './SafeImage';


interface HeroSectionProps {
  onBookServiceClick: () => void;
  onExploreProductsClick: () => void;
}

export default function HeroSection({ onBookServiceClick, onExploreProductsClick }: HeroSectionProps) {
  return (
    <div 
      id="hero-section" 
      className="relative bg-white pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-slate-100"
    >
      {/* Subtle organic light backdrop effects */}
      <div className="absolute top-1/4 -left-12 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-blue-300/20 blur-3xl pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Main Content */}
        <div className="flex flex-col-reverse lg:flex-row items-center lg:items-start gap-6 lg:gap-10">
          
          {/* Left: Text Content */}
          <div className="flex-1 text-center lg:text-left space-y-4 sm:space-y-5">
          
            {/* Main Display Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-[28px] sm:text-3xl md:text-4xl lg:text-[45px] xl:text-[52px] font-black text-medical-blue tracking-tight leading-[1.1] sm:leading-[1.08]"
            >
              Complete Healthcare.<br /><span className="text-medical-green">Anytime, Anywhere.</span>
            </motion.h1>

            {/* Supportive paragraph text */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-slate-600 font-medium text-[12px] sm:text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Book trusted healthcare services, lab tests, specialists &amp; medical products – all in one place.
            </motion.p>

            {/* 4 Green Outlined Features Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1 pb-2 top-info-banner"
            >
              {/* Feature 1 */}
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-300/60 bg-emerald-50/20 flex items-center justify-center shrink-0 text-medical-green">
                  <UserCheck className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[10.8px] sm:text-[12px] font-extrabold text-[#0E1E43]">Verified</p>
                  <p className="text-[9.6px] sm:text-[10.8px] text-slate-500 font-medium whitespace-nowrap">Professionals</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-300/60 bg-emerald-50/20 flex items-center justify-center shrink-0 text-medical-green">
                  <ShieldCheck className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[10.8px] sm:text-[12px] font-extrabold text-[#0E1E43]">Secure</p>
                  <p className="text-[9.6px] sm:text-[10.8px] text-slate-500 font-medium whitespace-nowrap">Payments</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-300/60 bg-emerald-50/20 flex items-center justify-center shrink-0 text-medical-green">
                  <CalendarRange className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[10.8px] sm:text-[12px] font-extrabold text-[#0E1E43]">Fast &amp; Easy</p>
                  <p className="text-[9.6px] sm:text-[10.8px] text-slate-500 font-medium whitespace-nowrap">Booking</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-300/60 bg-emerald-50/20 flex items-center justify-center shrink-0 text-medical-green">
                  <Headphones className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[10.8px] sm:text-[12px] font-extrabold text-[#0E1E43]">24/7</p>
                  <p className="text-[9.6px] sm:text-[10.8px] text-slate-500 font-medium whitespace-nowrap">Support</p>
                </div>
              </div>
            </motion.div>

            {/* Action CTA rounded-xl buttons row */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 pt-2 max-w-md mx-auto lg:mx-0"
            >
              <button
                id="hero-cta-book-service"
                onClick={onBookServiceClick}
                className="flex-1 w-full px-5 sm:px-6 py-2.5 sm:py-3 bg-medical-blue hover:bg-blue-900 text-white font-extrabold text-[11px] sm:text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Book a Service</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              
              <button
                id="hero-cta-explore-products"
                onClick={onExploreProductsClick}
                className="flex-1 w-full px-5 sm:px-6 py-2.5 sm:py-3 bg-medical-green border-2 border-medical-green text-white hover:bg-emerald-600 hover:border-emerald-600 font-extrabold text-[11px] sm:text-xs tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              >
                Explore Products
              </button>
            </motion.div>
          </div>

          {/* Right: Hero Image */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-1 flex items-center justify-center lg:justify-end"
          >
            <SafeImage 
              src="/b23.png"
              alt="Healthcare Banner"
              className="w-full max-w-md lg:max-w-lg xl:max-w-xl h-auto object-contain"
            />
          </motion.div>

        </div>

      </div>
    </div>
  );
}
