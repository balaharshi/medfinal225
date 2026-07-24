/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check } from 'lucide-react';
import { formatAedWhole } from '../utils/money';

interface HealthPackagesPageProps {
  triggerServiceBooking: (title: string, price: number) => void;
}

export default function HealthPackagesPage({
  triggerServiceBooking,
}: HealthPackagesPageProps) {
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
      <div id="preventive-health-packages-section" className="scroll-mt-32" aria-hidden="true" />
      <div id="womens-health-packages-section" className="scroll-mt-32" aria-hidden="true" />
      <div className="border-b border-slate-100 pb-5 mb-8">
        <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">MedZiva comprehensive checkups</span>
        <h1 className="text-3xl font-black text-blue-950">Vetted At-Home Clinical Packages</h1>
        <p className="text-slate-500 text-sm mt-1 max-w-xl">
          Full physical cardiovascular evaluations, diabetes profile bundles, endocrine screenings, and comprehensive elder care monthly subscriptions designed for optimized families.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            id: 'hp-premium',
            title: 'MedZiva Platinum Comprehensive Pack',
            desc: 'Our gold standard full physical evaluation. Covers full profile lipids, diabetes checks, liver/kidney counts, heavy vitamins profile, and an at-home clinician consult.',
            bullets: ['Complete lipid panel & HbA1c', 'Liver & kidney metrics assessment', 'Clinician visiting consult included', 'Qualified blood sample collection'],
            price: 499,
            oldPrice: 650,
            tag: 'Most Popular'
          },
          {
            id: 'hp-cardiac',
            title: 'Cardiac Hazard Prevention Bundle',
            desc: 'A diagnostic profile targeting coronary risk parameters. Identifies high density lipid levels, specific cardiac proteins, uric index, and high tension blood pressure evaluations.',
            bullets: ['Total lipids & triglycerides index', 'High tension readings auditing', 'Uric acid indicators check', 'DHA approved physical analysis'],
            price: 349,
            oldPrice: 480,
            tag: 'Coronary Vetted'
          },
          {
            id: 'hp-fitness',
            title: 'Elite Fitness and Body Mass Audit',
            desc: 'Constructed for athletes or customers during body composition tracking. Monitors endocrine indices, creatine, basic lipid metabolism, and thyroid indicators.',
            bullets: ['Thyroid profile & hormonal check', 'Creatine counts auditing', 'Safe home visit drawn vial', 'Metabolic rate overview report'],
            price: 299,
            oldPrice: 399,
            tag: 'Metabolism Vetted'
          },
          {
            id: 'hp-male-tumour-marker',
            sectionId: 'mens-health-packages-section',
            title: 'Cancer / Tumour Marker Profile (Male)',
            desc: 'Screening profile for men focused on cancer risk markers and early detection through at-home sample collection.',
            bullets: ['AFP', 'Total hCG', 'CA 19-9', 'CBC (19)', 'Prostate Profile: PSA Total, PSA Free, PSA Ratio'],
            price: 260,
            tag: "Men's Health",
            who: 'Men for cancer screening & early detection',
            prep: 'No fasting required',
            result: 'Same day / Next day'
          }
        ].map((pack) => (
          <div
            key={pack.id}
            id={(pack as any).sectionId}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between scroll-mt-32"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="bg-purple-50 text-purple-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border border-purple-100">
                  {pack.tag}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-extrabold text-blue-950 leading-snug mb-2">{pack.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal mb-5">{pack.desc}</p>
              {(pack.who || pack.prep || pack.result) && (
                <div className="space-y-2 mb-5">
                  {pack.who && (
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-extrabold text-blue-950">Who:</span> {pack.who}
                    </p>
                  )}
                  {pack.prep && (
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-extrabold text-blue-950">Prep:</span> {pack.prep}
                    </p>
                  )}
                  {pack.result && (
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-extrabold text-blue-950">Result:</span> {pack.result}
                    </p>
                  )}
                </div>
              )}

              {/* Bullet elements */}
              <div className="space-y-2 mb-6">
                {pack.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block leading-none uppercase">Full package cost</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-black text-medical-green leading-none">AED {formatAedWhole(pack.price)}</span>
                  {pack.oldPrice && (
                    <span className="text-xs font-medium text-slate-400 line-through leading-none">AED {formatAedWhole(pack.oldPrice)}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => triggerServiceBooking(pack.title, pack.price)}
                className="bg-medical-green hover:bg-emerald-600 text-white font-bold text-xs py-3 px-5 rounded-xl cursor-pointer transition-all shrink-0"
              >
                Book Package Slot
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
