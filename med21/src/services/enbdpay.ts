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
  const response = await fetch('/api/payments/enbd/create', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success || !data?.checkout?.redirectUri) {
    throw new Error(data?.error || 'Payment checkout could not be created.');
  }

  return data.checkout as {
    redirectUri: string;
    appUtr: string;
    orderId: string;
    transactionUtr?: string;
    bookingId?: string;
    responseStatus: string;
    mock?: boolean;
  };
}

export async function checkEnbdpayStatus(input: { appUtr?: string; transactionUtr?: string }) {
  const params = new URLSearchParams();
  if (input.transactionUtr) params.set('transactionUtr', input.transactionUtr);
  if (input.appUtr && !input.transactionUtr) params.set('appUtr', input.appUtr);

  const response = await fetch(`/api/payments/enbd/status?${params.toString()}`, {
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || 'Payment status could not be checked.');
  }

  return data.status as {
    responseStatus?: string;
    status?: string;
    appUtr?: string;
    transactionUtr?: string;
    booking?: {
      id: string;
      paymentStatus?: string;
      paymentResponseStatus?: string;
    } | null;
  };
}
