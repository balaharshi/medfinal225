import React, { useEffect, useMemo, useState } from 'react';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: any;
  }
}

interface SocialAuthButtonsProps {
  disabled?: boolean;
  googlePath?: string;
  onSuccess: (data: any) => void | Promise<void>;
  onError: (message: string) => void;
}

export default function SocialAuthButtons({ disabled = false, googlePath = '/api/auth/google', onSuccess, onError }: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | null>(null);
  const googleButtonId = useMemo(() => `google-login-${Math.random().toString(36).slice(2)}`, []);

  const completeSocialAuth = async (payload: Record<string, unknown>) => {
    setLoadingProvider('google');
    try {
      const response = await fetch(googlePath, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data?.success) {
        onError(data?.error || 'Google login could not be completed.');
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
          completeSocialAuth({ credential: response.credential });
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
  }, []);

  if (!googleClientId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">or continue with</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="mx-auto w-full max-w-xs">
        <div id={googleButtonId} className="flex min-h-10 w-full items-center justify-center overflow-hidden rounded-xl" />
      </div>
    </div>
  );
}
