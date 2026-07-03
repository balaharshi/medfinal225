/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, CheckCircle, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { CartItem } from '../types';
import ConfirmDialog from './ConfirmDialog';
import { createEnbdpayCheckout } from '../services/enbdpay';
import { createBooking } from '../services/bookings';
import { formatAedWhole } from '../utils/money';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (productId: string, q: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  loggedInUser?: string | null;
  loggedInUserEmail?: string;
  loggedInUserPhone?: string;
  loggedInUserAddress?: string;
  onAuthOpen?: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  loggedInUser = null,
  loggedInUserEmail = '',
  loggedInUserPhone = '',
  loggedInUserAddress = '',
  onAuthOpen
}: CartDrawerProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'confirm' | 'complete'>('cart');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [mobileNine, setMobileNine] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [patientName, setPatientName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoError, setPromoError] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [dispatchDate, setDispatchDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('08:00 AM - 09:30 AM (Early Morning)');

  useEffect(() => {
    if (isOpen && loggedInUser) {
      setPatientName((prev) => prev || loggedInUser);
    }
  }, [isOpen, loggedInUser]);

  useEffect(() => {
    if (isOpen && loggedInUserPhone) {
      const digits = loggedInUserPhone.replace(/\D/g, '');
      const localDigits = digits.slice(-9);
      setMobileNine((prev) => prev || localDigits);
      setPatientContact((prev) => prev || `${countryCode} ${localDigits}`);
    }
  }, [isOpen, loggedInUserPhone]);

  useEffect(() => {
    if (isOpen && loggedInUserEmail) {
      setPatientEmail((prev) => prev || loggedInUserEmail);
    }
  }, [isOpen, loggedInUserEmail]);

  useEffect(() => {
    if (isOpen && loggedInUserAddress) {
      setPatientAddress((prev) => prev || loggedInUserAddress);
    }
  }, [isOpen, loggedInUserAddress]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const labTestsSubtotal = cartItems
    .filter((item) => item.product.category === 'lab-tests-at-home' || (item.product.category === 'lab-tests' && item.product.subcategory === 'customize-lab-package'))
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const hasLabTests = labTestsSubtotal > 0;
  const homeCollectionFee = hasLabTests && labTestsSubtotal < 1000 ? 150 : 0;
  const discount = appliedPromo === 'MEDZIVA10' ? Math.min(subtotal * 0.1, 100) : 0;
  const roundedDiscount = Math.round(discount);
  const totalCost = Math.round(subtotal + homeCollectionFee - discount);

  const applyPromoCode = () => {
    const normalizedCode = promoCode.trim().toUpperCase();
    if (normalizedCode !== 'MEDZIVA10') {
      setAppliedPromo('');
      setPromoError('Invalid promo code');
      return;
    }

    setPromoCode(normalizedCode);
    setAppliedPromo(normalizedCode);
    setPromoError('');
    toast.success('Promo code applied.');
  };

  const removePromoCode = () => {
    setPromoCode('');
    setAppliedPromo('');
    setPromoError('');
  };

  const handleMobileChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (cleanVal.length <= 9) {
      setMobileNine(cleanVal);
      const combined = cleanVal ? `${countryCode} ${cleanVal}` : '';
      setPatientContact(combined);

      if (cleanVal.length === 0) {
        setMobileError('');
      } else if (cleanVal.length === 9) {
        setMobileError('');
      } else {
        setMobileError('UAE mobile number must be exactly 9 digits');
      }
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!patientName.trim()) {
      newErrors.patientName = 'Customer full name is required';
    }

    if (!patientAddress.trim()) {
      newErrors.patientAddress = 'Delivery address is required';
    }

    if (!patientEmail.trim()) {
      newErrors.patientEmail = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(patientEmail)) {
      newErrors.patientEmail = 'Please enter a valid email address';
    }

    if (!mobileNine) {
      newErrors.mobileNine = 'Mobile contact number is required';
      setMobileError('Mobile contact number is required');
    } else if (mobileNine.length !== 9) {
      newErrors.mobileNine = 'UAE mobile number must be exactly 9 digits';
      setMobileError('UAE mobile number must be exactly 9 digits');
    }

    if (!dispatchDate) {
      newErrors.dispatchDate = 'Preferred dispatch date is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setFormErrors({});
    setIsCheckingOut(true);
    try {
      const itemList = cartItems
        .map((it) => ('name' in it.product ? it.product.name : it.product.title))
        .join(', ');
      const booking = await createBooking({
        customerName: patientName,
        customerEmail: patientEmail,
        customerPhone: patientContact,
        serviceTitle: `Cart: ${itemList.slice(0, 100)}`,
        price: totalCost,
        date: dispatchDate,
        timeSlot: preferredTimeSlot,
        region: 'Dubai',
        status: 'Pending',
        paymentStatus: 'Unpaid',
        notes: JSON.stringify({ items: cartItems, address: patientAddress }),
      });
      const checkout = await createEnbdpayCheckout({
        amount: totalCost,
        description: 'MedZiva product cart',
        source: 'cart',
        category: 'Products',
        bookingId: booking.id,
        customer: {
          fullName: patientName,
          email: patientEmail,
          phone: patientContact,
          address: patientAddress,
        },
      });
      setOrderId(booking.id);
      window.location.assign(checkout.redirectUri);
    } catch (error) {
      console.error('Unable to create ENBDpay cart checkout', error);
      toast.error(error instanceof Error ? error.message : 'Could not open payment checkout.', { id: 'enbdpay-cart' });
      setIsCheckingOut(false);
    }
  };

  const resetCheckout = () => {
    setCheckoutStep('cart');
    setIsCheckingOut(false);
    setMobileNine('');
    setMobileError('');
    setPatientEmail('');
    setPendingDelete(null);
    setFormErrors({});
    setCountryCode('+971');
    setDispatchDate('');
    setPreferredTimeSlot('08:00 AM - 09:30 AM (Early Morning)');
    removePromoCode();
    onClearCart();
    onClose();
  };

  const requestRemoveItem = (productId: string, name: string) => {
    setPendingDelete({ id: productId, name });
  };

  const confirmRemoveItem = () => {
    if (!pendingDelete) return;
    onRemoveItem(pendingDelete.id);
    toast.success(`${pendingDelete.name} removed from cart.`);
    setPendingDelete(null);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-[min(100vw,28rem)] max-w-full bg-white shadow-2xl z-[101] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-medical-green" />
                  <h3 className="font-extrabold text-blue-950 text-base">
                    {checkoutStep === 'complete' ? 'Order Success' : 'Your Shopping Cart'}
                  </h3>
                  <span className="bg-emerald-50 text-medical-green text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartItems.length}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {checkoutStep === 'cart' && (
                  <>
                    {cartItems.length === 0 ? (
                      <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-teal-50 text-medical-green rounded-full flex items-center justify-center mx-auto shadow-xs">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Your cart is empty</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Please explore our certified medical products, supplements, and digital tracking accessories to add them into your cart.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {cartItems.map((item) => (
                          <div
                            key={item.product.id}
                            className="flex items-center gap-3 bg-white border border-slate-150 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow"
                          >
                            <img
                              src={item.product.image}
                              alt={'name' in item.product ? item.product.name : item.product.title}
                              className="w-16 h-16 rounded-xl object-contain bg-slate-50 border border-slate-100 p-1.5"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-grow text-left">
                              <h4 className="text-xs font-extrabold text-blue-950 line-clamp-1">
                                {'name' in item.product ? item.product.name : item.product.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                {'brand' in item.product ? item.product.brand : item.product.category}
                              </span>
                              <div className="text-xs font-black text-medical-green mt-1">
                                AED {formatAedWhole(item.product.price)}
                              </div>
                            </div>

                            <div className="flex flex-col items-end justify-between gap-2 h-16 shrink-0">
                              <button
                                onClick={() =>
                                  requestRemoveItem(
                                    item.product.id,
                                    'name' in item.product ? item.product.name : item.product.title
                                  )
                                }
                                className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                                <button
                                  onClick={() => onUpdateQty(item.product.id, Math.max(1, item.quantity - 1))}
                                  className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                                  className="p-1 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {checkoutStep === 'confirm' && (
                  <form id="checkout-form" onSubmit={handleCheckoutSubmit} noValidate className="space-y-4 text-left">
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Customer Address
                      </h4>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Customer Full Name <span className="text-red-600">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. Abdullah Jamil"
                          required
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
                        <label className="text-[11px] font-bold text-slate-600">Email Address <span className="text-red-600">*</span></label>
                        <input
                          type="email"
                          placeholder="e.g. customer@example.com"
                          required
                          value={patientEmail}
                          onChange={(e) => {
                            setPatientEmail(e.target.value);
                            if (formErrors.patientEmail) {
                              setFormErrors(prev => ({ ...prev, patientEmail: '' }));
                            }
                          }}
                          className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
                            formErrors.patientEmail ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                          }`}
                        />
                        {formErrors.patientEmail && (
                          <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.patientEmail}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Home/Apartment Address (Dubai) <span className="text-red-600">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g. Apt 402, Marina Heights, Dubai Marina"
                          required
                          value={patientAddress}
                          onChange={(e) => {
                            setPatientAddress(e.target.value);
                            if (formErrors.patientAddress) {
                              setFormErrors(prev => ({ ...prev, patientAddress: '' }));
                            }
                          }}
                          className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
                            formErrors.patientAddress ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                          }`}
                        />
                        {formErrors.patientAddress && (
                          <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.patientAddress}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Mobile Number <span className="text-red-600">*</span></label>
                        <div className="relative flex flex-col">
                          <div className="flex gap-2">
                            <select
                              value={countryCode}
                              onChange={(e) => {
                                setCountryCode(e.target.value);
                                if (mobileNine) {
                                  setPatientContact(`${e.target.value} ${mobileNine}`);
                                }
                              }}
                              className="w-[6.5rem] shrink-0 text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="+971">+971 (UAE)</option>
                              <option value="+966">+966 (KSA)</option>
                              <option value="+974">+974 (Qatar)</option>
                              <option value="+973">+973 (Bahrain)</option>
                              <option value="+968">+968 (Oman)</option>
                              <option value="+965">+965 (Kuwait)</option>
                              <option value="+20">+20 (Egypt)</option>
                              <option value="+1">+1 (US/CA)</option>
                              <option value="+44">+44 (UK)</option>
                              <option value="+91">+91 (India)</option>
                            </select>
                            <input
                              type="tel"
                              required
                              maxLength={9}
                              placeholder="5X XXX XXXX"
                              value={mobileNine}
                              onChange={(e) => {
                                handleMobileChange(e.target.value);
                                if (formErrors.mobileNine) {
                                  setFormErrors(prev => ({ ...prev, mobileNine: '' }));
                                }
                              }}
                              className={`flex-1 min-w-0 text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
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

                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Preferred Dispatch Schedule
                      </h4>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Preferred Dispatch Date <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={dispatchDate}
                          onChange={(e) => {
                            setDispatchDate(e.target.value);
                            if (formErrors.dispatchDate) {
                              setFormErrors(prev => ({ ...prev, dispatchDate: '' }));
                            }
                          }}
                          className={`w-full text-xs border rounded-xl p-3 focus:outline-hidden focus:ring-1 ${
                            formErrors.dispatchDate ? 'border-red-500 focus:ring-red-500 bg-red-50/5' : 'border-slate-200 focus:ring-emerald-500'
                          }`}
                        />
                        {formErrors.dispatchDate && (
                          <p className="text-[10px] font-semibold text-red-600 mt-1">{formErrors.dispatchDate}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Preferred Time Slot <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={preferredTimeSlot}
                          onChange={(e) => setPreferredTimeSlot(e.target.value)}
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

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600">Promo Code</label>
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
                          className={`shrink-0 rounded-xl px-4 text-xs font-bold text-white cursor-pointer ${
                            appliedPromo ? 'bg-slate-500 hover:bg-slate-600' : 'bg-medical-blue hover:bg-blue-900'
                          }`}
                        >
                          {appliedPromo ? 'Remove' : 'Apply'}
                        </button>
                      </div>
                      {promoError && <p className="text-[10px] font-semibold text-red-600">{promoError}</p>}
                      {appliedPromo && (
                        <p className="text-[10px] font-semibold text-medical-green">
                          MEDZIVA10 applied: 10% off, capped at AED 100.
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold">AED {formatAedWhole(subtotal)}</span>
                      </div>
                      {hasLabTests && (
                        <div className="flex justify-between text-amber-600">
                          <span>Home Collection Fee</span>
                          <span className="font-bold">{homeCollectionFee > 0 ? `AED ${homeCollectionFee}` : 'Free'}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-medical-green">
                          <span>Promo discount</span>
                          <span className="font-bold">− AED {roundedDiscount}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                        <span className="font-black text-blue-950">Total (inclusive of all tax)</span>
                        <span className="font-black text-medical-green">AED {formatAedWhole(totalCost)}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCheckingOut}
                      className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all mt-4 cursor-pointer shadow-md text-center"
                    >
                      {isCheckingOut ? 'OPENING PAYMENT...' : 'PAY NOW'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutStep('cart')}
                      className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-xs tracking-wider transition-all cursor-pointer text-center"
                    >
                      Go Back
                    </button>
                  </form>
                )}

                {checkoutStep === 'complete' && (
                  <div className="space-y-4 text-center py-6">
                    <div className="w-14 h-14 bg-emerald-50 text-medical-green rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
                      <CheckCircle className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-blue-950">MedZiva Dispatch Confirmed!</h3>
                      <p className="text-xs text-slate-400">Order Ref: <span className="font-bold text-slate-700">{orderId}</span></p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs divide-y divide-slate-200/60 font-medium text-slate-700 relative overflow-hidden">
                      <div className="absolute right-0 top-0 bg-medical-blue text-white text-[8px] font-bold px-3.5 py-1 rounded-bl-xl uppercase tracking-widest">
                        Invoiced
                      </div>

                      <div className="pb-3.5 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Customer Name</span>
                          <span className="font-bold text-slate-900">{patientName || 'Guest Customer'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Contact</span>
                          <span className="font-bold text-slate-900">{mobileNine ? mobileNine.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3') : '5X XXX XXXX'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Delivery Address</span>
                          <span className="font-bold text-slate-900 line-clamp-2 max-w-[180px] text-right">{patientAddress}</span>
                        </div>
                      </div>

                      <div className="py-3.5 space-y-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Purchased Products</span>
                        {cartItems.map(it => (
                          <div key={it.product.id} className="flex justify-between items-center text-[11.5px]">
                            <span>{'name' in it.product ? it.product.name : it.product.title} <span className="text-slate-400 font-bold">x{it.quantity}</span></span>
                          <span className="font-bold text-slate-900">AED {formatAedWhole(it.product.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3.5 space-y-2">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Checkout Subtotal</span>
                          <span>AED {formatAedWhole(subtotal)}</span>
                        </div>
                        {hasLabTests && (
                          <div className="flex justify-between text-[11px] text-amber-600">
                            <span>Home Collection Fee</span>
                            <span>{homeCollectionFee > 0 ? `AED ${homeCollectionFee}` : 'Free'}</span>
                          </div>
                        )}
                        {discount > 0 && (
                          <div className="flex justify-between text-[11px] text-medical-green">
                            <span>Promo discount</span>
                            <span>− AED {roundedDiscount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                          <span className="text-medical-green">Total (inclusive of all tax)</span>
                          <span>AED {formatAedWhole(totalCost)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={resetCheckout}
                      className="w-full bg-medical-blue hover:bg-blue-900 text-white font-bold py-3 rounded-xl text-xs tracking-wider transition-all cursor-pointer shadow-xs mt-4"
                    >
                      CONTINUE HEALTH JOURNEY
                    </button>
                  </div>
                )}
              </div>

              {checkoutStep === 'cart' && cartItems.length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-slate-50 text-left space-y-3 shrink-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-800">AED {formatAedWhole(subtotal)}</span>
                    </div>
                    {hasLabTests && (
                      <div className="flex justify-between text-xs text-amber-600">
                        <span>Home Collection Fee</span>
                        <span className="font-bold">{homeCollectionFee > 0 ? `AED ${homeCollectionFee}` : 'Free'}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-blue-950 font-black pt-2 border-t border-slate-200">
                      <span>Total (inclusive of all tax)</span>
                      <span className="text-medical-green text-base">AED {formatAedWhole(totalCost)}</span>
                    </div>
                  </div>

                  <button
                    id="cart-checkout-btn"
                    onClick={() => {
                      if (!loggedInUser) {
                        toast.error('Please sign in to proceed with checkout.');
                        onClose();
                        onAuthOpen?.();
                        return;
                      }
                      setCheckoutStep('confirm');
                    }}
                    className="w-full bg-medical-green hover:bg-emerald-600 active:scale-95 text-white py-3.5 rounded-xl text-xs tracking-wider transition-all font-bold cursor-pointer text-center"
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              )}
            </motion.div>

            <ConfirmDialog
              isOpen={pendingDelete !== null}
              title="Remove Item?"
              message={`Are you sure you want to delete ${pendingDelete?.name || 'this item'} from the cart? This action cannot be undone.`}
              confirmLabel="Delete Item"
              onConfirm={confirmRemoveItem}
              onCancel={() => setPendingDelete(null)}
            />
          </>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
