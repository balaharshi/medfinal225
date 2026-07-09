/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

export default function RentalBookingModal({
  isOpen,
  onClose,
  product,
  onSuccessToast,
  loggedInUser = null,
  loggedInUserEmail = '',
  loggedInUserPhone = '',
  loggedInUserAddress = '',
}: RentalBookingModalProps) {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isPaymentStarting, setIsPaymentStarting] = useState(false);
  const [backendServices, setBackendServices] = useState<BackendService[]>([]);

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
      setFormErrors({});
      setIsPaymentStarting(false);
    }
  }, [isOpen, loggedInUser, loggedInUserEmail, loggedInUserPhone, loggedInUserAddress]);

  if (!isOpen || !product) return null;

  const handleBook = async () => {
    const newErrors: Record<string, string> = {};

    if (!patientName.trim()) {
      newErrors.patientName = 'Full name is required';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Valid phone number is required';
    }

    if (!email.trim() || !email.includes('@')) {
      newErrors.email = 'A valid email is required';
    }

    if (!date.trim()) {
      newErrors.date = 'Preferred rental start date is required';
    }

    if (!address.trim()) {
      newErrors.address = 'Delivery address is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

      setFormErrors({});

      try {
        setIsPaymentStarting(true);
        toast.loading('Creating rental booking and opening secure payment...', { id: 'enbdpay-rental' });
        const backendService = findServiceByTitle(product.name, backendServices);
        // Only use backend service IDs — never frontend product IDs
        const booking = await createBooking({
          customerName: patientName,
          customerEmail: email,
          customerPhone: phone,
          serviceTitle: backendService?.title || product.name,
          vendorName: 'Unassigned',
          serviceId: backendService?.id || null,
          category: backendService?.category || 'devices-for-rent',
          subcategory: backendService?.subcategory || 'rent-medical-equipments',
          price: product.price,
          date,
          region: 'Dubai',
          status: 'Pending',
          paymentStatus: 'Unpaid',
          notes: notes ? `Address: ${address}\nRental product: ${product.name}\n${notes}` : `Address: ${address}\nRental product: ${product.name}`,
        });
        const checkout = await createEnbdpayCheckout({
          amount: product.price,
          description: `MedZiva rental booking ${product.name}`,
          source: 'booking',
          category: 'Rental',
          bookingId: booking.id,
          customer: {
            fullName: patientName,
            email,
            phone,
            address,
          },
        });
      toast.dismiss('enbdpay-rental');
      trackEvent(AnalyticsEvents.SUBMIT_RENTAL_BOOKING, { product: product.name, price: product.price });
      trackEvent(AnalyticsEvents.PAYMENT_INITIATED, { source: 'rental', amount: product.price });
      onSuccessToast?.(`Rental booking confirmed for ${product.name}!`);
      window.location.assign(checkout.redirectUri);
      return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open payment checkout.', { id: 'enbdpay-rental' });
      setIsPaymentStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden transition-all my-8 max-h-[90vh] flex flex-col">
        
        {/* Header Block */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="text-left">
            <h3 className="text-lg font-extrabold text-medical-blue">
              Book Rental Equipment
            </h3>
            <p className="text-[11.5px] text-slate-500 font-medium">
              Complete your rental booking for this medical equipment.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Summary */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-blue-950 truncate">{product.name}</h4>
              <p className="text-[11px] text-slate-500 truncate">{product.subtitle}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-black text-medical-green">AED {formatAedWhole(product.price)}</span>
                {product.attributes?.find?.((a: any) => a.label === 'Security Deposit') && (
                  <span className="text-[10px] text-slate-400 font-bold">+ Security Deposit</span>
                )}
              </div>
            </div>
          </div>
          {product.attributes?.find?.((a: any) => a.label === 'Booking notice') && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-bold">
              <Clock className="w-3 h-3" />
              <span>{product.attributes.find((a: any) => a.label === 'Booking notice')?.value}</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter your full name"
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border ${formErrors.patientName ? 'border-red-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition-all`}
              />
            </div>
            {formErrors.patientName && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.patientName}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
            <PhoneInput
              value={phone}
              onChange={(fullNumber) => {
                setPhone(fullNumber);
              }}
              error={formErrors.phone}
              required
            />
            {formErrors.phone && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border ${formErrors.email ? 'border-red-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition-all`}
              />
            </div>
            {formErrors.email && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.email}</p>}
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Preferred Delivery Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border ${formErrors.date ? 'border-red-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition-all`}
              />
            </div>
            {formErrors.date && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.date}</p>}
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Delivery Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Home / apartment address in Dubai"
              rows={2}
              className={`w-full px-3 py-2.5 bg-slate-50 border ${formErrors.address ? 'border-red-400' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition-all resize-none`}
            />
            {formErrors.address && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.address}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Special Instructions (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements or notes..."
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition-all resize-none"
            />
          </div>

          {/* HIPAA Notice */}
          <div className="flex items-start gap-2 bg-blue-50/60 border border-blue-100 rounded-xl p-3">
            <ShieldAlert className="w-4 h-4 text-medical-blue mt-0.5 flex-shrink-0" />
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              Your personal data is encrypted and processed under strict HIPAA-compliant protocols. We never share patient information with third parties.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80">
          <button
            onClick={handleBook}
            disabled={isPaymentStarting}
            className="w-full py-3 bg-medical-green hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black text-sm rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-medical-green/20"
          >
            {isPaymentStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirm & Pay AED {formatAedWhole(product.price)}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 mt-2 text-slate-400 hover:text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
