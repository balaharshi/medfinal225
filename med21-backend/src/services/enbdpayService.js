import crypto from 'crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';
import {
  attachBookingPayment,
  updateBookingPaymentStatus,
} from './catalogService.js';

let cachedToken = null;
let tokenExpiresAt = 0;

const normalizeResponseKey = (key) => String(key || '').replace(/\s+/g, '').toLowerCase();

const readResponseField = (payload, fieldName) => {
  if (!payload || typeof payload !== 'object') return undefined;
  const normalizedField = normalizeResponseKey(fieldName);
  const key = Object.keys(payload).find((candidate) => normalizeResponseKey(candidate) === normalizedField);
  return key ? payload[key] : undefined;
};

const buildTraceId = () => `medziva-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

const buildAppUtr = () => `MDZ${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`.slice(0, 25);

const buildOrderId = () => `MZ${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`.slice(0, 18);

const sanitizeText = (value, fallback, maxLength = 50) =>
  String(value || fallback)
    .replace(/[^A-Za-z0-9 #_,/().&:\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength) || fallback;

const splitName = (fullName = '') => {
  const cleaned = String(fullName || '').trim().replace(/[^a-zA-Z '-]/g, ' ');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return {
    firstName: (parts[0] || 'MedZiva').slice(0, 30),
    lastName: (parts.slice(1).join(' ') || 'Customer').slice(0, 30),
  };
};

const toMinorUnits = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new HttpError(400, 'A valid payment amount is required');
  }
  return String(Math.round(value * 100));
};

const getPaymentBaseUrl = () => env.enbdpay.baseUrl.replace(/\/$/, '');

const requestJson = async (path, { method = 'GET', token, body, extraHeaders = {} } = {}) => {
  const response = await fetch(`${getPaymentBaseUrl()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Trace-Id': buildTraceId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = readResponseField(payload, 'responseMessage') || 'ENBDpay request failed';
    throw new HttpError(424, message, { status: response.status, payload });
  }
  return payload;
};

const getAuthToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  if (!env.enbdpay.username || !env.enbdpay.apiKey) {
    throw new HttpError(400, 'ENBDpay credentials are not configured');
  }

  const payload = await requestJson('/v1/apis/tokens', {
    method: 'POST',
    body: {
      username: env.enbdpay.username,
      apiKey: env.enbdpay.apiKey,
    },
  });

  const responseStatus = readResponseField(payload, 'responseStatus');
  const token = readResponseField(payload, 'token');
  if (responseStatus !== 'SUCCESS' || !token) {
    throw new HttpError(424, readResponseField(payload, 'responseMessage') || 'ENBDpay token generation failed', payload);
  }

  const expiresIn = Number(readResponseField(payload, 'expiresIn') || 240);
  cachedToken = token;
  tokenExpiresAt = Date.now() + Math.max(expiresIn - 30, 30) * 1000;
  return cachedToken;
};

const buildCustomerDetails = (customer = {}) => {
  const { firstName, lastName } = splitName(customer.fullName || customer.name);
  const mobileNumber = String(customer.phone || customer.mobileNumber || '500000000').replace(/\D/g, '').slice(-15) || '500000000';
  const email = String(customer.email || 'guest@medzivahealthcare.com').trim().slice(0, 50);
  const address = sanitizeText(customer.address, 'Dubai', 50);

  return {
    firstName,
    lastName,
    isdCode: '+971',
    mobileNumber,
    email,
    shippingAddress: {
      addressLine1: address,
      addressLine2: 'MedZiva Healthcare',
      city: 'Dubai',
      state: 'Dubai',
      countryCode: 'AE',
      pinCode: '00000',
    },
    billingAddress: {
      addressLine1: address,
      addressLine2: 'MedZiva Healthcare',
      city: 'Dubai',
      state: 'Dubai',
      countryCode: 'AE',
      pinCode: '00000',
    },
  };
};

const getRedirectUrl = () => {
  const baseUrl = env.enbdpay.redirectUrl || `${env.frontendUrl.replace(/\/$/, '')}/payment/return`;
  return baseUrl;
};

const appendReturnParams = (redirectUrl, params = {}) => {
  const url = new URL(redirectUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, String(value));
  });
  return url.toString();
};

export const createCheckoutTransaction = async (payload = {}) => {
  const appUtr = payload.appUtr || buildAppUtr();
  const orderId = payload.orderId || buildOrderId();
  const bookingId = payload.bookingId ? String(payload.bookingId) : '';
  const amount = toMinorUnits(payload.amount);
  const description = sanitizeText(payload.description, 'MedZiva Healthcare Payment', 250);
  const redirectUrl = appendReturnParams(getRedirectUrl(), { appUtr, orderId, bookingId });

  if (env.enbdpay.mock) {
    const mockReturnUrl = new URL(redirectUrl);
    mockReturnUrl.searchParams.set('appUtr', appUtr);
    mockReturnUrl.searchParams.set('orderId', orderId);
    mockReturnUrl.searchParams.set('responseStatus', 'CAPTURED');
    mockReturnUrl.searchParams.set('mock', 'true');
    if (bookingId) {
      mockReturnUrl.searchParams.set('bookingId', bookingId);
      await updateBookingPaymentStatus({
        bookingId,
        appUtr,
        orderId,
        responseStatus: 'CAPTURED',
      });
    }
    return {
      responseStatus: 'CREATED',
      responseMessage: 'Mock ENBDpay checkout created',
      redirectUri: mockReturnUrl.toString(),
      appUtr,
      orderId,
      bookingId,
      amount,
      currency: env.enbdpay.currency,
      mock: true,
    };
  }

  const token = await getAuthToken();
  const requestBody = {
    amount,
    currency: env.enbdpay.currency,
    description,
    transactionType: env.enbdpay.transactionType,
    notes: {
      source: sanitizeText(payload.source, 'MedZiva', 40),
      category: sanitizeText(payload.category, 'Healthcare', 40),
      ...(bookingId ? { bookingId } : {}),
    },
    app: {
      appUtr,
      redirectUrl,
      ...(env.enbdpay.webhookUrl
        ? {
            webhook: env.enbdpay.webhookUrl,
            events: ['AUTHORIZED', 'CANCELLED', 'CAPTURED', 'PROCESSED', 'FAILED', 'REFUNDED'],
          }
        : {}),
    },
    paymentMethod: env.enbdpay.paymentMethod,
    orderId,
    refundConfig: {
      type: 'PARTIAL',
      minAmount: '100',
    },
    customerDetails: buildCustomerDetails(payload.customer),
  };

  const response = await requestJson('/checkout/apis/v2/transactions', {
    method: 'POST',
    token,
    body: requestBody,
  });

  const redirectUri = readResponseField(response, 'redirectUri');
  const responseStatus = readResponseField(response, 'responseStatus');
  const transactionUtr = readResponseField(response, 'transactionUtr');
  if (responseStatus !== 'CREATED' || !redirectUri) {
    throw new HttpError(424, readResponseField(response, 'responseMessage') || 'ENBDpay did not create a checkout link', response);
  }

  const booking = bookingId
    ? await attachBookingPayment(bookingId, {
        paymentStatus: 'Pending',
        paymentProvider: 'ENBDpay',
        paymentAppUtr: appUtr,
        paymentOrderId: orderId,
        paymentTransactionUtr: transactionUtr,
        paymentResponseStatus: responseStatus,
      })
    : null;

  return {
    ...response,
    responseStatus,
    redirectUri,
    transactionUtr,
    appUtr,
    orderId,
    bookingId,
    booking,
  };
};

export const checkCheckoutStatus = async ({ appUtr, transactionUtr }) => {
  if (!appUtr && !transactionUtr) {
    throw new HttpError(400, 'appUtr or transactionUtr is required');
  }
  const token = await getAuthToken();
  const params = new URLSearchParams();
  if (transactionUtr) params.set('transactionUtr', transactionUtr);
  if (appUtr && !transactionUtr) params.set('appUtr', appUtr);
  const status = await requestJson(`/checkout/apis/v2/transactions?${params.toString()}`, { token });
  const booking = await updateBookingPaymentStatus({
    appUtr: readResponseField(status, 'appUtr') || appUtr,
    orderId: readResponseField(status, 'orderId'),
    transactionUtr: readResponseField(status, 'transactionUtr') || transactionUtr,
    responseStatus: readResponseField(status, 'responseStatus') || readResponseField(status, 'status'),
  });

  return {
    ...status,
    booking,
  };
};

const timingSafeCompare = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifyWebhookSignature = (payload, signatureHeader) => {
  const secret = env.enbdpay.webhookSecret;
  if (!secret) {
    logger.warn('ENBDpay webhook secret not configured — skipping signature verification');
    return true;
  }
  if (!signatureHeader) {
    logger.warn('ENBDpay webhook missing signature header');
    return false;
  }

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');

  const receivedSig = String(signatureHeader).trim().toLowerCase();
  const match = timingSafeCompare(expectedSig, receivedSig);

  if (!match) {
    logger.error('ENBDpay webhook signature mismatch');
  }
  return match;
};

export const recordWebhookPaymentStatus = async (payload = {}, headers = {}) => {
  const signature = headers['x-signature'] || headers['x-hmac-sha256'] || headers['authorization'] || '';
  if (!verifyWebhookSignature(payload, signature)) {
    throw new HttpError(401, 'Invalid webhook signature');
  }

  const appUtr = readResponseField(payload, 'appUtr');
  const orderId = readResponseField(payload, 'orderId');
  const transactionUtr = readResponseField(payload, 'transactionUtr');
  const responseStatus = readResponseField(payload, 'responseStatus') || readResponseField(payload, 'status');
  const notes = readResponseField(payload, 'notes');
  const bookingId = notes && typeof notes === 'object' ? readResponseField(notes, 'bookingId') : undefined;

  const booking = await updateBookingPaymentStatus({
    bookingId,
    appUtr,
    orderId,
    transactionUtr,
    responseStatus,
  });

  return { received: true, booking };
};
