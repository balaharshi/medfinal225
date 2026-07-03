import React, { useEffect, useMemo, useState } from 'react';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID || '';
const appleRedirectUri = import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin;

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

const AppleLogo = () => (
  <svg viewBox="0 0 384 512" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.3-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.2-39.2.6-75.5 22.8-95.7 58C-17.2 269.8 13 374.7 52 433.5c19.4 29.2 42.5 62 72.8 60.8 29.2-1.2 40.2-18.9 75.5-18.9 35.1 0 45.2 18.9 76.1 18.3 31.5-.6 51.4-29.8 70.6-59.1 22.3-32.5 31.5-64 31.9-65.6-.7-.3-61-23.4-61.2-100.3zM260.8 102.4c16.1-19.5 27-46.6 24-73.6-23.2.9-51.3 15.5-68 35-14.9 17.2-27.9 44.8-24.4 71.2 25.9 2 52.3-13.2 68.4-32.6z" />
  </svg>
);

interface SocialAuthButtonsProps {
  disabled?: boolean;
  googlePath?: string;
  onSuccess: (data: any) => void | Promise<void>;
  onError: (message: string) => void;
}

export default function SocialAuthButtons({ disabled = false, googlePath = '/api/auth/google', onSuccess, onError }: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const googleButtonId = useMemo(() => `google-login-${Math.random().toString(36).slice(2)}`, []);

  const completeSocialAuth = async (provider: 'google' | 'apple', payload: Record<string, unknown>) => {
    setLoadingProvider(provider);
    try {
      const response = await fetch(provider === 'google' ? googlePath : `/api/auth/${provider}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        onError(data?.error || `${provider === 'google' ? 'Google' : 'Apple'} login could not be completed.`);
        return;
      }

      await onSuccess(data);
    } catch {
      onError('Unable to reach the authentication service.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const initializeGoogleButton = () => {
    if (!googleClientId || !window.google?.accounts?.id) return;
    const target = document.getElementById(googleButtonId);
    if (!target || target.childElementCount > 0) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: { credential?: string }) => {
        if (response?.credential) {
          completeSocialAuth('google', { credential: response.credential });
        } else {
          onError('Google login was canceled.');
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
  }, []);

  const handleAppleLogin = async () => {
    if (!appleClientId) {
      onError('Apple login is not configured yet.');
      return;
    }
    if (!window.AppleID?.auth) {
      onError('Apple login is still loading. Please try again in a moment.');
      return;
    }

    setLoadingProvider('apple');
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
        onError('Apple login was canceled.');
        return;
      }
      await completeSocialAuth('apple', { credential, user: response.user });
    } catch {
      onError('Apple login could not be completed.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">or continue with</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="mx-auto grid w-full max-w-xs grid-cols-1 gap-2">
        <div id={googleButtonId} className="flex min-h-10 w-full items-center justify-center overflow-hidden rounded-xl" />
        <button
          type="button"
          onClick={handleAppleLogin}
          disabled={disabled || loadingProvider === 'apple'}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-950 px-3 py-3 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <AppleLogo />
          {loadingProvider === 'apple' ? 'Apple...' : 'Apple'}
        </button>
      </div>
    </div>
  );
}
