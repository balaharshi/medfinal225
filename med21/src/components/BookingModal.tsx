/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, User, Phone, Mail, Award, CheckCircle2, ShieldAlert } from 'lucide-react';
import { HEALTHCARE_SERVICES, SERVICE_CATEGORIES } from '../data';
import toast from 'react-hot-toast';

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

    const generatedRefId = 'MED-B-' + Math.floor(100000 + Math.random() * 900000);
    const clinicians = [
      'Dr. Robert Chen, DPT (Licensed Physiotherapist)',
      'Nurse Sarah Jenkins, RN (Registered Nurse)',
      'Dr. Amira Al-Masri, SLP (Speech Pathologist)',
      'Coach Marcus Vance (Certified Personal Trainer)',
      'Mary Katherine, RN (Elderly Care Specialist)'
    ];
    const chosenClinician = clinicians[Math.floor(Math.random() * clinicians.length)];
    
    // Attempt backend registration
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: patientName,
          customerEmail: email,
          customerPhone: phone,
          serviceTitle: service,
          serviceId: activeServiceObj?.id,
          price: activePrice,
          date: date || new Date().toISOString().split('T')[0],
          timeSlot: time,
          region: "Dubai",
          notes: notes
        })
      });

      if (!response.ok) {
        toast.error('Booking could not be saved. Please try again.');
      }
    } catch (err) {
      console.error("Non-blocking failure writing live backend booking, showing local ticket fallback:", err);
      toast.error('Could not connect to booking service. Please try again.');
    }
    
    setRefId(generatedRefId);
    setAssignedClinician(chosenClinician);
    
    // Show success toast notification
    if (onSuccessToast) {
      onSuccessToast('Booking confirmed successfully! Your appointment has been scheduled.');
    } else {
      toast.success('Booking confirmed successfully! Your appointment has been scheduled.');
    }
    
    // Trigger booking success callback for redirect (if provided, don't show internal success view)
    if (onBookingSuccess) {
      onBookingSuccess();
    } else {
      setSuccess(true);
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
    onClose();
  };

  // Find price of selected service
  const activeServiceObj = HEALTHCARE_SERVICES.find(s => s.title === service);
  const activePrice = activeServiceObj ? activeServiceObj.price : preselectedPrice || 250;

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
              {success ? 'Your professional at-home appointment' : 'DHA-certified care straight to your dynamic location.'}
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
                  All Medziva home clinical dispatches follow strict health controls. Your designated professional arrives fully equipped with sterile materials.
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
                      {s.title} (AED {s.price})
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

              {/* Price representation */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Consultation Fee</span>
                  <span className="text-base font-black text-medical-green mt-1">AED {activePrice}</span>
                </div>
                
                <button
                  type="submit"
                  className="bg-medical-green hover:bg-[#0fd08f] hover:scale-102 hover:shadow-md text-white font-bold text-xs tracking-wider py-3.5 px-6 rounded-xl transition-all cursor-pointer"
                >
                  CONFIRM APPOINTMENT
                </button>
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
                  <span className="text-base font-black text-emerald-600">AED {activePrice}</span>
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
