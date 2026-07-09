import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = 'G-8W5X7EH91F';

let initialized = false;

export function initGA() {
  if (initialized) return;
  ReactGA.initialize(GA_MEASUREMENT_ID);
  initialized = true;
}

export function trackPageView(path: string, title?: string) {
  if (!initialized) initGA();
  ReactGA.send({ hitType: 'pageview', page: path, title });
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (!initialized) initGA();
  ReactGA.event(name, params);
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
