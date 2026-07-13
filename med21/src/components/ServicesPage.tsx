/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SyntheticEvent } from 'react';
import { ShoppingCart, CalendarClock, Clock, Eye, MessageCircle } from 'lucide-react';
import SafeImage from './SafeImage';
import { formatAedWhole } from '../utils/money';
import {
  DEFAULT_HEALTHCARE_SERVICE_IMAGE,
  resolveHealthcareServiceImage,
} from '../data';
import type { HealthcareService } from '../types';

interface ServicesPageProps {
  activeSectionId: string | null;
  currentServiceRoute: string | null;
  handleTabChange: (tab: any, sectionId?: string) => void;
  setServiceDetails: (srv: HealthcareService | null) => void;
  handleAddToCart: (item: any) => void;
  triggerServiceBooking: (title: string, price: number, isLabTest?: boolean) => void;
  triggerServiceEnquiry: (title: string) => void;
  nursingServices: HealthcareService[];
  longTermServices: HealthcareService[];
  physioServices: HealthcareService[];
  doctorServices: HealthcareService[];
  speechServices: HealthcareService[];
  occupationalServices: HealthcareService[];
  ivServices: HealthcareService[];
};

export default function ServicesPage({
  activeSectionId,
  currentServiceRoute,
  handleTabChange,
  setServiceDetails,
  handleAddToCart,
  triggerServiceBooking,
  triggerServiceEnquiry,
  nursingServices,
  longTermServices,
  physioServices,
  doctorServices,
  speechServices,
  occupationalServices,
  ivServices,
}: ServicesPageProps) {

  const getServiceAttributeValue = (srv: HealthcareService, label: string) => {
    const attributes = srv.attributes;
    if (Array.isArray(attributes)) {
      return attributes.find((item: any) => item.label === label)?.value;
    }
    if (attributes && typeof attributes === 'object') {
      const key = label
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[A-Z]/, (char) => char.toLowerCase());
      const snakeKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return (attributes as Record<string, any>)[key] || (attributes as Record<string, any>)[snakeKey] || (attributes as Record<string, any>)[label];
    }
    return undefined;
  };

  const getVisibleServiceDetailAttributes = (srv: HealthcareService) =>
    [
      ['Key Ingredients', getServiceAttributeValue(srv, 'Key Ingredients')],
      ['Clinical Benefits', getServiceAttributeValue(srv, 'Clinical Benefits')],
      ['Who is it for?', getServiceAttributeValue(srv, 'Who is it for?')],
      ['Preparation', getServiceAttributeValue(srv, 'Preparation')],
      ['Results Time', getServiceAttributeValue(srv, 'Results Time')],
      ['Disclaimer', getServiceAttributeValue(srv, 'Disclaimer')],
      ['Inclusions', Array.isArray(srv.inclusions) && srv.inclusions.length > 0 ? srv.inclusions.join(', ') : undefined],
    ].filter(([, value]) => value != null);

  const hasExtraDetails = (srv: HealthcareService) =>
    getVisibleServiceDetailAttributes(srv).length > 0 ||
    Boolean(srv.fullDescription && srv.fullDescription !== srv.description) ||
    Boolean(srv.inclusions?.length) ||
    Boolean(srv.preparationInstructions) ||
    Boolean(srv.whoIsItFor) ||
    Boolean(srv.availability);

  const getServiceImage = (srv: HealthcareService) =>
    resolveHealthcareServiceImage(srv).image || DEFAULT_HEALTHCARE_SERVICE_IMAGE;

  const getServiceImageClassName = (_srv: HealthcareService) => 'w-full h-full object-cover';

  const handleServiceImageError = (event: SyntheticEvent<HTMLImageElement>, srv: HealthcareService) => {
    const image = event.currentTarget;
    const fallback = getServiceImage(srv);
    if (image.src.endsWith(fallback) || image.dataset.fallbackApplied === 'true') {
      image.src = DEFAULT_HEALTHCARE_SERVICE_IMAGE;
      return;
    }
    image.dataset.fallbackApplied = 'true';
    image.src = fallback;
  };

  const renderServiceCard = (srv: HealthcareService) => (
    <div
      key={srv.id}
      className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between scroll-mt-32"
    >
      <div>
        <div className="h-44 w-full flex items-center justify-center rounded-2xl overflow-hidden mb-4 bg-slate-50 relative">
          {srv.image && (
          <SafeImage
            src={getServiceImage(srv)}
            alt={srv.title}
            className={getServiceImageClassName(srv)}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(event) => handleServiceImageError(event, srv)}
          />
          )}
          {srv.popular && (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow">
              Popular
            </span>
          )}
          {srv.enquiryOnly && (
            <span className="absolute top-3 right-3 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow">
              Enquiry
            </span>
          )}
        </div>
        <h3 className="text-base font-extrabold text-blue-950 mt-0.5 leading-snug line-clamp-2">{srv.title}</h3>
        <p className="text-xs text-slate-500 mt-2 mb-4 line-clamp-3 min-h-[48px]">{srv.shortDescription || srv.description}</p>
        {hasExtraDetails(srv) && (
          <button
            type="button"
            onClick={() => setServiceDetails(srv)}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-medical-green hover:text-emerald-700 hover:underline cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>
        )}
        {(srv.bookingNotice) && (
          <div className="space-y-1 mb-3">
            {srv.bookingNotice && (
              <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span>{srv.bookingNotice}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-baseline gap-2 justify-start">
          {srv.price > 0 ? (
            <>
              <span className="text-[7px] text-slate-400 font-extrabold uppercase leading-none mr-0.5">FROM</span>
              <span className="text-xs font-black text-medical-green">AED {formatAedWhole(srv.price)}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Enquiry Only</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleAddToCart(srv)}
            className="flex-1 py-3 px-4 bg-medical-blue hover:bg-blue-900 active:scale-95 text-white font-black text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
          {!srv.enquiryOnly && srv.price > 0 && (
            <button
              onClick={() => triggerServiceBooking(srv.title, srv.price)}
              className="flex-1 py-3 px-4 bg-medical-green hover:bg-emerald-600 active:scale-95 text-white font-black text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <CalendarClock className="w-4 h-4" />
              <span>BOOK NOW</span>
            </button>
          )}
          {srv.enquiryOnly && (
            <button
              onClick={() => triggerServiceEnquiry(srv.title)}
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>ENQUIRE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderServiceGroup = (
    sectionId: string,
    _label: string,
    title: string,
    description: string,
    items: HealthcareService[],
  ) => (
    <section id={sectionId} className="mb-12 scroll-mt-32">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-2xl font-black text-blue-950">{title}</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">{description}</p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((srv) => renderServiceCard(srv))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-sm text-slate-500">
          No services available in this section.
        </div>
      )}
    </section>
  );

  return (
    <>
      {/* Service Category Navigation Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-[52px] z-[29]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2.5 sm:justify-center">
            {[
              { label: 'Nursing Care', sectionId: 'home-healthcare-section' },
              { label: 'Physiotherapy', sectionId: 'physiotherapy-section' },
              { label: 'Doctor on Call', sectionId: 'doctor-on-call-section' },
              { label: 'Long-Term Care', sectionId: 'long-term-care-section' },
              { label: 'Speech Therapy', sectionId: 'speech-therapy-section' },
              { label: 'Occupational Therapy', sectionId: 'occupational-therapy-section' },
              { label: 'IV Therapy', sectionId: 'iv-therapy-section' },
            ].map((cat) => {
              const isActive = activeSectionId === cat.sectionId || (!activeSectionId && cat.sectionId === 'home-healthcare-section');
              return (
                <button
                  key={cat.sectionId}
                  onClick={() => handleTabChange('services', cat.sectionId)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-medical-green text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Service catalog content */}
      {currentServiceRoute && (
        <div className="max-w-7xl mx-auto py-10 px-4 text-left page-section scroll-mt-32">
          {currentServiceRoute === 'nursing-care-at-home' &&
            renderServiceGroup(
              'home-healthcare-section',
              'Nursing Care at Home',
              'Nursing Care at Home',
              'Professional nursing support delivered at the comfort of your home, including routine nurse visits, wound dressing, catheterisation, and prescription-based IV antibiotic administration.',
              nursingServices,
            )}

          {currentServiceRoute === 'long-term-specialized-care' &&
            renderServiceGroup(
              'long-term-care-section',
              'Long-Term / Specialized Care',
              'Long-Term / Specialized Care',
              'Dedicated nursing support at home for long-term and specialized care needs, including ongoing monitoring, chronic condition management, and personalized patient assistance.',
              longTermServices,
            )}

          {currentServiceRoute === 'physiotherapy-at-home' &&
            renderServiceGroup(
              'physiotherapy-section',
              'Physiotherapy at Home',
              'Physiotherapy at Home',
              'Professional physiotherapy sessions delivered at the comfort of your home, including rehabilitation support, mobility improvement, pain management, and recovery-focused exercises.',
              physioServices,
            )}

          {currentServiceRoute === 'doctor-on-call' &&
            renderServiceGroup(
              'doctor-on-call-section',
              'Doctor on Call',
              'Doctor on Call',
              'Convenient medical consultations at your home with qualified doctors providing assessment, advice, treatment guidance, and follow-up care.',
              doctorServices,
            )}

          {currentServiceRoute === 'speech-and-language-therapy' &&
            renderServiceGroup(
              'speech-therapy-section',
              'Speech and Language Therapy',
              'Speech and Language Therapy',
              'Specialized therapy at home to support speech, communication, language development, and swallowing difficulties through personalized care plans.',
              speechServices,
            )}

          {currentServiceRoute === 'occupational-therapy' &&
            renderServiceGroup(
              'occupational-therapy-section',
              'Occupational Therapy',
              'Occupational Therapy',
              'Personalized therapy at home to improve daily living skills, independence, mobility, and functional abilities through tailored rehabilitation programs.',
              occupationalServices,
            )}

          {currentServiceRoute === 'iv-therapy' &&
            renderServiceGroup(
              'iv-therapy-section',
              'IV Therapy',
              'IV Therapy',
              'Professional IV therapy administered at home under medical guidance, offering convenient access to prescribed treatments, hydration support, and wellness infusions.',
              ivServices,
            )}
        </div>
      )}
    </>
  );
}
