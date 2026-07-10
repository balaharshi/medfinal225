import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-8W5X7EH91F';
const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID || '';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

let gaInitialized = false;
let fbInitialized = false;

export function initGA() {
  if (gaInitialized) return;
  ReactGA.initialize(GA_MEASUREMENT_ID);
  gaInitialized = true;
}

export function initFacebookPixel() {
  if (fbInitialized || !FB_PIXEL_ID) return;

  // Inject the Facebook Pixel script
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${FB_PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // NoScript fallback
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1"/>`;
  document.head.appendChild(noscript);

  fbInitialized = true;
}

export function trackPageView(path: string, title?: string) {
  if (!gaInitialized) initGA();
  ReactGA.send({ hitType: 'pageview', page: path, title });
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (!gaInitialized) initGA();
  ReactGA.event(name, params);

  // Track key events via Facebook Pixel too
  if (fbInitialized && window.fbq) {
    const fbEventMap: Record<string, string> = {
      'payment_initiated': 'InitiateCheckout',
      'payment_completed': 'Purchase',
      'add_to_cart': 'AddToCart',
      'begin_booking': 'Lead',
      'signup': 'CompleteRegistration',
    };
    const fbEvent = fbEventMap[name];
    if (fbEvent) {
      window.fbq('track', fbEvent, params);
    }
  }
}

export const AnalyticsEvents = {
  VIEW_SERVICE: 'view_service',
  BEGIN_BOOKING: 'begin_booking',
  SUBMIT_BOOKING: 'submit_booking',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  BEGIN_CART_CHECKOUT: 'begin_cart_checkout',
  SUBMIT_CART_CHECKOUT: 'submit_cart_checkout',
  BEGIN_RENTAL_BOOKING: 'begin_rental_booking',
  SUBMIT_RENTAL_BOOKING: 'submit_rental_booking',
  LOGIN: 'login',
  SIGNUP: 'signup',
  GOOGLE_LOGIN: 'google_login',
  VIEW_PROMO: 'view_promo',
  APPLY_PROMO: 'apply_promo',
} as const;
