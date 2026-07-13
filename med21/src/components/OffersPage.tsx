/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Copy, Check } from 'lucide-react';

interface OffersPageProps {
  copiedCoupon: string | null;
  copyCouponCode: (code: string) => void;
}

export default function OffersPage({
  copiedCoupon,
  copyCouponCode,
}: OffersPageProps) {
  return (
    <div id="offers-section" className="max-w-7xl mx-auto py-10 px-4 text-left scroll-mt-32">
      <div className="border-b border-slate-100 pb-5 mb-8">
        <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">MedZiva Wellness Campaigns</span>
        <h1 className="text-3xl font-black text-blue-950">Active Promo Code</h1>
        <p className="text-slate-500 text-sm mt-1 max-w-xl">
          Copy the code and apply it during checkout for savings on MedZiva products and services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { code: 'MEDZIVA10', percent: '10%', text: 'Get 10% off any product or service, up to AED 100.' }
        ].map((promo, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-dashed border-slate-350 p-6 flex flex-col justify-between hover:shadow-lg transition-all text-left relative overflow-hidden"
          >
            {/* Decorative dot shape cutout of standard coupon */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-slate-50 border border-slate-300 rounded-full w-6 h-6" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-slate-50 border border-slate-300 rounded-full w-6 h-6" />

            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded">
                  {promo.percent} OFF
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Expires this month</span>
              </div>

              <p className="text-xs text-slate-600 mb-6 font-medium leading-relaxed">
                {promo.text}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="font-mono font-bold text-sm text-blue-950 uppercase tracking-wider">{promo.code}</span>
              <button
                onClick={() => copyCouponCode(promo.code)}
                className="bg-slate-100 p-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-emerald-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                {copiedCoupon === promo.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-medical-green" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
