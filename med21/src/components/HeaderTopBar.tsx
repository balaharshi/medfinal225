/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, Phone, Heart, Clock, Award } from 'lucide-react';

export default function HeaderTopBar() {
  return (
    <div id="header-top-bar" className="bg-medical-blue text-white text-[11px] py-1.5 px-4 shadow-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        {/* Left Side: Healthcare Highlights */}
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-gray-200">
          <div className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Award className="w-3.5 h-3.5 text-medical-green" />
            <span>DHA Licensed & Certified Clinicians</span>
          </div>
          <span className="hidden sm:inline text-white/20">|</span>
          <div className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Clock className="w-3.5 h-3.5 text-medical-green" />
            <span>24/7 On-Call Home Care Dispatch</span>
          </div>
          <span className="hidden sm:inline text-white/20">|</span>
          <div className="flex items-center gap-1.5 hover:text-white transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-medical-green" />
            <span>100% Secure & HIPAA Compliant Bookings</span>
          </div>
        </div>

        {/* Right Side: Customer Support Phone */}
        <div className="flex items-center gap-3">
          <a 
            href="tel:+971559510794" 
            className="text-gray-200 hover:text-white flex items-center gap-1.5 transition-colors font-bold"
            id="top-bar-phone-link"
          >
            <Phone className="w-3.5 h-3.5 text-medical-green fill-current" />
            <span>+971 55 951 0794</span>
          </a>
        </div>
      </div>
    </div>
  );
}
