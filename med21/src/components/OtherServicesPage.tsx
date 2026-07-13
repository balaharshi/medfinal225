/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import SafeImage from './SafeImage';
import { MessageCircle } from 'lucide-react';
import medicalTourismImg from '../assets/images/services/medical-tourism.jpg';
import shippingCrewImg from '../assets/images/services/shipping-crew.jpg';

interface OtherServicesPageProps {
  activeSectionId: string | null;
  handleTabChange: (tab: any, sectionId?: string) => void;
  triggerServiceEnquiry: (title: string) => void;
}

export default function OtherServicesPage({
  activeSectionId,
  handleTabChange,
  triggerServiceEnquiry,
}: WellnessPageProps) {
  return (
    <>
      {!activeSectionId && (
        <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
          <div className="border-b border-slate-100 pb-5 mb-8">
            <span className="text-medical-green text-xs font-bold uppercase tracking-widest block mb-1">Additional Healthcare Services</span>
            <h1 className="text-3xl font-black text-blue-950">Other Services</h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">
              Explore our medical tourism facilitation and shipping crew health services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleTabChange('wellness', 'medical-tourism-section')}
              className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all text-left cursor-pointer"
            >
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5 border border-slate-100">
                <SafeImage
                  src={medicalTourismImg}
                  alt="Medical Tourism Facilitation"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h2 className="text-lg font-extrabold text-blue-950 mb-2">Medical Tourism Facilitation</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                End-to-end medical tourism coordination — from hospital selection to post-treatment care.
              </p>
              <span className="inline-flex items-center gap-1.5 text-medical-green text-xs font-bold">
                View Services &#8594;
              </span>
            </button>

            <button
              onClick={() => handleTabChange('wellness', 'shipping-crews-section')}
              className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all text-left cursor-pointer"
            >
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5 border border-slate-100">
                <SafeImage
                  src={shippingCrewImg}
                  alt="Medical Facilitation for Shipping Crews"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <h2 className="text-lg font-extrabold text-blue-950 mb-2">Medical Facilitation for Shipping Crews</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Comprehensive medical support for shipping crew members — fitness exams, consultations, and clearance.
              </p>
              <span className="inline-flex items-center gap-1.5 text-medical-green text-xs font-bold">
                View Services &#8594;
              </span>
            </button>
          </div>
        </div>
      )}

      {activeSectionId === 'medical-tourism-section' && (
        <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
          <div className="border-b border-slate-100 pb-5 mb-8">
            <h1 className="text-3xl font-black text-blue-950">Medical Tourism Facilitation</h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">
              Comprehensive medical tourism coordination from start to finish.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs mb-8 flex flex-col md:flex-row overflow-hidden">
            <div className="relative h-44 md:h-auto md:w-2/5 shrink-0">
              <SafeImage
                src={medicalTourismImg}
                alt="Medical Tourism Facilitation"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-6 flex flex-col justify-between flex-1">
              <ul className="space-y-2 mb-5">
                {[
                  'Identification of suitable hospitals and doctors',
                  'Appointment scheduling with specialists',
                  'Treatment plan coordination',
                  'Pre-admission support and documentation assistance',
                  'Medical visa guidance and documentation support',
                  'Travel planning and coordination',
                  'Medical document management',
                  'Language and communication support',
                  'Post-treatment follow-up consultations',
                  'Home healthcare arrangements after discharge',
                  'Rehabilitation and physiotherapy support',
                  'Remote health monitoring and teleconsultations',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-medical-green shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => triggerServiceEnquiry('Medical Tourism Facilitation')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 px-8 rounded-xl cursor-pointer transition-all flex items-center gap-2 self-start"
              >
                <MessageCircle className="w-4 h-4" />
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSectionId === 'shipping-crews-section' && (
        <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section">
          <div className="border-b border-slate-100 pb-5 mb-8">
            <h1 className="text-3xl font-black text-blue-950">Medical Facilitation for Shipping Crews</h1>
            <p className="text-slate-500 text-sm mt-1 max-w-xl">
              Comprehensive medical support tailored for shipping crew members.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs mb-8 flex flex-col md:flex-row overflow-hidden">
            <div className="relative h-44 md:h-auto md:w-2/5 shrink-0">
              <SafeImage
                src={shippingCrewImg}
                alt="Medical Facilitation for Shipping Crews"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-6 flex flex-col justify-between flex-1">
              <ul className="space-y-2 mb-5">
                {[
                  'Medical Fitness Examination for OGUK / OEUK / Seafarers Medical / Qatar Energy Requirements',
                  'Medical Consultations for Crew Members',
                  'Diagnostic and Laboratory Services',
                  'Emergency Medical Assistance',
                  'Hospital and Specialist Referrals',
                  'Medical Fitness and Clearance Services',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-medical-green shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => triggerServiceEnquiry('Medical Facilitation for Shipping Crews')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 px-8 rounded-xl cursor-pointer transition-all flex items-center gap-2 self-start"
              >
                <MessageCircle className="w-4 h-4" />
                Enquire Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
