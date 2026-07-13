/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Dispatch, SetStateAction } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import PhoneInput from './PhoneInput';
import { api } from '../lib/api';

interface ProvidersPageProps {
  providerApplied: boolean;
  setProviderApplied: (v: boolean) => void;
  providerName: string;
  setProviderName: (v: string) => void;
  providerPhone: string;
  setProviderPhone: (v: string) => void;
  providerEmail: string;
  setProviderEmail: (v: string) => void;
  providerSpecializations: string[];
  setProviderSpecializations: Dispatch<SetStateAction<string[]>>;
  triggerToast: (msg: string) => void;
}

export default function ProvidersPage({
  providerApplied,
  setProviderApplied,
  providerName,
  setProviderName,
  providerPhone,
  setProviderPhone,
  providerEmail,
  setProviderEmail,
  providerSpecializations,
  setProviderSpecializations,
  triggerToast,
}: ProvidersPageProps) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-left">
      <div className="bg-medical-blue text-white p-6 sm:p-10 rounded-t-3xl text-center relative overflow-hidden">
        <h1 className="text-2xl sm:text-3xl font-black">Partner with Us</h1>
      </div>

      <div className="bg-white rounded-b-3xl border border-slate-200 border-t-0 p-6 sm:p-8 space-y-6">
        {providerApplied ? (
          <div className="bg-emerald-50/75 border border-emerald-100 rounded-2xl p-6 text-center space-y-3.5">
            <div className="w-12 h-12 bg-emerald-100/70 text-medical-green rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="font-extrabold text-medical-blue text-base">Application Dispatched Safely</h4>
            <p className="text-xs text-slate-500 leading-normal max-w-md mx-auto">
              MedZiva clinical partner application successfully stored. Our team will contact you within 48 hours.
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-sm sm:text-base font-extrabold text-medical-blue border-b border-slate-100 pb-2.5">
              Registration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">First Name</label>
                <input type="text" placeholder="e.g. Salim" required className="w-full text-xs border border-slate-200 rounded-xl p-3" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Mobile Number</label>
                <PhoneInput
                  value={providerPhone}
                  onChange={setProviderPhone}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-600">Email Address</label>
                <input type="email" placeholder="e.g. clinician@example.com" required className="w-full text-xs border border-slate-200 rounded-xl p-3" value={providerEmail} onChange={(e) => setProviderEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Primary Specialization</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Nursing Care at Home',
                  'Physiotherapy at Home',
                  'Doctor on Call',
                  'Speech and Language Therapy',
                  'Occupational Therapy',
                  'IV Therapy',
                  'Long-Term Care',
                  'Lab Tests at Home',
                  'Medical Devices for Rent',
                  'Medical Tourism',
                  'Medical Facilitation for Shipping Crews',
                  'Other',
                ].map((spec) => (
                  <label key={spec} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                    <input
                      type="checkbox"
                      value={spec}
                      checked={providerSpecializations.includes(spec)}
                      onChange={(e) => {
                        setProviderSpecializations((prev) =>
                          e.target.checked ? [...prev, spec] : prev.filter((s) => s !== spec)
                        );
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-medical-green focus:ring-medical-green"
                    />
                    {spec}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (!providerName.trim() || !providerPhone.trim() || !providerEmail.trim()) {
                  triggerToast('Please fill in all fields.');
                  return;
                }
                try {
                  await api.post('/api/enquiries', {
        body: {
          customerName: providerName.trim(),
          customerEmail: providerEmail.trim(),
                      message: `Provider Registration: ${providerName.trim()} | Phone: ${providerPhone.trim()} | Specializations: ${providerSpecializations.join(', ')}`,
                      serviceTitle: 'Provider Registration',
                    },
                  });
                 } catch (e) {
                   toast.error('Registration failed. Please try again.');
                   return;
                 }
                 setProviderApplied(true);
              }}
              className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all shadow-md text-center cursor-pointer"
            >
              SUBMIT
            </button>
          </>
        )}
      </div>
    </div>
  );
}
