/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ServiceCategory {
  id: string;
  title: string;
  image: string;
  slug: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  image: string;
  category: string;
  rating?: number;
  brand?: string;
  inStock?: boolean;
}

export interface CartItem {
  product: Product | HealthcareService;
  quantity: number;
}

export interface HealthcareService {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  price: number;
  duration: string;
  image: string;
  description: string;
  popular: boolean;
  enquiryOnly?: boolean;
  who?: string;
  prep?: string;
  result?: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  timeSlot: string;
  notes?: string;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export type ActiveTab = 
  | 'home' 
  | 'services' 
  | 'lab-tests' 
  | 'products' 
  | 'health-packages' 
  | 'wellness' 
  | 'offers' 
  | 'providers' 
  | 'support'
  | 'admin'
  | 'vendor';
