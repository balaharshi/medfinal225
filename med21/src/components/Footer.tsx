/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Heart, CheckCircle } from 'lucide-react';

const newlogo = '/log.png';

interface FooterProps {
  onNavigationClick: (tab: any) => void;
}

export default function Footer({ onNavigationClick }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 3) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
      }, 3000);
    }
  };

  return (
    <footer id="medziva-footer" className="bg-[#033B2E] text-white pt-16 pb-8 px-4 mt-auto border-t border-emerald-950/20">
      <div className="max-w-7xl mx-auto">
        
        {/* Newsletter Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 mb-14 flex flex-col lg:flex-row items-center justify-between gap-6 text-left">
          <div className="space-y-2 max-w-lg">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Stay Healthy, Stay Updated
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm">
              Subscribe to get health tips, exclusive package deals, and early updates straight from our certified clinicians in the UAE.
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            {subscribed ? (
              <div className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 py-3.5 px-5 rounded-2xl flex items-center gap-2 text-sm font-bold animate-pulse">
                <CheckCircle className="w-5 h-5" />
                <span>Subscription successful! Thank you for staying updated.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-grow">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/10 text-white placeholder-gray-400 text-xs sm:text-sm rounded-xl py-3.5 pl-11 pr-4 focus:outline-hidden focus:ring-2 focus:ring-medical-green transition-all border border-transparent focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm tracking-wider px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <span>Subscribe</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Catalog Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12 text-left">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <img src={newlogo} alt="Medziva" className="h-20 w-auto" />
            </div>
            <p className="text-gray-400 text-[12.5px] leading-relaxed font-normal">
              Premium Healthcare Marketplace delivering DHA-compliant healthcare, elite home medical assistance, and hospital equipment rentals across all residences of Dubai.
            </p>
            
            {/* Contact quick items */}
            <div className="space-y-2.5 pt-2 text-xs text-gray-300">
              <a href="tel:+971559510794" id="footer-contact-phone" className="flex items-center gap-2.5 hover:text-medical-green transition-colors cursor-pointer">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">+971 55 951 0794</span>
              </a>
              <a href="mailto:info@medzivahealthcare.com" id="footer-contact-email" className="flex items-center gap-2.5 hover:text-medical-green transition-colors cursor-pointer">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>info@medzivahealthcare.com</span>
              </a>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Al Gaizi Plaza, Al Garhoud, Dubai, UAE</span>
              </div>
            </div>
          </div>

          {/* Column 1: Services */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-medical-green">
              Services
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><button onClick={() => onNavigationClick('services')} className="hover:text-white hover:underline transition-colors cursor-pointer">Home Healthcare</button></li>
              <li><button onClick={() => onNavigationClick('services')} className="hover:text-white hover:underline transition-colors cursor-pointer">Personal Trainers</button></li>
              <li><button onClick={() => onNavigationClick('products')} className="hover:text-white hover:underline transition-colors cursor-pointer">Medical Devices</button></li>
              <li><button onClick={() => onNavigationClick('services')} className="hover:text-white hover:underline transition-colors cursor-pointer">Occupational Medicine</button></li>
              <li><button onClick={() => onNavigationClick('services')} className="hover:text-white hover:underline transition-colors cursor-pointer">Speech Therapy</button></li>
              <li><button onClick={() => onNavigationClick('lab-tests')} className="hover:text-white hover:underline transition-colors cursor-pointer">At-Home LAB Tests</button></li>
            </ul>
          </div>

          {/* Column 2: Products */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-medical-green">
              Products
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><button onClick={() => onNavigationClick('products')} className="hover:text-white hover:underline transition-colors cursor-pointer">Omron BP Monitors</button></li>
              <li><button onClick={() => onNavigationClick('products')} className="hover:text-white hover:underline transition-colors cursor-pointer">Pulse Oximeters</button></li>
              <li><button onClick={() => onNavigationClick('products')} className="hover:text-white hover:underline transition-colors cursor-pointer">Nebulizers</button></li>
              <li><button onClick={() => onNavigationClick('products')} className="hover:text-white hover:underline transition-colors cursor-pointer">Digital Thermometers</button></li>
              <li><button onClick={() => onNavigationClick('products')} className="hover:text-white hover:underline transition-colors cursor-pointer">Back Support Belts</button></li>
              <li><button onClick={() => onNavigationClick('products')} className="hover:text-white hover:underline transition-colors cursor-pointer">Nutrition &amp; Proteins</button></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-medical-green">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">About Medziva</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Careers at Medziva</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Clinician Network</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Corporate wellness</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Customer Success Stories</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Contact Us</button></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-extrabold uppercase tracking-widest text-medical-green">
              Support
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><button onClick={() => onNavigationClick('support')} className="hover:text-white hover:underline transition-colors cursor-pointer">Help &amp; FAQ</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Secure Payments Policies</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Hassle Free Cancellation</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Refund Policies</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Terms &amp; Conditions</button></li>
              <li><button className="hover:text-white hover:underline transition-colors cursor-pointer">Privacy Safeguards</button></li>
            </ul>
          </div>

        </div>

        {/* Footer Base bar: Social items & Copyright statement */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p className="text-center md:text-left">
            &copy; 2026 <span className="font-bold text-white">Medziva International Healthcare L.L.C</span>. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] font-bold text-gray-300">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> in Dubai
            </span>
            <span className="text-gray-600">|</span>
            {/* Simple vectors for Social Media channels */}
            <div className="flex items-center gap-3">
              <a href="#facebook" className="hover:text-medical-green transition-colors cursor-pointer text-gray-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.95 14.22 5.95C15.31 5.95 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A9.96 9.96 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                </svg>
              </a>
              <a href="#instagram" className="hover:text-medical-green transition-colors cursor-pointer text-gray-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.16C15.2 2.16 15.58 2.17 16.85 2.23C19.9 2.37 21.63 4.1 21.77 7.15C21.83 8.42 21.84 8.8 21.84 12C21.84 15.2 21.83 15.58 21.77 16.85C21.63 19.9 19.9 21.63 16.85 21.77C15.58 21.83 15.2 21.84 12 21.84C8.8 21.84 8.42 21.83 7.15 21.77C4.1 21.63 2.37 19.9 2.23 16.85C2.17 15.58 2.16 15.2 2.16 12C2.16 8.8 2.17 8.42 2.23 7.15C2.37 4.1 4.1 2.37 7.15 2.23C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33 0.01 7.05 0.07C3.12 0.25 0.93 2.45 0.75 6.38C0.69 7.66 0.68 8.07 0.68 12C0.68 15.93 0.69 16.34 0.75 17.62C0.93 21.55 3.12 23.75 7.05 23.93C8.33 23.99 8.74 24 12 24C15.26 24 15.67 23.99 16.95 23.93C20.88 23.75 23.07 21.55 23.25 17.62C23.31 16.34 23.32 15.93 23.32 12C23.32 8.07 23.31 7.66 23.25 6.38C23.07 2.45 20.88 0.25 16.95 0.07C15.67 0.01 15.26 0 12 0M12 5.83C8.59 5.83 5.83 8.59 5.83 12C5.83 15.41 8.59 18.17 12 18.17C15.41 18.17 18.17 15.41 18.17 12C18.17 8.59 15.41 5.83 12 5.83M12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16M19.34 3.48C18.54 3.48 17.9 4.12 17.9 4.92C17.9 5.72 18.54 6.36 19.34 6.36C20.14 6.36 20.78 5.72 20.78 4.92C20.78 4.12 20.14 3.48 19.34 3.48Z" />
                </svg>
              </a>
              <a href="#linkedin" className="hover:text-medical-green transition-colors cursor-pointer text-gray-300">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
