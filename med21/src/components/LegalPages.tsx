/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '../content/legalContent';

interface LegalPagesProps {
  activeTab: string;
}

export default function LegalPages({ activeTab }: LegalPagesProps) {
  if (activeTab === 'privacy') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-left">
        <div className="border-b border-slate-100 pb-5 mb-8">
          <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">Legal</span>
          <h1 className="text-3xl font-black text-blue-950">Privacy Policy</h1>
        </div>
        <div className="space-y-6">
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.title} className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6">
              <h2 className="text-base font-black text-blue-950 mb-3">{section.title}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm text-slate-600 leading-7">{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'terms') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-left">
        <div className="border-b border-slate-100 pb-5 mb-8">
          <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">Dubai, United Arab Emirates</span>
          <h1 className="text-3xl font-black text-blue-950">Terms &amp; Conditions</h1>
        </div>
        <div className="space-y-5">
          {TERMS_SECTIONS.map((section) => (
            <section id={section.id} key={section.title} className="bg-white rounded-2xl border border-slate-200/70 p-5 sm:p-6 scroll-mt-32">
              <h2 className="text-base font-black text-blue-950 mb-3">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-sm text-slate-600 leading-7 mb-3 last:mb-0">{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 leading-6">
                  {section.bullets.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
