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
  subcategory?: string;
  rating?: number;
  brand?: string;
  inStock?: boolean;
  description?: string;
  attributes?: any[];
  vendorPrices?: any[];
}

export interface CartItem {
  product: Product | HealthcareService;
  quantity: number;
}

export interface HealthcareService {
  id: string;
  title: string;
  slug?: string;
  category: string;
  subcategory?: string;
  status?: 'draft' | 'active' | 'inactive';
  active?: boolean;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  currency?: string;
  homeVisitFeeIncluded?: boolean;
  duration: string;
  estimatedVisitTime?: string;
  image: string;
  shortDescription?: string;
  fullDescription?: string;
  description: string;
  inclusions?: string[];
  preparationInstructions?: string;
  whoIsItFor?: string;
  serviceLocation?: string;
  availability?: string;
  tags?: string[];
  displayPriority?: number;
  seoTitle?: string;
  seoDescription?: string;
  popular: boolean;
  enquiryOnly?: boolean;
  who?: string;
  prep?: string;
  result?: string;
  bookingNotice?: string;
  remarks?: string;
  attributes?: any[];
  vendorPrices?: Array<{
    vendorName: string;
    price: number;
  }>;
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
  | 'privacy'
  | 'terms'
  | 'admin'
  | 'vendor'
  | 'search-results';
