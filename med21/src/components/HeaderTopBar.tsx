/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Phone } from 'lucide-react';

export default function HeaderTopBar() {
  return (
    <div id="header-top-bar" className="bg-medical-blue text-white text-[11px] py-1.5 px-4 shadow-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-end items-center">
        <div className="flex items-center gap-3">
          <a 
            href="tel:+971559510794" 
            aria-label="Call +971 55 951 0794"
            className="text-gray-200 hover:text-white flex items-center gap-1.5 py-1 transition-colors font-bold cursor-pointer"
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
