/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, User, Phone, Mail, Award, CheckCircle2, ShieldAlert } from 'lucide-react';
import { HEALTHCARE_SERVICES, SERVICE_CATEGORIES } from '../data';
import toast from 'react-hot-toast';
import { createEnbdpayCheckout } from '../services/enbdpay';
import { createBooking } from '../services/bookings';
import { formatAedWhole } from '../utils/money';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceTitle?: string;
  preselectedPrice?: number;
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
  const [time, setTime] = useState('09:00 AM - 10:00 AM (Morning)');
  const [notes, setNotes] = useState('');
  const [refId, setRefId] = useState('');
  const [assignedClinician, setAssignedClinician] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isPaymentStarting, setIsPaymentStarting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [region, setRegion] = useState('Dubai');

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
      // Sync preselectedServiceTitle when modal is opened on product action
      if (preselectedServiceTitle) {
        setService(preselectedServiceTitle);
      }
    }
  }, [isOpen, preselectedServiceTitle]);

  const servicesList = HEALTHCARE_SERVICES.map(s => ({ id: s.id, title: s.title, price: s.price }));

  const handleMobileChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (cleanVal.length <= 9) {
      setMobileNine(cleanVal);
      const combined = cleanVal ? `+971 ${cleanVal}` : '';
      setPhone(combined);
      
      if (cleanVal.length === 0) {
        setMobileError('');
      } else if (cleanVal.length === 9) {
        setMobileError('');
      } else {
        setMobileError('UAE mobile number must be exactly 9 digits');
      }
    }
  };

  // Find price of selected service
  const activeServiceObj = HEALTHCARE_SERVICES.find(s => s.title === service);
  const basePrice = activeServiceObj ? activeServiceObj.price : preselectedPrice || 250;
  const [promoDiscount, setPromoDiscount] = useState(0);
  const roundedDiscount = Math.round(promoDiscount);
  const activePrice = Math.round(basePrice - promoDiscount);

  const applyPromoCode = async () => {
    const normalizedCode = promoCode.trim().toUpperCase();
    setIsPromoLoading(true);
    setPromoError('');
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalizedCode, orderAmount: Math.round(basePrice) }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAppliedPromo('');
        setPromoDiscount(0);
        setPromoError(data.message || 'Invalid promo code');
        return;
      }
      setPromoCode(normalizedCode);
      setAppliedPromo(normalizedCode);
      setPromoDiscount(data.discountAmount || 0);
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
    
    if (!mobileNine) {
      newErrors.mobileNine = 'Mobile contact number is required';
      setMobileError('Mobile contact number is required');
    } else if (mobileNine.length !== 9) {
      newErrors.mobileNine = 'UAE mobile number must be exactly 9 digits';
      setMobileError('UAE mobile number must be exactly 9 digits');
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!date) {
      newErrors.date = 'Preferred dispatch date is required';
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
      const booking = await createBooking({
        customerName: patientName,
        customerEmail: email,
        customerPhone: phone,
        serviceTitle: service,
        vendorName: 'Unassigned',
        serviceId: activeServiceObj?.id ? String(activeServiceObj.id) : null,
        category: activeServiceObj?.category || null,
        subcategory: activeServiceObj?.subcategory || null,
        price: activePrice,
        date,
        timeSlot: time,
        region,
        status: 'Pending',
        paymentStatus: 'Unpaid',
        notes,
      });
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
          address: notes || 'Dubai',
        },
      });
      toast.dismiss('enbdpay-booking');
      window.location.assign(checkout.redirectUri);
      return;
    } catch (err) {

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
    setNotes('');
    setFormErrors({});
    setPromoCode('');
    setAppliedPromo('');
    setPromoDiscount(0);
    setPromoError('');
    setRegion('Dubai');
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
          {!success ? (
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
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {servicesList.map((s, idx) => (
                    <option key={idx} value={s.title}>
                      {s.title} (AED {formatAedWhole(s.price)})
                    </option>
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
                    <div className="relative flex items-center">
                      <span className="absolute left-4.5 text-xs font-extrabold text-slate-500 select-none border-r border-slate-200 pr-3 mr-3.5">
                        +971
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={9}
                        placeholder="50 123 4567"
                        value={mobileNine}
                        onChange={(e) => {
                          handleMobileChange(e.target.value);
                          if (formErrors.mobileNine) {
                            setFormErrors(prev => ({ ...prev, mobileNine: '' }));
                          }
                        }}
                        className={`w-full text-xs border rounded-xl p-3 pl-18 focus:outline-hidden focus:ring-1 ${
                          mobileError || formErrors.mobileNine
                            ? 'border-red-500 focus:ring-red-500 bg-red-50/5' 
                            : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                      />
                    </div>
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
                  <option value="Abu Dhabi">Abu Dhabi</option>
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
                    <option>08:00 AM - 09:30 AM (Early Morning)</option>
                    <option>10:00 AM - 11:30 AM (Pre Noon)</option>
                    <option>12:30 PM - 02:00 PM (Afternoon)</option>
                    <option>03:00 PM - 04:30 PM (Late Afternoon)</option>
                    <option>05:30 PM - 07:00 PM (Evening)</option>
                    <option>08:00 PM - 09:30 PM (Night Shift)</option>
                  </select>
                </div>
              </div>

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
          ) : (
            /* Successful confirmation ticket layout */
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-medical-blue">Home Visit Registered!</h4>
                <p className="text-xs text-slate-400">Booking Reference ID: <span className="font-bold text-slate-700">{refId}</span></p>
              </div>

              {/* Printable Ticket Shape block */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left text-xs divide-y divide-slate-150 relative overflow-hidden font-medium text-slate-700">
                
                {/* Visual Medical cross watermark effect */}
                <div className="absolute right-0 top-0 bg-emerald-600 text-white text-[8px] font-extrabold px-3 py-1.5 rounded-bl-xl uppercase tracking-widest">
                  CONFIRMED
                </div>

                {/* Customer data */}
                <div className="pb-3.5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10.5px]">Customer Name</span>
                    <span className="font-extrabold text-slate-900">{patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10.5px]">Contact Mobile</span>
                    <span className="font-extrabold text-medical-blue">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10.5px]">Dispatch Email</span>
                    <span className="font-extrabold text-slate-900">{email}</span>
                  </div>
                </div>

                {/* Service in ticket detail */}
                <div className="py-3.5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10.5px]">Care Service</span>
                    <span className="font-extrabold text-slate-900">{service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10.5px]">Schedule Time</span>
                    <span className="font-bold text-slate-900">{date} at {time.split(' ')[0]} {time.split(' ')[1]}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400 text-[10.5px]">Healthcare Officer</span>
                    <span className="font-extrabold text-emerald-700 text-right max-w-[180px]">{assignedClinician}</span>
                  </div>
                  {notes && (
                    <div className="bg-white/75 border border-slate-150 p-2 rounded-lg text-[11px] text-slate-500 font-normal">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">Customer History Notes:</span>
                      &ldquo;{notes}&rdquo;
                    </div>
                  )}
                </div>

                {/* Cost segment */}
                <div className="pt-3.5 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-slate-500">Consultation Fee Paid</span>
                  <span className="text-base font-black text-emerald-600">AED {formatAedWhole(activePrice)}</span>
                </div>

              </div>

              <div className="bg-sky-50 text-blue-900 border border-sky-100 p-3 rounded-2xl text-[11px]">
                ⚕️ <span className="font-bold">Customer Instruction:</span> Please make sure your home address fits selected GPS coordinates. The care team will call 15 minutes prior to confirmation.
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-medical-blue hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all cursor-pointer shadow-xs"
              >
                DISMISS TICKET
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
