/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClipboardList, CalendarClock, Stethoscope, Smile } from 'lucide-react';
import { motion } from 'motion/react';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      icon: <ClipboardList className="w-6 h-6 text-medical-green" />,
      title: 'Choose',
      desc: 'Choose a service, test or product',
    },
    {
      id: 2,
      icon: <CalendarClock className="w-6 h-6 text-medical-green" />,
      title: 'Book / Order',
      desc: 'Book instantly or place your order',
    },
    {
      id: 3,
      icon: <Stethoscope className="w-6 h-6 text-medical-green" />,
      title: 'Get Care',
      desc: 'Receive service at home or visit',
    },
    {
      id: 4,
      icon: <Smile className="w-6 h-6 text-medical-green" />,
      title: 'Feel Better',
      desc: 'Better health, better you',
    },
  ];

  return (
    <section id="how-medziva-works-section" className="bg-white py-14 px-4 border-b border-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto text-center relative z-10">
        
        {/* Title & Introduction Header */}
        <div className="mb-12">
          <span className="text-[10px] sm:text-xs font-bold text-medical-green uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full inline-block mb-3.5">
            SIMPLE &amp; ACCESSIBLE HEALTHCARE
          </span>
          <h2 className="text-2xl sm:text-3.5xl font-extrabold text-[#003B71] tracking-tight">
            How Medziva Works
          </h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Book certified home healthcare nurses, therapeutic clinicians, or medical products in 4 easy, reliable steps.
          </p>
        </div>

        {/* Horizontal Process Steps Flow Row with connector graphics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative mt-6">
          
          {/* Decorative Dashed Connectors for Desktop Layouts */}
          <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-0.5 border-t border-dashed border-slate-200 -z-10" />

          {steps.map((st, index) => (
            <div 
              key={st.id} 
              className="flex flex-col items-center group text-center px-4 relative"
            >
              {/* Animated outer circle block */}
              <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] shadow-xs flex items-center justify-center relative mb-4 group-hover:scale-110 group-hover:bg-[#DCFCE7] group-hover:border-emerald-300 transition-all duration-300">
                {st.icon}
                
                {/* Numeric badge marker block */}
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-medical-blue border-2 border-white text-[11px] font-black text-white flex items-center justify-center shadow-xs">
                  {st.id}
                </div>
              </div>

              {/* Title & description matching design verbatim */}
              <h4 className="text-sm sm:text-base font-extrabold text-[#003B71] mb-1.5">
                {st.title}
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-500 font-medium max-w-[200px] leading-relaxed mx-auto">
                {st.desc}
              </p>

              {/* Mobile Separator line indicator */}
              {index < 3 && (
                <div className="block lg:hidden h-6 w-0.5 border-l border-dashed border-slate-200 my-4 mx-auto" />
              )}
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}