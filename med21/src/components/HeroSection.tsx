/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, CalendarRange, UserCheck, Headphones, Star, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  onBookServiceClick: () => void;
  onExploreProductsClick: () => void;
}

export default function HeroSection({ onBookServiceClick, onExploreProductsClick }: HeroSectionProps) {
  const healthcareImage = 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1920';

  return (
    <div 
      id="hero-section" 
      className="relative bg-gradient-to-r from-[#EBF2FC] via-[#F4F9FF] to-[#FAFDFD] pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-10 lg:pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-slate-100"
    >
      {/* Background banner image with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={healthcareImage}
          alt="Healthcare Banner"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Subtle organic light backdrop effects */}
      <div className="absolute top-1/4 -left-12 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-blue-300/20 blur-3xl pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Main Content */}
        <div className="text-center lg:text-left space-y-4 sm:space-y-5">
        
        {/* Main Display Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[28px] sm:text-3xl md:text-4xl lg:text-[45px] xl:text-[52px] font-black text-medical-blue tracking-tight leading-[1.1] sm:leading-[1.08]"
        >
          Complete Healthcare.<br />Anytime, <span className="text-medical-green">Anywhere.</span>
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
              <p className="text-[9px] sm:text-[10px] font-extrabold text-[#0E1E43]">Verified</p>
              <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium whitespace-nowrap">Professionals</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-300/60 bg-emerald-50/20 flex items-center justify-center shrink-0 text-medical-green">
              <ShieldCheck className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
            </div>
            <div className="text-left leading-tight">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-[#0E1E43]">Secure</p>
              <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium whitespace-nowrap">Payments</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-300/60 bg-emerald-50/20 flex items-center justify-center shrink-0 text-medical-green">
              <CalendarRange className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
            </div>
            <div className="text-left leading-tight">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-[#0E1E43]">Fast &amp; Easy</p>
              <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium whitespace-nowrap">Booking</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-300/60 bg-emerald-50/20 flex items-center justify-center shrink-0 text-medical-green">
              <Headphones className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px]" strokeWidth={2} />
            </div>
            <div className="text-left leading-tight">
              <p className="text-[9px] sm:text-[10px] font-extrabold text-[#0E1E43]">24/7</p>
              <p className="text-[8px] sm:text-[9px] text-slate-500 font-medium whitespace-nowrap">Support</p>
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
            className="flex-1 w-full px-5 sm:px-6 py-2.5 sm:py-3 bg-[#003B71] hover:bg-[#002C56] text-white font-extrabold text-[11px] sm:text-xs tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Book a Service</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          
          <button
            id="hero-cta-explore-products"
            onClick={onExploreProductsClick}
            className="flex-1 w-full px-5 sm:px-6 py-2.5 sm:py-3 bg-transparent border-2 border-[#10B981] text-[#10B981] hover:bg-emerald-50/40 font-extrabold text-[11px] sm:text-xs tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            Explore Products
          </button>
        </motion.div>

        </div>

      </div>
    </div>
  );
}
