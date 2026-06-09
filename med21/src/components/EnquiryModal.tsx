/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, MessageSquare, Phone, Mail, User, HelpCircle, ShieldCheck } from 'lucide-react';
import { HEALTHCARE_SERVICES } from '../data';
import toast from 'react-hot-toast';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceTitle?: string;
  onSuccessToast?: (msg: string) => void;
  loggedInUser?: string | null;
  loggedInUserEmail?: string;
  loggedInUserPhone?: string;
}

export default function EnquiryModal({
  isOpen,
  onClose,
  preselectedServiceTitle = '',
  onSuccessToast,
  loggedInUser = null,
  loggedInUserEmail = '',
  loggedInUserPhone = ''
}: EnquiryModalProps) {
  const [success, setSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobileNine, setMobileNine] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState(preselectedServiceTitle || HEALTHCARE_SERVICES[0].title);
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState<'Email' | 'Phone' | 'WhatsApp'>('Email');
  const [enquiryId, setEnquiryId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Prefill details for logged in users
  useEffect(() => {
    if (isOpen && loggedInUser) {
      setCustomerName((prev) => prev || loggedInUser);
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
    if (isOpen && preselectedServiceTitle) {
      setService(preselectedServiceTitle);
    }
  }, [isOpen, preselectedServiceTitle]);

  const servicesList = HEALTHCARE_SERVICES.map(s => s.title);

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

    if (!customerName.trim()) {
      newErrors.customerName = 'Your name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!mobileNine) {
      newErrors.mobileNine = 'Mobile contact number is required';
      setMobileError('Mobile contact number is required');
    } else if (mobileNine.length !== 9) {
      newErrors.mobileNine = 'UAE mobile number must be exactly 9 digits';
      setMobileError('UAE mobile number must be exactly 9 digits');
    }

    if (!message.trim()) {
      newErrors.message = 'Please enter your question or requirements';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setFormErrors({});

    const generatedId = 'ENQ-' + Math.floor(100000 + Math.random() * 900000);
    const dateToday = new Date().toISOString().split('T')[0];

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName,
          customerEmail: email,
          customerPhone: phone,
          serviceTitle: service,
          message: `${message} [Preferred contact: ${contactMethod}]`,
          contactMethod,
          date: dateToday
        })
      });

      if (response.ok) {
        if (onSuccessToast) {
          onSuccessToast(`Enquiry ${generatedId} submitted successfully!`);
        } else {
          toast.success(`Enquiry ${generatedId} submitted successfully!`);
        }
      } else {
        toast.error('Enquiry could not be saved. Please try again.');
      }
    } catch (err) {
      console.error("Failed to submit enquiry to live backend:", err);
      toast.error('Could not connect to enquiry service. Please try again.');
    }

    setEnquiryId(generatedId);
    setSuccess(true);
  };

  const handleReset = () => {
    setSuccess(false);
    setCustomerName('');
    setPhone('');
    setMobileNine('');
    setMobileError('');
    setEmail('');
    setMessage('');
    setFormErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative overflow-hidden transition-all my-8 max-h-[90vh] flex flex-col border border-slate-100">
        
        {/* Header Segment */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#0c9b6f] bg-emerald-50 px-2.5 py-1 rounded-full inline-block mb-1">
              General / Custom Enquiries
            </span>
            <h3 className="text-lg font-extrabold text-medical-blue">
              {success ? 'Enquiry Submitted' : 'Enquire About Services'}
            </h3>
            <p className="text-[11.5px] text-slate-500 font-medium">
              Have a question or need a custom clinical quote? Get instant guidance.
            </p>
          </div>
          <button
            onClick={success ? handleReset : onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-150 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scroll Frame */}
        <div className="p-6 overflow-y-auto flex-grow text-left">
          {!success ? (
            <form id="enquiry-modal-form" onSubmit={handleSubmit} noValidate className="space-y-4">
              
              {/* Informative Guidance Banner */}
              <div className="bg-[#FAFBFD] border border-slate-200/80 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-600 line-normal font-medium">
                <HelpCircle className="w-5 h-5 text-medical-green shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-800 block mb-0.5">Custom Care &amp; Rates Enquiry</span>
                  If you need specialized diagnostics, monthly nurse schedules, or combined therapy rates, submit this enquiry form. Our dispatch team will revert in 30 minutes.
                </div>
              </div>

              {/* Selector for Service of interest */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Service Category of Interest</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="General Corporate Screening">General Corporate &amp; Wellness Screening</option>
                  <option value="Custom Long-Term Care Quote">Custom Long-Term Care Package</option>
                  {servicesList.map((title, idx) => (
                    <option key={idx} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer/User Contact detail block */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Your Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fatima Mansoor"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formErrors.customerName) {
                        setFormErrors(prev => ({ ...prev, customerName: '' }));
                      }
                    }}
                    className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
                      formErrors.customerName ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                    }`}
                  />
                  {formErrors.customerName && (
                    <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.customerName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. fatima@example.com"
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
              </div>

              {/* Inquiry Message text */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">What is your question or specific requirement? <span className="text-red-600">*</span></label>
                <textarea
                  required
                  placeholder="e.g. Do you offer daily physical rehabilitation? We require a therapist to visit us in JLT every Monday from 9AM. What is the billing cycle?"
                  rows={3}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (formErrors.message) {
                      setFormErrors(prev => ({ ...prev, message: '' }));
                    }
                  }}
                  className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 font-medium text-slate-700 ${
                    formErrors.message ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {formErrors.message && (
                  <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.message}</p>
                )}
              </div>

              {/* Preferred Communication Segment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Preferred Response Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Email', 'Phone', 'WhatsApp'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setContactMethod(method)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        contactMethod === method
                          ? 'border-2 border-medical-green bg-emerald-50/20 text-medical-green'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirmation terms and dispatch button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-400 font-medium leading-normal flex items-center gap-1.5 max-w-[200px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Your medical details are secure with DHA platform policy.
                </span>
                
                <button
                  type="submit"
                  className="bg-medical-green hover:bg-[#0fd08f] hover:shadow-md text-white font-black text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Inquiry</span>
                </button>
              </div>

            </form>
          ) : (
            /* Succession screen */
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 text-[#0fd08f] rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-xs animate-pulse">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-[#0f214a]">Enquiry Logged!</h4>
                <p className="text-xs text-slate-400">Reference Token: <span className="font-extrabold text-[#0fd08f]">{enquiryId}</span></p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left text-xs space-y-3.5 font-medium text-slate-700">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Submission Summary</span>
                  <span className="font-extrabold text-emerald-700">PENDING CALLBACK</span>
                </div>

                <div className="space-y-1.5 text-slate-600 font-medium">
                  <p><strong>inquirer:</strong> {customerName}</p>
                  <p><strong>Mobile:</strong> {phone}</p>
                  <p><strong>Category:</strong> {service}</p>
                  <p className="bg-white/80 border border-slate-150 p-2.5 rounded-lg text-[11px] leading-relaxed italic mt-2 text-slate-500">
                    &ldquo;{message}&rdquo;
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-900 border border-emerald-100/60 p-3 rounded-2xl text-[11px] font-medium leading-relaxed">
                🌿 <strong className="text-emerald-950">Next Steps:</strong> A certified healthcare consultant has been assigned to lookup custom slots or corporate discounts matching your query. Expect a message on <strong className="underline">{contactMethod}</strong> within 30 minutes!
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-medical-blue hover:bg-[#12234f] text-white font-black py-3.5 rounded-xl text-xs tracking-wider transition-all cursor-pointer shadow-xs uppercase"
              >
                Return to Directory
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
