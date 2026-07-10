/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Check, User, Phone, Mail, ShieldAlert, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { createEnbdpayCheckout } from '../services/enbdpay';
import PhoneInput from './PhoneInput';
import { createBooking } from '../services/bookings';
import { formatAedWhole } from '../utils/money';
import { trackEvent, AnalyticsEvents } from '../services/analytics';
import { fetchServices, findServiceByTitle, BackendService } from '../services/servicesApi';

interface RentalBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSuccessToast?: (msg: string) => void;
  loggedInUser?: string | null;
  loggedInUserEmail?: string;
  loggedInUserPhone?: string;
  loggedInUserAddress?: string;
}

const getAttr = (attrs: any[], label: string): number => {
  if (!Array.isArray(attrs)) return 0;
  const found = attrs.find((a: any) => a.label?.includes(label));
  if (!found) return 0;
  return parseInt(String(found.value).replace(/[^0-9]/g, '')) || 0;
};

export default function RentalBookingModal({
  isOpen, onClose, product,
  onSuccessToast,
  loggedInUser = null, loggedInUserEmail = '', loggedInUserPhone = '', loggedInUserAddress = '',
}: RentalBookingModalProps) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [weeks, setWeeks] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isPaymentStarting, setIsPaymentStarting] = useState(false);
  const [backendServices, setBackendServices] = useState<BackendService[]>([]);

  const attributes = product?.attributes || [];
  const weeklyPrice = getAttr(attributes, 'per week') || product?.price || 0;
  const monthlyPrice = getAttr(attributes, 'per month') || 0;
  const securityDeposit = getAttr(attributes, 'Security') || 0;

  const rentalBreakdown = useMemo(() => {
    const fullMonths = Math.floor(weeks / 4);
    const remainingWeeks = weeks % 4;
    const monthlyTotal = fullMonths * monthlyPrice;
    const weeklyTotal = remainingWeeks * weeklyPrice;
    const rentalPrice = monthlyTotal + weeklyTotal;
    return { fullMonths, remainingWeeks, monthlyTotal, weeklyTotal, rentalPrice, total: rentalPrice + securityDeposit };
  }, [weeks, weeklyPrice, monthlyPrice, securityDeposit]);

  useEffect(() => {
    if (isOpen) {
      fetchServices().then(setBackendServices).catch(() => {});
      trackEvent(AnalyticsEvents.BEGIN_RENTAL_BOOKING, { product: product?.name || 'unknown' });
      setPatientName(loggedInUser || '');
      setEmail(loggedInUserEmail || '');
      setPhone(loggedInUserPhone || '');
      setAddress(loggedInUserAddress || '');
      setDate('');
      setNotes('');
      setWeeks(1);
      setFormErrors({});
      setIsPaymentStarting(false);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleBook = async () => {
    const newErrors: Record<string, string> = {};
    if (!patientName.trim()) newErrors.patientName = 'Full name is required';
    if (!phone.trim()) newErrors.phone = 'Valid phone number is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'A valid email is required';
    if (!date.trim()) newErrors.date = 'Preferred rental start date is required';
    if (!address.trim()) newErrors.address = 'Delivery address is required';
    if (!weeks || weeks < 1) newErrors.weeks = 'Duration is required';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setFormErrors({});
    try {
      setIsPaymentStarting(true);
      const backendService = findServiceByTitle(product.name, backendServices);
      const booking = await createBooking({
        customerName: patientName,
        customerEmail: email,
        customerPhone: phone,
        serviceTitle: backendService?.title || product.name,
        vendorName: 'Unassigned',
        serviceId: backendService?.id || null,
        category: backendService?.category || 'devices-for-rent',
        subcategory: backendService?.subcategory || 'rent-medical-equipments',
        price: rentalBreakdown.total,
        date,
        region: 'Dubai',
        status: 'Pending',
        paymentStatus: 'Unpaid',
        notes: `Rental: ${product.name} | ${weeks} weeks | Deposit: AED ${securityDeposit} | ${address} | ${notes}`,
      });

      const checkout = await createEnbdpayCheckout({
        amount: rentalBreakdown.total,
        description: `MedZiva - ${product.name} (${weeks} weeks)`,
        source: 'booking',
        category: 'Rental',
        bookingId: booking.id,
        customer: { fullName: patientName, email, phone, address },
      });

      toast.dismiss('enbdpay-rental');
      trackEvent(AnalyticsEvents.SUBMIT_RENTAL_BOOKING, { product: product.name, weeks, total: rentalBreakdown.total });
      trackEvent(AnalyticsEvents.PAYMENT_INITIATED, { source: 'rental', amount: rentalBreakdown.total });
      onSuccessToast?.(`Rental confirmed: ${product.name} (${weeks} weeks)`);
      window.location.assign(checkout.redirectUri);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open payment checkout.', { id: 'enbdpay-rental' });
      setIsPaymentStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-blue-950">{product.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{product.subtitle}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Duration selector */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
              Rental Duration
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={weeks}
                onChange={(e) => setWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center text-lg font-black text-blue-950 border border-slate-200 rounded-xl p-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-slate-600">weeks</span>
              {weeks >= 4 && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {rentalBreakdown.fullMonths} month{rentalBreakdown.fullMonths > 1 ? 's' : ''} at AED {formatAedWhole(monthlyPrice)}/mo
                </span>
              )}
            </div>

            {/* Price breakdown */}
            <div className="mt-4 space-y-1.5 text-xs">
              {rentalBreakdown.fullMonths > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>{rentalBreakdown.fullMonths} month{rentalBreakdown.fullMonths > 1 ? 's' : ''} × AED {formatAedWhole(monthlyPrice)}</span>
                  <span className="font-bold">AED {formatAedWhole(rentalBreakdown.monthlyTotal)}</span>
                </div>
              )}
              {rentalBreakdown.remainingWeeks > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>{rentalBreakdown.remainingWeeks} week{rentalBreakdown.remainingWeeks > 1 ? 's' : ''} × AED {formatAedWhole(weeklyPrice)}</span>
                  <span className="font-bold">AED {formatAedWhole(rentalBreakdown.weeklyTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 pt-1.5 border-t border-slate-200">
                <span>Security deposit (refundable)</span>
                <span className="font-bold">AED {formatAedWhole(securityDeposit)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1.5 border-t border-slate-200">
                <span className="font-black text-blue-950">Total</span>
                <span className="font-black text-medical-green text-lg">AED {formatAedWhole(rentalBreakdown.total)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleBook(); }} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400"/>Full Name *</label>
              <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g. Ahmed Al Rashid" className={`w-full text-xs border rounded-xl p-3 focus:outline-none focus:ring-1 ${formErrors.patientName ? 'border-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}/>
              {formErrors.patientName && <p className="text-[10px] text-red-600 mt-1">{formErrors.patientName}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400"/>Phone Number *</label>
              <PhoneInput value={phone} onChange={setPhone} />
              {formErrors.phone && <p className="text-[10px] text-red-600 mt-1">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400"/>Email Address *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. ahmed@example.com" className={`w-full text-xs border rounded-xl p-3 focus:outline-none focus:ring-1 ${formErrors.email ? 'border-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}/>
              {formErrors.email && <p className="text-[10px] text-red-600 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400"/>Delivery Date *</label>
              <input type="date" required min={new Date().toISOString().split('T')[0]} value={date} onChange={(e) => setDate(e.target.value)} className={`w-full text-xs border rounded-xl p-3 focus:outline-none focus:ring-1 ${formErrors.date ? 'border-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}/>
              {formErrors.date && <p className="text-[10px] text-red-600 mt-1">{formErrors.date}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">Delivery Address *</label>
              <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Villa 12, Jumeirah 1, Dubai" className={`w-full text-xs border rounded-xl p-3 focus:outline-none focus:ring-1 ${formErrors.address ? 'border-red-500' : 'border-slate-200 focus:ring-emerald-500'}`}/>
              {formErrors.address && <p className="text-[10px] text-red-600 mt-1">{formErrors.address}</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">Special Instructions</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific delivery requirements..." rows={2} className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"/>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-[10px] text-amber-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>The security deposit of AED {formatAedWhole(securityDeposit)} is refundable upon safe return of the equipment.</span>
            </div>

            <button
              type="submit"
              disabled={isPaymentStarting}
              className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isPaymentStarting ? 'Opening Payment...' : `Pay AED ${formatAedWhole(rentalBreakdown.total)} to Confirm`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
