/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User, Sparkles, Phone } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import PhoneInput from './PhoneInput';
import toast from 'react-hot-toast';
import { trackEvent, AnalyticsEvents } from '../services/analytics';

const newlogo = '/newlogo.png';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: any;
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
  phone: string;
  password: string;
  acceptedTerms: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AuthFormValues>({
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
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
      ui_locale: 'en',
      callback: (response: { credential?: string }) => {
        if (response?.credential) {
          completeSocialAuth({ credential: response.credential });
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
  }, [isOpen]);

  if (!isOpen) return null;

  const closeModal = () => {
    setAuthError(null);
    setAuthView('login');
    setForgotEmail('');
    setResetEmail('');
    setResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    reset();
    onClose();
  };

  const getFriendlyAuthError = (data: any, signingUp: boolean) => {
    const message = String(data?.error || '').toLowerCase();
    if (message.includes('email is already registered')) {
      return 'This email is already registered. Please use Login instead.';
    }
    if (message.includes('validation')) {
      return signingUp
        ? 'Please enter a valid name, email, and password with at least 8 characters.'
        : 'Please enter a valid email and password.';
    }
    if (message.includes('invalid credentials')) {
      return 'The email or password is incorrect. Please try again.';
    }
    if (message.includes('backend api') || message.includes('unavailable') || message.includes('server error')) {
      return 'We could not connect to the secure login service. Please try again in a moment.';
    }
    if (message.includes('unique constraint') || message.includes('duplicate')) {
      return signingUp
        ? 'This email is already registered. Please use Login instead.'
        : 'An account error occurred. Please try again.';
    }
    // Show actual error in development, generic in production
    const isDev = window.location.hostname === 'localhost';
    if (isDev && data?.error) {
      return `Error: ${data.error}`;
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
                phone: values.phone.trim(),
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

        trackEvent(isSignUp ? AnalyticsEvents.SIGNUP : AnalyticsEvents.LOGIN, { method: 'email' });
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

  const completeSocialAuth = async (payload: Record<string, unknown>) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await fetch('/api/auth/google', {
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
      trackEvent(AnalyticsEvents.GOOGLE_LOGIN, { method: 'google' });
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setAuthError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        toast.success('If your email is registered, you\'ll receive a reset code.');
        setResetEmail(forgotEmail.trim());
        setAuthView('reset');
      } else {
        const msg = data?.error || 'Something went wrong. Please try again.';
        setAuthError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'We could not connect to the secure login service. Please try again in a moment.';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setAuthError(null);

    if (resetNewPassword !== resetConfirmPassword) {
      const msg = 'Passwords do not match.';
      setAuthError(msg);
      toast.error(msg);
      setResetLoading(false);
      return;
    }

    if (resetNewPassword.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setAuthError(msg);
      toast.error(msg);
      setResetLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          newPassword: resetNewPassword,
        }),
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        toast.success('Password has been reset successfully. Please sign in.');
        setAuthView('login');
        setResetCode('');
        setResetNewPassword('');
        setResetConfirmPassword('');
      } else {
        const msg = data?.error || 'Invalid or expired reset code.';
        setAuthError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'We could not connect to the secure login service. Please try again in a moment.';
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
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
                Your healthcare, one step away.
              </h2>
              <p className="max-w-sm text-sm font-medium leading-relaxed text-white/80">
                Book home visits, lab tests, and equipment rentals — all in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="relative min-h-0 overflow-y-auto">
          <button
            onClick={closeModal}
            aria-label="Close login dialog"
            className="absolute right-4 top-4 z-20 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
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
                <span>
                  {authView === 'forgot' && 'Reset Your Password'}
                  {authView === 'reset' && 'Enter Reset Code'}
                    {authView === 'login' && (isSignUp ? 'Create MedZiva Account' : 'Sign in to MedZiva')}
                </span>
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </h3>
              <p className="text-gray-500 text-xs sm:text-[13px]">
                {authView === 'forgot' && 'Enter your email to receive a password reset code.'}
                {authView === 'reset' && 'Enter the code sent to your email and choose a new password.'}
                    {authView === 'login' && (isSignUp ? 'Join thousands of happy MedZiva customers.' : 'Book home healthcare services in minutes.')}
              </p>
            </div>
          </div>

        {authView === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="px-5 pb-6 pt-3 sm:px-8 sm:pb-8 space-y-3.5">
          {authError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3">
              {authError}
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Customer Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g. customer@medzivahealthcare.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={forgotLoading}
            className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all mt-2 cursor-pointer shadow-md text-center"
          >
            {forgotLoading ? 'SENDING...' : 'SEND RESET CODE'}
          </button>

          <button
            type="button"
            onClick={() => { setAuthView('login'); setAuthError(null); }}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer pt-1"
          >
            &larr; Back to Login
          </button>
        </form>
        )}

        {authView === 'reset' && (
        <form onSubmit={handleResetPassword} className="px-5 pb-6 pt-3 sm:px-8 sm:pb-8 space-y-3.5">
          {authError && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3">
              {authError}
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email Address
            </label>
            <input
              type="email"
              value={resetEmail}
              readOnly
              className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-gray-50 text-slate-500"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              6-Digit Reset Code <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 123456"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 tracking-widest font-mono"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              New Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Confirm New Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={resetConfirmPassword}
              onChange={(e) => setResetConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={resetLoading}
            className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all mt-2 cursor-pointer shadow-md text-center"
          >
            {resetLoading ? 'RESETTING...' : 'RESET PASSWORD'}
          </button>

          <button
            type="button"
            onClick={() => { setAuthView('login'); setAuthError(null); setResetCode(''); setResetNewPassword(''); setResetConfirmPassword(''); }}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer pt-1"
          >
            &larr; Back to Login
          </button>
        </form>
        )}

        {authView === 'login' && (
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
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 text-center py-1.5 text-xs font-bold leading-none cursor-pointer ${
                isSignUp ? 'text-medical-green border-b-2 border-medical-green pb-1' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign Up
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

          {isSignUp && (
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Mobile Number <span className="text-red-600">*</span>
              </label>
              <Controller
                name="phone"
                control={control}
                rules={{ validate: (v) => !isSignUp || (v && v.trim().length > 0) || 'Mobile number is required' }}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value || ''}
                    onChange={field.onChange}
                    error={errors.phone?.message}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-[10px] font-semibold text-red-600">{errors.phone.message}</p>
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
              placeholder="e.g. customer@medzivahealthcare.com"
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
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            {errors.password && (
              <p className="text-[10px] font-semibold text-red-600">{errors.password.message}</p>
            )}
          </div>

          {!isSignUp && (
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => { setAuthView('forgot'); setAuthError(null); }}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-medical-green hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all mt-2 cursor-pointer shadow-md text-center"
          >
            {authLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Login'}
          </button>

          <p className="text-[10px] text-slate-400 text-center leading-snug mt-2">
            By clicking {isSignUp ? 'Create Account' : 'Login'}, I certify that all details submitted are accurate and I consent to MedZiva's <a href="https://medzivahealthcare.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold cursor-pointer hover:underline">Terms &amp; Conditions</a>.
          </p>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-bold uppercase text-slate-400">or continue with</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="mx-auto w-full max-w-xs">
            <div id="medziva-google-login-button" className="flex min-h-10 w-full items-center justify-center overflow-hidden rounded-xl" />
          </div>
        </form>
        )}
        </div>
      </div>
    </div>
  );
}
