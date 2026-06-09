/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, CheckCircle, Shield, Award, Edit3, Save, Calendar, Clock, Package } from 'lucide-react';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceTitle: string;
  vendorName: string;
  price: number;
  date: string;
  timeSlot: string;
  region: string;
  status: string;
  notes: string;
  createdAt: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  phone: string; // 9-digit UAE mobile number
  address: string;
  onSave: (fullName: string, email: string, phone: string, address: string) => void;
  onSuccessToast: (msg: string) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  fullName,
  email,
  phone,
  address,
  onSave,
  onSuccessToast
}: ProfileModalProps) {
  const [nameVal, setNameVal] = useState(fullName);
  const [emailVal, setEmailVal] = useState(email);
  const [mobileNine, setMobileNine] = useState(phone);
  const [addressVal, setAddressVal] = useState(address);
  const [mobileError, setMobileError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Fetch user bookings when bookings tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'bookings' && bookings.length === 0) {
      fetchBookings();
    }
  }, [isOpen, activeTab]);

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await fetch('/api/bookings');
      if (response.ok) {
        const allBookings = await response.json();
        // Filter bookings for the current user by email
        const userBookings = allBookings.filter((b: Booking) => 
          b.customerEmail === email
        );
        setBookings(userBookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Sync state when details load
  useEffect(() => {
    if (isOpen) {
      setNameVal(fullName);
      setEmailVal(email);
      setMobileNine(phone);
      setAddressVal(address);
      setMobileError('');
      setIsSaved(false);
      setFormErrors({});
    }
  }, [isOpen, fullName, email, phone, address]);

  if (!isOpen) return null;

  const handleMobileChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (cleanVal.length <= 9) {
      setMobileNine(cleanVal);
      if (cleanVal.length === 0 || cleanVal.length === 9) {
        setMobileError('');
      } else {
        setMobileError('UAE mobile number must be exactly 9 digits');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!nameVal.trim()) {
      newErrors.fullName = 'Full patient name is required';
    }

    if (!emailVal.trim()) {
      newErrors.email = 'Registered email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(emailVal)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!mobileNine) {
      newErrors.mobileNine = 'Mobile number is required';
      setMobileError('Mobile number is required');
    } else if (mobileNine.length !== 9) {
      newErrors.mobileNine = 'UAE mobile number must be exactly 9 digits';
      setMobileError('Please enter a valid 9-digit mobile number');
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setFormErrors({});
    
    onSave(nameVal.trim(), emailVal.trim(), mobileNine, addressVal.trim());
    setIsSaved(true);
    onSuccessToast('Your premium Medziva profile has been updated!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden transition-all text-left my-8 max-h-[90vh] flex flex-col">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-medical-blue to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/35">
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Your Patient Profile</h3>
              <p className="text-gray-300 text-xs mt-0.5">View and update your personalized home care settings.</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-medical-blue'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'bookings'
                  ? 'bg-white text-medical-blue'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              My Bookings
            </button>
          </div>
        </div>

        {/* Body & Form content */}
        {activeTab === 'profile' ? (
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 overflow-y-auto flex-grow">
            
            {isSaved ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-14 w-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">Changes Saved Successfully</h4>
                  <p className="text-xs text-slate-500 mt-1">Your profile settings are synchronized across all Medziva bookings.</p>
                </div>
              </div>
            ) : (
              <>
              {/* Shield visual summary */}
              <div className="bg-sky-50/50 rounded-2xl p-3 border border-sky-100 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-sky-800">Secure Healthcare profile</span>
                  <p className="text-[10.5px] text-slate-500 leading-snug">
                    Your personal information is encrypted and compliant with DHA privacy directives.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Full Patient Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameVal}
                    onChange={(e) => {
                      setNameVal(e.target.value);
                      if (formErrors.fullName) {
                        setFormErrors(prev => ({ ...prev, fullName: '' }));
                      }
                    }}
                    placeholder="Enter your full legal name"
                    className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 text-slate-800 font-medium ${
                      formErrors.fullName ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                  {formErrors.fullName && (
                    <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                {/* Email address input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Registered Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailVal}
                    onChange={(e) => {
                      setEmailVal(e.target.value);
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    placeholder="e.g. name@domain.com"
                    className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 text-slate-800 font-medium ${
                      formErrors.email ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500 bg-slate-50/50'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.email}</p>
                  )}
                </div>

                {/* UAE Mobile Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Mobile Number <span className="text-red-600">*</span>
                  </label>
                  <div className="relative flex flex-col">
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-xs font-extrabold text-slate-500 select-none border-r border-slate-200 pr-3 mr-3.5">
                        +971
                      </span>
                      <input
                        type="tel"
                        maxLength={9}
                        placeholder="50 123 4567"
                        value={mobileNine}
                        onChange={(e) => {
                          handleMobileChange(e.target.value);
                          if (formErrors.mobileNine) {
                            setFormErrors(prev => ({ ...prev, mobileNine: '' }));
                          }
                        }}
                        className={`w-full text-xs border rounded-xl p-3 pl-18 focus:outline-hidden focus:ring-1 text-slate-800 font-medium ${
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

                {/* Dubai Visit Home Address */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Default Dubai Delivery / Home Care Address
                  </label>
                  <textarea
                    rows={2}
                    value={addressVal}
                    onChange={(e) => setAddressVal(e.target.value)}
                    placeholder="e.g. Villa 24, Jasmine District, Dubai Marina, Dubai, UAE"
                    className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 leading-relaxed font-medium resize-none"
                  />
                  <p className="text-[9.5px] text-slate-400 italic">
                    Prefilled automatically on appointment checkouts for your convenience.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 active:scale-98 text-slate-700 font-extrabold text-xs rounded-xl tracking-wider transition-all cursor-pointer text-center"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-medical-green hover:bg-emerald-600 active:scale-98 text-white font-black text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE CHANGES</span>
                </button>
              </div>
            </>
          )}
          </form>
        ) : (
          <div className="p-6 space-y-4 overflow-y-auto flex-grow">
            {bookingsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-blue mx-auto"></div>
                <p className="text-xs text-slate-500 mt-3">Loading your bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-black text-slate-800 mb-1">No Bookings Yet</h4>
                <p className="text-xs text-slate-500">You haven't made any healthcare appointments yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{booking.serviceTitle}</h4>
                        <span className="text-[9px] text-slate-400 font-medium">ID: {booking.id}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full shrink-0 ${
                        booking.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'Canceled' ? 'bg-red-100 text-red-700' :
                        booking.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-3 space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-medical-blue" />
                        <span className="text-slate-700 font-medium">{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-medical-blue" />
                        <span className="text-slate-700 font-medium">{booking.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Package className="w-3.5 h-3.5 text-medical-blue" />
                        <span className="text-slate-700 font-medium">{booking.vendorName}</span>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 mb-3">
                        <p className="text-[10px] text-slate-600 italic">
                          <span className="font-semibold text-slate-700">Notes:</span> {booking.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Cost</span>
                        <span className="text-xs font-bold text-medical-green">AED {booking.price}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Region</span>
                        <span className="text-xs font-medium text-slate-600">{booking.region}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
