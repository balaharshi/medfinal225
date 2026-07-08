import { api } from '../lib/api';

type CreateBookingInput = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceTitle: string;
  vendorName?: string;
  vendorId?: string | null;
  serviceId?: string | null;
  category?: string;
  subcategory?: string;
  price: number;
  date: string;
  timeSlot?: string;
  region?: string;
  status?: string;
  paymentStatus?: string;
  notes?: string;
};

export async function createBooking(input: CreateBookingInput) {
  const data = await api.post<{ id?: string; error?: string } & Record<string, unknown>>('/api/bookings', { body: input });
  if (!data?.id) {
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
