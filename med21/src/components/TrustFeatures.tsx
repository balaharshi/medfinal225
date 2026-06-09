/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, Lock, Award, CalendarX, HelpCircle } from 'lucide-react';

export default function TrustFeatures() {
  const safetyCards = [
    {
      id: 'tf-verified',
      icon: <ShieldCheck className="w-5 h-5 text-medical-green" />,
      title: 'Verified & Trusted',
      desc: 'All clinicians and caretakers are background verified by DHA rules.'
    },
    {
      id: 'tf-secure',
      icon: <Lock className="w-5 h-5 text-medical-green" />,
      title: 'Secure Payments',
      desc: '100% safe checkout with standard 256-bit SSL encrypted protection.'
    },
    {
      id: 'tf-assured',
      icon: <Award className="w-5 h-5 text-medical-green" />,
      title: 'Quality Assured',
      desc: 'Certified medical suppliers and vetted physical fitness specialists.'
    },
    {
      id: 'tf-cancel',
      icon: <CalendarX className="w-5 h-5 text-medical-green" />,
      title: 'Easy Cancellations',
      desc: 'Hassle-free, quick cancellations done and credited within 24 hours.'
    },
    {
      id: 'tf-support',
      icon: <HelpCircle className="w-5 h-5 text-medical-green" />,
      title: '24/7 Support',
      desc: 'Qualified care coordinators ready to help you on WhatsApp or call.'
    }
  ];

  return (
    <section id="trust-features-section" className="bg-slate-50/50 py-10 px-4 border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {safetyCards.map((card) => (
            <div 
              key={card.id}
              className="bg-white rounded-2xl p-5 border border-slate-150 shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-start"
            >
              <div className="p-2.5 bg-emerald-50 rounded-xl w-fit text-medical-green mb-3.5">
                {card.icon}
              </div>
              <h4 className="text-xs sm:text-[13px] font-extrabold text-medical-blue mb-1">
                {card.title}
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
