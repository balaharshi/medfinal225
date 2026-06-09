/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { CartItem } from '../types';
import ConfirmDialog from './ConfirmDialog';

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
  loggedInUserAddress = ''
}: CartDrawerProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'confirm' | 'complete'>('cart');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [mobileNine, setMobileNine] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [patientName, setPatientName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && loggedInUser) {
      setPatientName((prev) => prev || loggedInUser);
    }
  }, [isOpen, loggedInUser]);

  useEffect(() => {
    if (isOpen && loggedInUserPhone) {
      setMobileNine((prev) => prev || loggedInUserPhone);
      setPatientContact((prev) => prev || `+971 ${loggedInUserPhone}`);
    }
  }, [isOpen, loggedInUserPhone]);

  useEffect(() => {
    if (isOpen && loggedInUserAddress) {
      setPatientAddress((prev) => prev || loggedInUserAddress);
    }
  }, [isOpen, loggedInUserAddress]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCost = Math.round(subtotal * 100) / 100;

  const handleMobileChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (cleanVal.length <= 9) {
      setMobileNine(cleanVal);
      const combined = cleanVal ? `+971 ${cleanVal}` : '';
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

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!patientName.trim()) {
      newErrors.patientName = 'Customer full name is required';
    }

    if (!patientAddress.trim()) {
      newErrors.patientAddress = 'Delivery address is required';
    }

    if (!mobileNine) {
      newErrors.mobileNine = 'Mobile contact number is required';
      setMobileError('Mobile contact number is required');
    } else if (mobileNine.length !== 9) {
      newErrors.mobileNine = 'UAE mobile number must be exactly 9 digits';
      setMobileError('UAE mobile number must be exactly 9 digits');
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setFormErrors({});
    const generatedId = 'MDZ-' + Math.floor(100000 + Math.random() * 900000);
    setOrderId(generatedId);
    setCheckoutStep('complete');
    toast.success('Order confirmed successfully.');
  };

  const resetCheckout = () => {
    setCheckoutStep('cart');
    setIsCheckingOut(false);
    setMobileNine('');
    setMobileError('');
    setPendingDelete(null);
    setFormErrors({});
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

  return (
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col justify-between"
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
                                AED {item.product.price}
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

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2 mt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-bold">AED {subtotal}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                        <span className="font-black text-blue-950">Total (inclusive of all tax)</span>
                        <span className="font-black text-medical-green">AED {totalCost}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all mt-4 cursor-pointer shadow-md text-center"
                    >
                      CONFIRM &amp; PLACE ORDER
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
                      <h3 className="text-lg font-black text-blue-950">Medziva Dispatch Confirmed!</h3>
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
                          <span className="font-bold text-slate-900">{patientContact || '+971-55-XXX-XXXX'}</span>
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
                            <span className="font-bold text-slate-900">AED {it.product.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3.5 space-y-2">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Checkout Subtotal</span>
                          <span>AED {subtotal}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                          <span className="text-medical-green">Total (inclusive of all tax)</span>
                          <span>AED {totalCost}</span>
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
                      <span className="font-bold text-slate-800">AED {subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-950 font-black pt-2 border-t border-slate-200">
                      <span>Total (inclusive of all tax)</span>
                      <span className="text-medical-green text-base">AED {totalCost}</span>
                    </div>
                  </div>

                  <button
                    id="cart-checkout-btn"
                    onClick={() => setCheckoutStep('confirm')}
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
    </>
  );
}
