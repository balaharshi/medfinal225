/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HelpCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { FAQ_SECTIONS } from '../content/legalContent';
import { api } from '../lib/api';

interface SupportPageProps {
  supportSubmitted: boolean;
  setSupportSubmitted: (v: boolean) => void;
  supportName: string;
  setSupportName: (v: string) => void;
  supportEmail: string;
  setSupportEmail: (v: string) => void;
  supportMessage: string;
  setSupportMessage: (v: string) => void;
  triggerToast: (msg: string) => void;
}

export default function SupportPage({
  supportSubmitted,
  setSupportSubmitted,
  supportName,
  setSupportName,
  supportEmail,
  setSupportEmail,
  supportMessage,
  setSupportMessage,
  triggerToast,
}: SupportPageProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-left">
      <div className="border-b border-slate-100 pb-5 mb-8">
        <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest block mb-1">Help Desk</span>
        <h1 className="text-3xl font-black text-blue-950">Customer Support &amp; FAQs Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          Answers about bookings, cancellations, payments, accounts, services, privacy, and legal matters.
        </p>
      </div>

      <div className="space-y-8">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-black text-blue-950 mb-3">{section.title}</h2>
            <div className="space-y-3.5">
              {section.items.map((faq) => (
                <div key={faq.question} className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#11224D] mb-2 flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed pl-5">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Support ticket submission form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 mt-10 space-y-4">
        {supportSubmitted ? (
          <div className="bg-emerald-50/75 border border-emerald-100 rounded-2xl p-6 text-center space-y-2">
            <div className="w-10 h-10 bg-emerald-100/70 text-medical-green rounded-full flex items-center justify-center mx-auto">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <h4 className="font-extrabold text-medical-blue text-sm">Message Dispatched Safely</h4>
            <p className="text-xs text-slate-500 leading-normal">
              Our lead care coordinator has received your notes and will coordinate with you via WhatsApp or telephone within 15 minutes.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-sm sm:text-base font-extrabold text-[#11224D] border-b border-slate-100 pb-2">
              Send Direct Message to Care Coordinator
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" placeholder="Your Name" value={supportName} onChange={(e) => setSupportName(e.target.value)} className="text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
              <input type="email" placeholder="Your Email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
            </div>
            <textarea placeholder="Write detail of your support request..." rows={3} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} className="w-full text-xs border border-slate-200 p-3 rounded-xl focus:outline-hidden text-slate-800" />
            <button
              onClick={async () => {
                if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) {
                  triggerToast('Please fill in all fields.');
                  return;
                }
                try {
                  await api.post('/api/enquiries', {
        body: {
          customerName: supportName.trim(),
          customerEmail: supportEmail.trim(),
                      message: supportMessage.trim(),
                      serviceTitle: 'Support Request',
                    },
                  });
                 } catch (e) {
                   toast.error('Failed to send support request. Please try again.');
                   return;
                 }
                 setSupportSubmitted(true);
              }}
              className="bg-medical-green hover:bg-emerald-600 text-white text-xs font-bold py-3.5 px-6 rounded-xl cursor-pointer transition-all"
            >
              Send Support Signal
            </button>
          </>
        )}
      </div>
    </div>
  );
}
