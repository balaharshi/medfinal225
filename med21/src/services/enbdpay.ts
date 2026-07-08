import { api } from '../lib/api';

type EnbdpayCustomer = {
  fullName: string;
  email?: string;
  phone?: string;
  address?: string;
};

type CreateEnbdpayCheckoutInput = {
  amount: number;
  description: string;
  source: 'booking' | 'cart';
  category?: string;
  bookingId?: string;
  customer: EnbdpayCustomer;
};

export async function createEnbdpayCheckout(input: CreateEnbdpayCheckoutInput) {
  const data = await api.post<{ success?: boolean; checkout?: { redirectUri: string; appUtr: string; orderId: string; transactionUtr?: string; bookingId?: string; responseStatus: string; mock?: boolean }; error?: string }>('/api/payments/enbd/create', { body: input });
  if (!data?.success || !data?.checkout?.redirectUri) {
    throw new Error(data?.error || 'Payment checkout could not be created.');
  }

  return data.checkout;
}

export async function checkEnbdpayStatus(input: { appUtr?: string; transactionUtr?: string; responseStatus?: string; bookingId?: string }) {
  const params = new URLSearchParams();
  if (input.transactionUtr) params.set('transactionUtr', input.transactionUtr);
  if (input.appUtr && !input.transactionUtr) params.set('appUtr', input.appUtr);
  if (input.responseStatus) params.set('responseStatus', input.responseStatus);
  if (input.bookingId) params.set('bookingId', input.bookingId);

  const data = await api.get<{ success?: boolean; status?: { responseStatus?: string; status?: string; appUtr?: string; transactionUtr?: string; booking?: { id: string; paymentStatus?: string; paymentResponseStatus?: string } | null }; error?: string }>(`/api/payments/enbd/status?${params.toString()}`);
  if (!data?.success) {
    throw new Error(data?.error || 'Payment status could not be checked.');
  }

  return data.status!;
}
