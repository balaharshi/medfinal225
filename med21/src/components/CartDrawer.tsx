/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, CheckCircle, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import PhoneInput from './PhoneInput';
import LocationPicker, { SelectedLocation } from './LocationPicker';
import { CartItem } from '../types';
import ConfirmDialog from './ConfirmDialog';
import { createEnbdpayCheckout } from '../services/enbdpay';
import { createBooking } from '../services/bookings';
import { formatAedWhole } from '../utils/money';
import { TIME_SLOTS } from '../constants';
import { trackEvent, AnalyticsEvents } from '../services/analytics';

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

function parseSlotStartTime(slot: { startHour: number; startMin: number }): Date {
  const now = new Date();
  const d = new Date(now);
  d.setHours(slot.startHour, slot.startMin, 0, 0);
  return d;
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
  const [mobileError, setMobileError] = useState('');
  const [patientName, setPatientName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [region, setRegion] = useState('Dubai');
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  type TimeSlot = { label: string; startHour: number; startMin: number; endHour?: number; endMin?: number };

  const [dispatchDate, setDispatchDate] = useState('');
  const [itemTimeSlots, setItemTimeSlots] = useState<Record<string, TimeSlot>>({});
  const [itemAvailableSlots, setItemAvailableSlots] = useState<Record<string, TimeSlot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch available time slots for each cart item when date or items change
  useEffect(() => {
    if (!dispatchDate || cartItems.length === 0) {
      setItemAvailableSlots({});
      setItemTimeSlots({});
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);

    Promise.all(cartItems.map(async (item) => {
      const product = item.product as any;
      const serviceId = product.id;
      // Only fetch for services (skip products with no serviceId pattern)
      if (!serviceId || (!String(serviceId).startsWith('srv-') && !product.category)) {
        return { serviceId, slots: null };
      }
      try {
        const res = await fetch(`/api/services/${encodeURIComponent(serviceId)}/available-slots?date=${encodeURIComponent(dispatchDate)}`);
        if (!res.ok) return { serviceId, slots: null };
        const data = await res.json();
        return { serviceId, slots: Array.isArray(data) && data.length > 0 ? data : null };
      } catch {
        return { serviceId, slots: null };
      }
    })).then(results => {
      if (cancelled) return;
      const slotsMap: Record<string, TimeSlot[]> = {};
      const timeMap: Record<string, TimeSlot> = {};

      results.forEach(({ serviceId, slots }) => {
        if (slots) {
          slotsMap[serviceId] = slots;
          timeMap[serviceId] = slots[0];
        } else {
          // Fallback to default slots filtered for today
          const defaults = filterDefaultSlots(dispatchDate);
          slotsMap[serviceId] = defaults;
          timeMap[serviceId] = defaults[0];
        }
      });

      setItemAvailableSlots(slotsMap);
      setItemTimeSlots(timeMap);
      setLoadingSlots(false);
    });

    return () => { cancelled = true; };
  }, [dispatchDate, cartItems]);

  // Filter default TIME_SLOTS for today (past slots removed)
  const filterDefaultSlots = useCallback((date: string): TimeSlot[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (date !== todayStr) return [...TIME_SLOTS];
    const now = new Date();
    const filtered = TIME_SLOTS.filter(slot => parseSlotStartTime(slot) > now);
    return filtered.length > 0 ? [...filtered] : [...TIME_SLOTS];
  }, []);

  useEffect(() => {
    if (isOpen && loggedInUser) {
      setPatientName((prev) => prev || loggedInUser);
    }
  }, [isOpen, loggedInUser]);

  useEffect(() => {
    if (isOpen && loggedInUserPhone) {
      setPatientContact((prev) => prev || loggedInUserPhone);
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
  const roundedDiscount = Math.round(promoDiscount);
  const totalCost = Math.round(subtotal + homeCollectionFee - promoDiscount);

  const applyPromoCode = async () => {
    const normalizedCode = promoCode.trim().toUpperCase();
    setIsPromoLoading(true);
    setPromoError('');
    try {
      const data = await api.post<{ valid?: boolean; discountAmount?: number; message?: string }>('/api/promos/validate', {
        body: { code: normalizedCode, orderAmount: Math.round(subtotal) },
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

    if (!patientContact) {
      newErrors.mobileNine = 'Mobile contact number is required';
      setMobileError('Mobile contact number is required');
    }

    if (!dispatchDate) {
      newErrors.dispatchDate = 'Preferred dispatch date is required';
    }

    // Validate each item has an available time slot
    cartItems.forEach((item) => {
      const serviceId = (item.product as any).id;
      if (!itemTimeSlots[serviceId]) {
        newErrors.timeSlots = 'Please select a time for all services';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setFormErrors({});
    setIsCheckingOut(true);
    try {
      // Validate cart prices against current API data
      const [srvRes, prodRes] = await Promise.all([
        fetch('/api/services').then(r => r.ok ? r.json() : []),
        fetch('/api/products').then(r => r.ok ? r.json() : []),
      ]);
      const currentPrices: Record<string, number> = {};
      (Array.isArray(srvRes) ? srvRes : []).forEach((s: any) => { currentPrices[s.id] = s.price; });
      (Array.isArray(prodRes) ? prodRes : []).forEach((p: any) => { currentPrices[p.id] = p.price; });

      let priceChanged = false;

      // Create one booking per cart item
      const bookings: any[] = [];
      let effectiveTotal = 0;
      for (const item of cartItems) {
        const product = item.product as any;
        const serviceId = product.id;
        const currentPrice = currentPrices[serviceId];
        const effectivePrice = currentPrice || product.price;
        if (currentPrice && currentPrice !== product.price) {
          priceChanged = true;
        }
        effectiveTotal += effectivePrice * item.quantity;
        const slot = itemTimeSlots[serviceId] || TIME_SLOTS[0];
        const title = 'name' in product ? product.name : product.title;
        const category = product.category || '';
        const subcategory = product.subcategory || '';

        const booking = await createBooking({
          customerName: patientName,
          customerEmail: patientEmail,
          customerPhone: patientContact,
          serviceTitle: title,
          serviceId: String(serviceId).startsWith('srv-') ? serviceId : undefined,
          category,
          subcategory,
          price: effectivePrice * item.quantity,
          date: dispatchDate,
          timeSlot: slot.label,
          region,
          status: 'Pending',
          paymentStatus: 'Unpaid',
          notes: JSON.stringify({ address: patientAddress, location }),
        });
        bookings.push(booking);
      }

      // Apply promo discount to total
      if (promoDiscount > 0) {
        effectiveTotal = Math.max(0, effectiveTotal - promoDiscount);
      }

      if (priceChanged) {
        toast.success('Some service prices have been updated to reflect current rates.');
      }

      trackEvent(AnalyticsEvents.SUBMIT_CART_CHECKOUT, { items: cartItems.length, total: effectiveTotal });

      // One payment for the total, linked to first booking
      const primaryBooking = bookings[0];
      const checkout = await createEnbdpayCheckout({
        amount: effectiveTotal,
        description: `MedZiva order (${bookings.length} items)`,
        source: 'cart',
        category: 'Products',
        bookingId: primaryBooking.id,
        customer: {
          fullName: patientName,
          email: patientEmail,
          phone: patientContact,
          address: location
            ? `${patientAddress} | Location: ${location.address || 'pinned'} (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})`
            : patientAddress,
        },
      });
      setOrderId(primaryBooking.id);
      trackEvent(AnalyticsEvents.PAYMENT_INITIATED, { source: 'cart', amount: effectiveTotal });
      window.location.assign(checkout.redirectUri);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open payment checkout.', { id: 'enbdpay-cart' });
      setIsCheckingOut(false);
    }
  };

  const resetCheckout = () => {
    setCheckoutStep('cart');
    setIsCheckingOut(false);
    setPatientContact('');
    setMobileError('');
    setPatientEmail('');
    setPendingDelete(null);
    setFormErrors({});
    setRegion('Dubai');
    setLocation(null);
    setDispatchDate('');
    setItemTimeSlots({});
    setItemAvailableSlots({});
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
                  aria-label="Close cart"
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
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
                                aria-label="Remove item"
                                className="text-red-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                                <button
                                  onClick={() => onUpdateQty(item.product.id, Math.max(1, item.quantity - 1))}
                                  aria-label="Decrease quantity"
                                  className="p-2 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-bold px-1.5">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                  className="p-2 hover:bg-white rounded text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
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
                          <PhoneInput
                            value={patientContact}
                            onChange={(val) => {
                              setPatientContact(val);
                              setMobileError('');
                              if (formErrors.mobileNine) {
                                setFormErrors(prev => ({ ...prev, mobileNine: '' }));
                              }
                            }}
                            error={mobileError || formErrors.mobileNine}
                          />
                          {(mobileError || formErrors.mobileNine) && (
                            <p className="text-[10px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                              <span>⚠️</span> {mobileError || formErrors.mobileNine}
                            </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <LocationPicker onLocationChange={setLocation} />

                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Preferred Dispatch Schedule
                    </h4>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Region / Location <span className="text-red-600">*</span></label>
                        <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Dubai">Dubai</option>
                          <option value="Sharjah">Sharjah</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Preferred Dispatch Date <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
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

                      {/* Per-service time slot selectors */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Time Slots (per service) <span className="text-red-600">*</span>
                        </label>
                        {loadingSlots && (
                          <p className="text-[10px] text-slate-400">Loading available slots...</p>
                        )}
                        {cartItems.map((item) => {
                          const product = item.product as any;
                          const serviceId = product.id;
                          const title = 'name' in product ? product.name : product.title;
                          const slots = itemAvailableSlots[serviceId];
                          const selected = itemTimeSlots[serviceId];

                          return (
                            <div key={serviceId} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                              <p className="text-[10px] font-bold text-slate-500 mb-1.5 truncate">{title}</p>
                              {slots && slots.length > 0 ? (
                                <select
                                  value={selected?.label || ''}
                                  onChange={(e) => {
                                    const found = slots.find(s => s.label === e.target.value);
                                    if (found) {
                                      setItemTimeSlots(prev => ({ ...prev, [serviceId]: found }));
                                    }
                                  }}
                                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                  {slots.map((slot) => (
                                    <option key={slot.label} value={slot.label}>{slot.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <p className="text-[10px] text-red-500">No slots available for this date</p>
                              )}
                            </div>
                          );
                        })}
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
                      {roundedDiscount > 0 && (
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
                          <span className="font-bold text-slate-900">{patientContact || '5X XXX XXXX'}</span>
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
                        {roundedDiscount > 0 && (
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
