/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';


interface HeroSectionProps {
  onBookServiceClick: () => void;
  onExploreProductsClick: () => void;
}

export default function HeroSection({ onBookServiceClick, onExploreProductsClick }: HeroSectionProps) {
  return (
    <div 
      id="hero-section" 
      className="relative bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Hero Banner Image */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full"
        >
          <img 
            src="/hero-banner.png"
            alt="MedZiva - Complete Healthcare Anytime Anywhere"
            className="w-full h-auto object-contain"
          />
        </motion.div>

        {/* CTA Buttons - Below the image */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-6 sm:py-8"
        >
          <button
            id="hero-cta-book-service"
            onClick={onBookServiceClick}
            className="flex-1 w-full sm:w-auto max-w-xs px-6 sm:px-8 py-3 sm:py-3.5 bg-medical-blue hover:bg-blue-900 text-white font-extrabold text-xs sm:text-sm tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Book a Service</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            id="hero-cta-explore-products"
            onClick={onExploreProductsClick}
            className="flex-1 w-full sm:w-auto max-w-xs px-6 sm:px-8 py-3 sm:py-3.5 bg-medical-green border-2 border-medical-green text-white hover:bg-emerald-600 hover:border-emerald-600 font-extrabold text-xs sm:text-sm tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            Explore Products
          </button>
        </motion.div>

      </div>
    </div>
  );
}
