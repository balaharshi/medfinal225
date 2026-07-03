type CreateBookingInput = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceTitle: string;
  vendorName?: string;
  vendorId?: string | null;
  serviceId?: string | null;
  price: number;
  date: string;
  timeSlot?: string;
  region?: string;
  status?: string;
  paymentStatus?: string;
  notes?: string;
};

export async function createBooking(input: CreateBookingInput) {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.id) {
    throw new Error(data?.error || 'Booking could not be created.');
  }

  return data as CreateBookingInput & {
    id: string;
    paymentStatus?: string;
    paymentAppUtr?: string;
    paymentOrderId?: string;
    paymentTransactionUtr?: string;
  };
}
