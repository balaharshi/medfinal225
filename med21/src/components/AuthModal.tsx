/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, KeyRound, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const newlogo = '/newlogo.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string, email: string) => void;
}

interface AuthFormValues {
  fullName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthFormValues>({
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      acceptedTerms: true,
    },
  });

  if (!isOpen) return null;

  const closeModal = () => {
    setAuthError(null);
    reset();
    onClose();
  };

  const getFriendlyAuthError = (data: any, signingUp: boolean) => {
    const message = String(data?.error || '').toLowerCase();
    if (message.includes('email is already registered')) {
      return 'This email is already registered. Please use Customer login instead.';
    }
    if (message.includes('validation')) {
      return signingUp
        ? 'Please enter a valid name, email, and password with at least 6 characters.'
        : 'Please enter a valid email and password.';
    }
    if (message.includes('invalid credentials')) {
      return 'The email or password is incorrect. Please try again.';
    }
    if (message.includes('backend api') || message.includes('unavailable')) {
      return 'We could not connect to the secure login service. Please try again in a moment.';
    }
    return signingUp
      ? 'Registration could not be completed. Please check your details and try again.'
      : 'Sign in could not be completed. Please check your details and try again.';
  };

  const submitAuth = async (values: AuthFormValues) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(isSignUp ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isSignUp
            ? {
                fullName: values.fullName.trim(),
                email: values.email.trim(),
                password: values.password.trim(),
              }
            : {
                email: values.email.trim(),
                password: values.password.trim(),
              }
        ),
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        if (data.accessToken) {
          localStorage.setItem('medziva_user_token', data.accessToken);
        }

        const user = data.user || {};
        const fallbackName = isSignUp
          ? values.fullName.trim()
          : values.email.split('@')[0].replace(/^./, (char) => char.toUpperCase());

        onSuccess(user.fullName || fallbackName, user.email || values.email.trim());
        closeModal();
      } else {
        const friendlyError = getFriendlyAuthError(data, isSignUp);
        setAuthError(friendlyError);
        toast.error(friendlyError);
      }
    } catch {
      const friendlyError = 'We could not connect to the secure login service. Please try again in a moment.';
      setAuthError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative overflow-hidden transition-all text-left">
        <div className="bg-white p-6 relative flex flex-col gap-3">
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 p-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <img
            src={newlogo}
            alt="Medziva Logo"
            className="h-24 w-auto mx-auto object-contain"
            referrerPolicy="no-referrer"
          />

          <div className="space-y-1 text-center">
            <h3 className="text-xl font-black flex items-center justify-center gap-1.5 text-medical-blue">
              <span>{isSignUp ? 'Create Medziva Profile' : 'Sign in to Medziva'}</span>
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </h3>
            <p className="text-gray-500 text-xs">
              {isSignUp ? 'Vetted home support visits await your dispatch.' : 'Access healthcare checkups and purchase history.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(submitAuth)} className="p-6 space-y-4">
          {authError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3">
              {authError}
            </div>
          )}

          <div className="flex border-b border-gray-100 pb-3">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 text-center py-1.5 text-xs font-bold leading-none cursor-pointer ${
                !isSignUp ? 'text-medical-green border-b-2 border-medical-green pb-1' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Customer login
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 text-center py-1.5 text-xs font-bold leading-none cursor-pointer ${
                isSignUp ? 'text-medical-green border-b-2 border-medical-green pb-1' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Customer Login
            </button>
          </div>

          {isSignUp && (
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Customer Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Salim Ben Jamil"
                {...register('fullName', {
                  validate: (value) => !isSignUp || value.trim().length > 0 || 'Customer full name is required',
                })}
                className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              {errors.fullName && (
                <p className="text-[10px] font-semibold text-red-600">{errors.fullName.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Customer Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. customer@medziva.com"
              {...register('email', {
                required: 'Customer email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Please enter a valid email address',
                },
              })}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            {errors.email && <p className="text-[10px] font-semibold text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Security Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            {errors.password && (
              <p className="text-[10px] font-semibold text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-400 text-left">
            <input
              type="checkbox"
              id="accepted-privacy-checkbox"
              {...register('acceptedTerms', {
                validate: (value) => value || 'You must accept the terms to continue',
              })}
              className="mt-0.5 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="accepted-privacy-checkbox" className="leading-snug">
              I certify that all details submitted correspond to valid DHA regulations, and I consent to the storage of my medical appointments inside Medziva. <span className="text-red-600">*</span>
            </label>
          </div>
          {errors.acceptedTerms && (
            <p className="text-[10px] font-semibold text-red-600 -mt-2">{errors.acceptedTerms.message}</p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-[#10B981] hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all mt-4 cursor-pointer shadow-md text-center"
          >
            {authLoading ? 'PROCESSING...' : isSignUp ? 'REGISTER MEDZIVA MEMBERSHIP' : 'SIGN IN SECURELY'}
          </button>

          <div className="flex items-center gap-1 text-[11.5px] text-slate-500 justify-center">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            <span>256-bit HIPAA Vetted encryption</span>
          </div>
        </form>
      </div>
    </div>
  );
}
