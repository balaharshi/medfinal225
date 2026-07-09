/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, User, Phone, Mail, Award, CheckCircle2, ShieldAlert } from 'lucide-react';
import { HEALTHCARE_SERVICES, SERVICE_CATEGORIES } from '../data';
import toast from 'react-hot-toast';
import { createEnbdpayCheckout } from '../services/enbdpay';
import PhoneInput from './PhoneInput';
import LocationPicker, { SelectedLocation } from './LocationPicker';
import { createBooking } from '../services/bookings';
import { api } from '../lib/api';
import { formatAedWhole } from '../utils/money';
import { TIME_SLOTS, TIME_SLOTS_3HR } from '../constants';
import { trackEvent, AnalyticsEvents } from '../services/analytics';
import { fetchServices, findServiceByTitle, findServiceById, BackendService } from '../services/servicesApi';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceTitle?: string;
  preselectedPrice?: number;
  isLabTest?: boolean;
  loggedInUser?: string | null;
  loggedInUserEmail?: string;
  loggedInUserPhone?: string;
  onSuccessToast?: (msg: string) => void;
  onBookingSuccess?: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  preselectedServiceTitle = '',
  preselectedPrice = 0,
  isLabTest = false,
  loggedInUser = null,
  loggedInUserEmail = '',
  loggedInUserPhone = '',
  onSuccessToast,
  onBookingSuccess
}: BookingModalProps) {
  const [success, setSuccess] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobileNine, setMobileNine] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState(preselectedServiceTitle || HEALTHCARE_SERVICES[0].title);
  const [date, setDate] = useState('');
  const [time, setTime] = useState(TIME_SLOTS[0].label);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isPaymentStarting, setIsPaymentStarting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [region, setRegion] = useState('Dubai');
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [backendServices, setBackendServices] = useState<BackendService[]>([]);
  const [selectedBackendServiceId, setSelectedBackendServiceId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchServices().then((services) => {
        setBackendServices(services);
        // If a service was preselected by title, find its backend ID
        if (preselectedServiceTitle) {
          const match = findServiceByTitle(preselectedServiceTitle, services);
          if (match) setSelectedBackendServiceId(match.id);
        }
      }).catch(() => {});
    }
  }, [isOpen, preselectedServiceTitle]);

  // Prefill details for logged in users
  useEffect(() => {
    if (isOpen && loggedInUser) {
      setPatientName((prev) => prev || loggedInUser);
    }
  }, [isOpen, loggedInUser]);

  useEffect(() => {
    if (isOpen && loggedInUserEmail) {
      setEmail((prev) => prev || loggedInUserEmail);
    }
  }, [isOpen, loggedInUserEmail]);

  useEffect(() => {
    if (isOpen && loggedInUserPhone) {
      setMobileNine((prev) => prev || loggedInUserPhone);
      setPhone((prev) => prev || `+971 ${loggedInUserPhone}`);
    }
  }, [isOpen, loggedInUserPhone]);

  useEffect(() => {
    if (isOpen) {
      trackEvent(AnalyticsEvents.BEGIN_BOOKING, { service: preselectedServiceTitle || service, source: 'modal' });
      if (preselectedServiceTitle) {
        setService(preselectedServiceTitle);
      }
    }
  }, [isOpen, preselectedServiceTitle]);

  const isToday = date === new Date().toISOString().split('T')[0];

  // Resolve the active service: prefer backend service by ID, fallback to hardcoded by title
  const activeBackendService = selectedBackendServiceId ? findServiceById(selectedBackendServiceId, backendServices) : undefined;
  const activeServiceObj = activeBackendService || HEALTHCARE_SERVICES.find(s => s.title === service);
  const activeTimeSlots = activeServiceObj?.id === 'srv-generic-nurse' ? TIME_SLOTS_3HR : TIME_SLOTS;

  const leadTimeHours = activeServiceObj?.leadTimeHours ?? 12;

  const availableSlots = isToday
    ? activeTimeSlots.filter(slot => {
        const now = new Date();
        const slotTime = new Date();
        slotTime.setHours(slot.startHour, slot.startMin, 0, 0);
        const diffMs = slotTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours >= leadTimeHours;
      })
    : activeTimeSlots;

  useEffect(() => {
    if (availableSlots.length === 0) return;
    if (!availableSlots.some(s => s.label === time)) {
      setTime(availableSlots[0].label);
    }
  }, [date, availableSlots, time]);

  // Use backend services for dropdown — fallback to hardcoded if API hasn't loaded yet
  const servicesList = backendServices.length > 0
    ? backendServices.map(s => ({ id: s.id, title: s.title, price: s.price, category: s.category || 'Other' }))
    : HEALTHCARE_SERVICES.map(s => ({ id: s.id, title: s.title, price: s.price, category: s.category || 'Other' }));

  const groupedServices = React.useMemo(() => {
    const groups: Record<string, typeof servicesList> = {};
    servicesList.forEach(s => {
      const cat = s.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [servicesList]);

  const handlePhoneChange = (fullNumber: string) => {
    setPhone(fullNumber);
    setMobileNine(fullNumber.replace(/\D/g, '').replace(/^971/, ''));
    setMobileError('');
  };

  // Find price of selected service — prefer backend price
  const basePrice = activeBackendService?.price || (activeServiceObj ? activeServiceObj.price : preselectedPrice || 250);
  const collectionFee = isLabTest && basePrice < 1000 ? 150 : 0;
  const [promoDiscount, setPromoDiscount] = useState(0);
  const roundedDiscount = Math.round(promoDiscount);
  const activePrice = Math.round(basePrice + collectionFee - promoDiscount);

  const applyPromoCode = async () => {
    const normalizedCode = promoCode.trim().toUpperCase();
    setIsPromoLoading(true);
    setPromoError('');
    try {
      const data = await api.post<{ valid?: boolean; discountAmount?: number; message?: string }>('/api/promos/validate', {
        body: { code: normalizedCode, orderAmount: Math.round(basePrice) },
      });
      if (!data?.valid) {
        setAppliedPromo('');
        setPromoDiscount(0);
        setPromoError(data?.message || 'Invalid promo code');
        return;
      }
      setPromoCode(normalizedCode);
      setAppliedPromo(normalizedCode);
      setPromoDiscount(data?.discountAmount || 0);
      setPromoError('');
      toast.success('Promo code applied.');
    } catch {
      setAppliedPromo('');
      setPromoDiscount(0);
      setPromoError('Failed to validate promo code');
    } finally {
      setIsPromoLoading(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedPromo('');
    setPromoDiscount(0);
    setPromoError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!patientName.trim()) {
      newErrors.patientName = 'Customer full name is required';
    }
    
    if (!phone) {
      newErrors.mobileNine = 'Mobile contact number is required';
      setMobileError('Mobile contact number is required');
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!date) {
      newErrors.date = 'Preferred dispatch date is required';
    }

    if (!address.trim()) {
      newErrors.address = 'Home/apartment address is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setFormErrors({});

    try {
      setIsPaymentStarting(true);
      toast.loading('Creating booking and opening secure ENBDpay checkout...', { id: 'enbdpay-booking' });
      // Use the selected backend service ID directly — never fall back to frontend IDs
      const bookingServiceId = selectedBackendServiceId || null;
      const bookingServiceTitle = activeBackendService?.title || service;
      const bookingCategory = activeBackendService?.category || activeServiceObj?.category || null;
      const bookingSubcategory = activeBackendService?.subcategory || activeServiceObj?.subcategory || null;

      const booking = await createBooking({
        customerName: patientName,
        customerEmail: email,
        customerPhone: phone,
        serviceTitle: bookingServiceTitle,
        vendorName: 'Unassigned',
        serviceId: bookingServiceId,
        category: bookingCategory,
        subcategory: bookingSubcategory,
        price: activePrice,
        date,
        timeSlot: time,
        region,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        notes: notes
          ? `Address: ${address}\n${notes}${location ? `\nLocation: ${location.address || 'pinned'} (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})` : ''}`
          : `Address: ${address}${location ? `\nLocation: ${location.address || 'pinned'} (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})` : ''}`,
      });
      trackEvent(AnalyticsEvents.SUBMIT_BOOKING, { service, price: activePrice, region });
      const checkout = await createEnbdpayCheckout({
        amount: activePrice,
        description: `MedZiva booking ${service}`,
        source: 'booking',
        category: 'Healthcare',
        bookingId: booking.id,
        customer: {
          fullName: patientName,
          email,
          phone,
          address,
        },
      });
      toast.dismiss('enbdpay-booking');
      trackEvent(AnalyticsEvents.PAYMENT_INITIATED, { service, amount: activePrice });
      window.location.assign(checkout.redirectUri);
      return;
    } catch (err) {
      console.error('Booking/Payment error:', err);
      toast.error(err instanceof Error ? err.message : 'Could not open payment checkout.', { id: 'enbdpay-booking' });
      setIsPaymentStarting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setPatientName('');
    setPhone('');
    setMobileNine('');
    setMobileError('');
    setEmail('');
    setDate('');
    setAddress('');
    setNotes('');
    setFormErrors({});
    setPromoCode('');
    setAppliedPromo('');
    setPromoDiscount(0);
    setPromoError('');
    setRegion('Dubai');
    setLocation(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden transition-all my-8 max-h-[90vh] flex flex-col">
        
        {/* Header Block */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="text-left">
            <h3 className="text-lg font-extrabold text-medical-blue">
              {success ? 'Booking Success Ticket' : 'Schedule Healthcare Visit'}
            </h3>
            <p className="text-[11.5px] text-slate-500 font-medium">
              {success ? 'Your professional at-home appointment' : 'Professional care straight to your location.'}
            </p>
          </div>
          <button
            onClick={success ? handleReset : onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto flex-grow text-left">
          {!success && (
            <form id="booking-wizard-form" onSubmit={handleSubmit} noValidate className="space-y-4">
              
              {/* Alert Badge */}
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-2xl flex items-start gap-2.5 text-xs">
                <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  All MedZiva home clinical dispatches follow strict health controls. Your designated professional arrives fully equipped with sterile materials.
                </span>
              </div>

              {/* Service Selection */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Select Desired Healthcare Service <span className="text-red-600">*</span></label>
                <select
                  value={selectedBackendServiceId || service}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Check if this is a backend service ID
                    const backendMatch = findServiceById(val, backendServices);
                    if (backendMatch) {
                      setSelectedBackendServiceId(backendMatch.id);
                      setService(backendMatch.title);
                    } else {
                      // Fallback to hardcoded
                      setSelectedBackendServiceId(null);
                      setService(val);
                    }
                  }}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {groupedServices.map(([cat, items]) => (
                    <optgroup key={cat} label={cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}>
                      {items.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} (AED {formatAedWhole(s.price)})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Customer details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Customer Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salim Al Maktoum"
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      if (formErrors.patientName) {
                        setFormErrors(prev => ({ ...prev, patientName: '' }));
                      }
                    }}
                    className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
                      formErrors.patientName ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                  {formErrors.patientName && (
                    <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.patientName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Mobile Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex flex-col">
                    <PhoneInput
                      value={phone}
                      onChange={handlePhoneChange}
                      error={mobileError || formErrors.mobileNine}
                      required
                    />
                    {(mobileError || formErrors.mobileNine) && (
                      <p className="text-[10px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {mobileError || formErrors.mobileNine}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. salim@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
                    formErrors.email ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Region / Location */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Region / Location <span className="text-red-600">*</span></label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Dubai">Dubai</option>
                  <option value="Sharjah">Sharjah</option>
                </select>
              </div>

              {/* Date & Time slots picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Preferred Dispatch Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (formErrors.date) {
                        setFormErrors(prev => ({ ...prev, date: '' }));
                      }
                    }}
                    className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
                      formErrors.date ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                  {formErrors.date && (
                    <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.date}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Preferred Time Slot <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot.label} value={slot.label}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Home/Apartment Address (Dubai) <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Villa 24, Jasmine District, Dubai Marina, Dubai, UAE"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (formErrors.address) {
                      setFormErrors(prev => ({ ...prev, address: '' }));
                    }
                  }}
                  className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
                    formErrors.address ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {formErrors.address && (
                  <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.address}</p>
                )}
              </div>

              <LocationPicker onLocationChange={setLocation} />

              {/* Medical notes description text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Customer Medical History Notes (Optional)</label>
                <textarea
                  placeholder="Specify allergies, specific conditions or wheelchair requirements..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Promo Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    disabled={Boolean(appliedPromo)}
                    onChange={(event) => {
                      setPromoCode(event.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    placeholder="Enter promo code"
                    className={`min-w-0 flex-1 rounded-xl border p-3 text-xs uppercase focus:outline-hidden focus:ring-1 ${
                      promoError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={appliedPromo ? removePromoCode : applyPromoCode}
                    disabled={isPromoLoading}
                    className={`shrink-0 rounded-xl px-4 text-xs font-bold text-white cursor-pointer ${
                      appliedPromo ? 'bg-slate-500 hover:bg-slate-600' : 'bg-medical-blue hover:bg-blue-900'
                    } disabled:bg-slate-300 disabled:cursor-not-allowed`}
                  >
                    {isPromoLoading ? 'CHECKING...' : appliedPromo ? 'Remove' : 'Apply'}
                  </button>
                </div>
                {promoError && <p className="text-[10px] font-semibold text-red-600">{promoError}</p>}
                {appliedPromo && (
                  <p className="text-[10px] font-semibold text-medical-green">
                    {appliedPromo} applied: AED {roundedDiscount} discount.
                  </p>
                )}
              </div>

              {/* Price representation */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {collectionFee > 0 && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span className="font-bold">Home Collection Fee</span>
                    <span className="font-bold">AED {formatAedWhole(collectionFee)}</span>
                  </div>
                )}
                {roundedDiscount > 0 && (
                  <div className="flex justify-between text-xs text-medical-green">
                    <span className="font-bold">Promo discount</span>
                    <span className="font-bold">− AED {formatAedWhole(roundedDiscount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Consultation Fee</span>
                    <span className="text-base font-black text-medical-green mt-1">AED {formatAedWhole(activePrice)}</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isPaymentStarting}
                    className="bg-medical-green hover:bg-[#0fd08f] hover:scale-102 hover:shadow-md text-white font-bold text-xs tracking-wider py-3.5 px-6 rounded-xl transition-all cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isPaymentStarting ? 'OPENING PAYMENT...' : 'PAY NOW'}
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
