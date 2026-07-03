/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const newlogo = '/newlogo.png';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID || '';
const appleRedirectUri = import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin;

const AppleLogo = () => (
  <svg viewBox="0 0 384 512" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.3-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.2-39.2.6-75.5 22.8-95.7 58C-17.2 269.8 13 374.7 52 433.5c19.4 29.2 42.5 62 72.8 60.8 29.2-1.2 40.2-18.9 75.5-18.9 35.1 0 45.2 18.9 76.1 18.3 31.5-.6 51.4-29.8 70.6-59.1 22.3-32.5 31.5-64 31.9-65.6-.7-.3-61-23.4-61.2-100.3zM260.8 102.4c16.1-19.5 27-46.6 24-73.6-23.2.9-51.3 15.5-68 35-14.9 17.2-27.9 44.8-24.4 71.2 25.9 2 52.3-13.2 68.4-32.6z" />
  </svg>
);

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

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

  const initializeGoogleButton = () => {
    if (!googleClientId || !window.google?.accounts?.id) return;
    const target = document.getElementById('medziva-google-login-button');
    if (!target || target.childElementCount > 0) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: { credential?: string }) => {
        if (response?.credential) {
          completeSocialAuth('google', { credential: response.credential });
        } else {
          toast.error('Google login was canceled.');
        }
      },
    });
    window.google.accounts.id.renderButton(target, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      width: Math.min(target.clientWidth || 300, 320),
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    if (googleClientId && !document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleButton;
      document.head.appendChild(script);
    } else {
      window.setTimeout(initializeGoogleButton, 100);
    }

    if (appleClientId && !document.querySelector('script[src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [isOpen]);

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
                password: values.password,
              }
            : {
                email: values.email.trim(),
                password: values.password,
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

  const completeSocialAuth = async (provider: 'google' | 'apple', payload: Record<string, unknown>) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(`/api/auth/${provider}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        const friendlyError = getFriendlyAuthError(data, false);
        setAuthError(friendlyError);
        toast.error(friendlyError);
        return;
      }

      if (data.accessToken) {
        localStorage.setItem('medziva_user_token', data.accessToken);
      }

      const user = data.user || {};
      onSuccess(user.fullName || user.email || 'MedZiva Customer', user.email || '');
      closeModal();
    } catch {
      const friendlyError = 'We could not connect to the secure login service. Please try again in a moment.';
      setAuthError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!appleClientId) {
      toast.error('Apple login is not configured yet.');
      return;
    }

    if (!window.AppleID?.auth) {
      toast.error('Apple login is still loading. Please try again in a moment.');
      return;
    }

    try {
      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: 'name email',
        redirectURI: appleRedirectUri,
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const credential = response?.authorization?.id_token;
      if (!credential) {
        toast.error('Apple login was canceled.');
        return;
      }
      completeSocialAuth('apple', { credential, user: response.user });
    } catch {
      toast.error('Apple login could not be completed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[96vh] md:h-[min(760px,94vh)] relative overflow-hidden transition-all text-left grid md:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden md:flex relative min-h-0 bg-slate-950 overflow-hidden">
          <img
            src="/b1.png"
            alt="MedZiva healthcare service"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-br from-blue-950/80 via-emerald-950/55 to-slate-950/80" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-6 p-8 text-white">
            <img
              src={newlogo}
              alt="MedZiva Logo"
              className="h-28 w-fit max-w-[260px] rounded-2xl bg-white/95 p-4 object-contain shadow-xl"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-3 pb-1">
              <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                Home healthcare made simple
              </span>
              <h2 className="text-2xl lg:text-3xl font-black leading-tight">
                Secure access to your MedZiva care profile.
              </h2>
              <p className="max-w-sm text-sm font-medium leading-relaxed text-white/80">
                Book visits, manage appointments, and continue with your saved healthcare history.
              </p>
            </div>
          </div>
        </div>

        <div className="relative min-h-0 overflow-y-auto">
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 z-20 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="bg-white px-5 pt-6 pb-3 sm:px-8 sm:pt-8 relative flex flex-col gap-3">
            <img
              src={newlogo}
              alt="MedZiva Logo"
              className="h-28 w-auto mx-auto object-contain md:hidden"
              referrerPolicy="no-referrer"
            />

            <div className="space-y-1 text-center md:text-left md:pr-10">
              <h3 className="text-xl sm:text-2xl font-black flex items-center justify-center md:justify-start gap-1.5 text-medical-blue">
                <span>{isSignUp ? 'Create MedZiva Profile' : 'Sign in to MedZiva'}</span>
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </h3>
              <p className="text-gray-500 text-xs sm:text-[13px]">
                {isSignUp ? 'Vetted home support visits await your dispatch.' : 'Access healthcare checkups and purchase history.'}
              </p>
            </div>
          </div>

        <form onSubmit={handleSubmit(submitAuth)} className="px-5 pb-6 pt-3 sm:px-8 sm:pb-8 space-y-3.5">
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

          <div className="flex items-start gap-2 pt-1 text-[10.5px] text-slate-400 text-left">
            <input
              type="checkbox"
              id="accepted-privacy-checkbox"
              {...register('acceptedTerms', {
                validate: (value) => value || 'You must accept the terms to continue',
              })}
              className="mt-0.5 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="accepted-privacy-checkbox" className="leading-snug">
              I certify that all details submitted correspond to valid DHA regulations, and I consent to the storage of my medical appointments inside MedZiva. <span className="text-red-600">*</span>
            </label>
          </div>
          {errors.acceptedTerms && (
            <p className="text-[10px] font-semibold text-red-600 -mt-2">{errors.acceptedTerms.message}</p>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-[#10B981] hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all mt-2 cursor-pointer shadow-md text-center"
          >
            {authLoading ? 'PROCESSING...' : isSignUp ? 'REGISTER MEDZIVA MEMBERSHIP' : 'SIGN IN SECURELY'}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-bold uppercase text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="mx-auto grid w-full max-w-xs grid-cols-1 gap-2">
            <div id="medziva-google-login-button" className="flex min-h-10 w-full items-center justify-center overflow-hidden rounded-xl" />
            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={authLoading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-950 px-3 py-3 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <AppleLogo />
              Apple
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
