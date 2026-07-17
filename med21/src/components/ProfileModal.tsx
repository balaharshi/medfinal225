/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, CheckCircle, Shield, Award, Edit3, Save, Calendar, Clock, Package, ArrowLeft, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import PhoneInput from './PhoneInput';
import ConfirmDialog from './ConfirmDialog';
import { api } from '../lib/api';

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
  rescheduleCount: number;
  serviceId?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  phone: string; // 9-digit UAE mobile number
  address: string;
  onSave: (fullName: string, email: string, phone: string, address: string) => Promise<void>;
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
  const [phoneVal, setPhoneVal] = useState(phone);
  const [addressVal, setAddressVal] = useState(address);
  const [mobileError, setMobileError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Reschedule state
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<{ label: string }[]>([]);
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);

  // Fetch user bookings when bookings tab is opened
  useEffect(() => {
    if (isOpen && activeTab === 'bookings' && bookings.length === 0) {
      fetchBookings();
    }
  }, [isOpen, activeTab]);

  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await api.get('/api/my-bookings');
      setBookings(data as any);
    } catch {
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.delete(`/api/my-bookings/${bookingId}`);
      setBookings((prev) => prev.map((b: any) => b.id === bookingId ? { ...b, status: 'Cancelled' } : b));
      toast.success('Booking cancelled');
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError('New password must include uppercase, number, and special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/api/auth/change-password', {
        body: { currentPassword, newPassword },
      });
      toast.success('Password changed successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Sync state when details load
  useEffect(() => {
    if (isOpen) {
      setNameVal(fullName);
      setEmailVal(email);
      setPhoneVal(phone);
      setAddressVal(address);
      setMobileError('');
      setIsSaved(false);
      setFormErrors({});
    }
  }, [isOpen, fullName, email, phone, address]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!phoneVal) {
      newErrors.phoneVal = 'Mobile number is required';
      setMobileError('Mobile number is required');
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setFormErrors({});
    
    try {
      await onSave(nameVal.trim(), emailVal.trim(), phoneVal, addressVal.trim());
      setIsSaved(true);
      onSuccessToast('Your premium MedZiva profile has been updated!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden transition-all text-left my-8 max-h-[90vh] flex flex-col">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-medical-blue to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
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
                  <p className="text-xs text-slate-500 mt-1">Your profile settings are synchronized across all MedZiva bookings.</p>
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
                    <PhoneInput
                      value={phoneVal}
                      onChange={(val) => {
                        setPhoneVal(val);
                        setMobileError('');
                        if (formErrors.phoneVal) {
                          setFormErrors(prev => ({ ...prev, phoneVal: '' }));
                        }
                      }}
                      error={mobileError || formErrors.phoneVal}
                    />
                    {(mobileError || formErrors.phoneVal) && (
                      <p className="text-[10px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {mobileError || formErrors.phoneVal}
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

              {!showChangePassword ? (
                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center gap-2 text-xs font-bold text-medical-blue hover:text-blue-800 py-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Change Password
                </button>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      Change Password
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordError('');
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-[10px] font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">{passwordError}</p>
                  )}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); }}
                      placeholder="Enter current password"
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                        placeholder="New password"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                        placeholder="Confirm new password"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="w-full py-2.5 bg-medical-blue hover:bg-blue-900 text-white font-black text-xs rounded-lg cursor-pointer transition-all disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              )}

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
                        {booking.rescheduleCount > 0 && (
                          <span className="text-[9px] text-amber-600 block">Rescheduled {booking.rescheduleCount} time(s)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Region</span>
                          <span className="text-xs font-medium text-slate-600">{booking.region}</span>
                        </div>

                        {rescheduleBookingId === booking.id ? (
                          <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={rescheduleDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={async (e) => {
                                  setRescheduleDate(e.target.value);
                                  setRescheduleSlots([]);
                                  setRescheduleTimeSlot('');
                                    if (e.target.value && booking.serviceId) {
                                      try {
                                        const data = await api.get<any>(`/api/services/${booking.serviceId}/available-slots?date=${e.target.value}`, { noAuth: true });
                                        if (Array.isArray(data)) setRescheduleSlots(data);
                                      } catch {}
                                    }
                                }}
                                className="w-full text-[10px] border border-blue-200 rounded-lg p-2 bg-white"
                              />
                              {rescheduleSlots.length > 0 && (
                                <select
                                  value={rescheduleTimeSlot}
                                  onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                                  className="w-full text-[10px] border border-blue-200 rounded-lg p-2 bg-white"
                                >
                                  <option value="">Select slot</option>
                                  {rescheduleSlots.map(s => (
                                    <option key={s.label} value={s.label}>{s.label}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setRescheduleBookingId(null);
                                  setRescheduleDate('');
                                  setRescheduleSlots([]);
                                  setRescheduleTimeSlot('');
                                }}
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer border border-slate-200"
                              >
                                Back
                              </button>
                              <button
                                onClick={async () => {
                                  if (!rescheduleDate || !rescheduleTimeSlot) {
                                    toast.error('Please select a date and time slot');
                                    return;
                                  }
                                  setRescheduling(true);
                                  try {
                                    await api.post(`/api/my-bookings/${booking.id}/reschedule`, {
                                      body: { date: rescheduleDate, timeSlot: rescheduleTimeSlot },
                                    });
                                    toast.success('Booking rescheduled successfully');
                                    setRescheduleBookingId(null);
                                    setRescheduleDate('');
                                    setRescheduleSlots([]);
                                    setRescheduleTimeSlot('');
                                    fetchBookings();
                                  } catch (e: any) {
                                    toast.error(e.message || 'Failed to reschedule');
                                  } finally {
                                    setRescheduling(false);
                                  }
                                }}
                                disabled={rescheduling}
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-medical-green text-white hover:bg-emerald-600 cursor-pointer border border-emerald-500 disabled:opacity-50"
                              >
                                {rescheduling ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {(booking.status === 'Pending' || booking.status === 'Active') && booking.rescheduleCount < 1 && (
                              <button
                                onClick={() => {
                                  setRescheduleBookingId(booking.id);
                                  setRescheduleDate('');
                                  setRescheduleSlots([]);
                                  setRescheduleTimeSlot('');
                                }}
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                              >
                                Reschedule
                              </button>
                            )}
                            {(booking.status === 'Pending' || booking.status === 'Active') && (
                              <button
                                onClick={() => setCancelBookingId(booking.id)}
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer border border-red-200"
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={Boolean(cancelBookingId)}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmLabel="Cancel Booking"
        onConfirm={() => {
          if (cancelBookingId) handleCancelBooking(cancelBookingId);
          setCancelBookingId(null);
        }}
        onCancel={() => setCancelBookingId(null)}
      />
    </div>
  );
}
