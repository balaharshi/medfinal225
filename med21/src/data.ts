/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceCategory, Product, HealthcareService } from './types';
import { HOME_HEALTHCARE_CATEGORIES, HOME_HEALTHCARE_SERVICES } from '../../shared/homeHealthcareCatalog.js';
import { LAB_TESTS_AT_HOME_SERVICES } from '../../shared/labTestsAtHomeCatalog.js';
import customizeLabItemsRaw from './data/customize_lab_items.txt?raw';

const mergeById = <T extends { id: string }>(base: T[], overrides: T[]) => {
  const merged = new Map<string, T>();
  base.forEach((item) => merged.set(item.id, item));
  overrides.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
};

const LAB_TEST_IMAGE = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400';
const labTestsAtHomeImages = import.meta.glob('./assets/images/lab-tests-at-home/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const homeHealthcareImages = import.meta.glob('./assets/images/home_healthcare/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const rentalEquipmentImages = import.meta.glob('./assets/images/rentalimg/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const buyMedicalEquipmentImages = import.meta.glob('./assets/images/buyrentalimg/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const DEFAULT_HEALTHCARE_SERVICE_IMAGE =
  homeHealthcareImages['./assets/images/home_healthcare/Generic Nurse Visit.jpg'] ||
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400';

const homeHealthcareImageAliases: Record<string, string> = {
  'GUT CLEANSE & ACNE CURE IV THERAPY': 'Gut support IV Therapy',
  'GUT CLEANSE AND ACNE CURE IV THERAPY': 'Gut support IV Therapy',
  'MEMORY BOOST AND FOCUS IV THERAPY': 'Memory Boost IV Therapy',
  'MEMORY BOOST IV THERAPY': 'Memory Boost IV Therapy',
  'SPEECH AND LANGUAGE THERAPY': 'Adult Speech Rehabilitation',
  'SURGERY RECOVERY IV THERAPY': 'IV antibiotics at home (with Dr Prescription)',
};

const LAB_TESTS_AT_HOME_SERVICES_WITH_LOCAL_IMAGES = (LAB_TESTS_AT_HOME_SERVICES as HealthcareService[]).map((service) => ({
  ...service,
  image: labTestsAtHomeImages[`./assets/images/lab-tests-at-home/${service.id}.jpg`] || service.image,
}));

const getHomeHealthcareImageKey = (title: string) => {
  const normalizedTitle = title.replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim().toUpperCase();
  if (normalizedTitle === 'WOUND CARE AND SURGICAL DRESSING - SMALL') return 'Wound Care and Surgical Dressing-Small';
  if (normalizedTitle === 'WOUND CARE AND SURGICAL DRESSING - MEDIUM') return 'Wound Care and Surgical Dressing-Medium';
  if (normalizedTitle === 'WOUND CARE AND SURGICAL DRESSING - LARGE') return 'Wound Care and Surgical Dressing-Large';
  if (normalizedTitle === 'CATHETERISATION AT HOME (FEMALE)') return 'Catheterisation at home (Female)';
  if (normalizedTitle === 'IV ANTIBIOTICS AT HOME (WITH DR PRESCRIPTION)') return 'IV antibiotics at home (with Dr Prescription)';
  if (normalizedTitle.startsWith('PHYSIOTHERAPY')) return 'Physiotherapy';
  if (normalizedTitle === 'MULTI VITAMIN DRIP') return 'Vitamin Mix IV Therapy';
  if (normalizedTitle === 'HYDRATION AND ENERGY IV DRIP') return 'Energy Booster IV Therapy';
  if (normalizedTitle === 'SNOW WHITE GLUTA WHITENING DRIP') return 'Skin Glow IV Therapy';
  if (normalizedTitle === 'COLLAGEN, VITAMIN C AND ELECTROLYTES') return 'Skin Glow IV Therapy';
  if (normalizedTitle === 'NAD+ (FUSION APOTHICARY)') return 'Antiaging with NAD 500mg IV Therapy';
  if (normalizedTitle === 'WEIGHT LOSS DRIP') return 'Gut support IV Therapy';
  if (normalizedTitle === 'SKIN GLOW DRIP') return 'Skin Glow IV Therapy';
  if (normalizedTitle === 'HANGOVER DRIP') return 'Hangover IV Therapy';
  if (normalizedTitle === 'ANTISTRESS DRIP') return 'Antistress and Antioxidant IV Therapy';
  if (normalizedTitle.startsWith('DHA') && normalizedTitle.includes('NURSE')) return 'DHA Nurse';
  if (normalizedTitle.startsWith('CARE GIVER')) return 'Caregiver';
  if (homeHealthcareImageAliases[normalizedTitle]) return homeHealthcareImageAliases[normalizedTitle];
  if (normalizedTitle.includes('SKIN GLOW')) return 'Skin Glow IV Therapy';
  if (normalizedTitle.includes('HAIR') && normalizedTitle.includes('SKIN')) return 'Skin and Hair wellness IV Drip';
  if (normalizedTitle.includes('HAIR LOSS')) return 'Hair Loss IV Therapy';
  if (normalizedTitle.includes('ENERGY') || normalizedTitle.includes('WEIGHT LOSS')) return 'Energy Booster IV Therapy';
  if (normalizedTitle.includes('IMMUNE') || normalizedTitle.includes('HYDRATION')) return 'Immune Booster IV Therapy';
  if (normalizedTitle.includes('ANTISTRESS') || normalizedTitle.includes('RELAX')) return 'Antistress and Antioxidant IV Therapy';
  if (normalizedTitle.includes('HANGOVER')) return 'Hangover IV Therapy';
  if (normalizedTitle.includes('LIVER DETOX')) return 'Liver Detox IV Therapy';
  if (normalizedTitle.includes('FEMALE') || normalizedTitle.includes('WOMEN') || normalizedTitle.includes('FERTILITY')) return 'Female Balance IV Therapy';
  if (normalizedTitle.includes('IRON')) return 'Iron Boost IV Therapy';
  if (normalizedTitle.includes('VITAMIN MIX')) return 'Vitamin Mix IV Therapy';
  if (normalizedTitle.includes('NAD 100')) return 'Antiaging with NAD 100mg IV Therapy';
  if (normalizedTitle.includes('NAD 250')) return 'Antiaging with NAD 250mg IV Therapy';
  if (normalizedTitle.includes('NAD 500') || normalizedTitle.includes('WITH NAD')) return 'Antiaging with NAD 500mg IV Therapy';
  return title;
};

export const resolveHealthcareServiceImage = (service: HealthcareService): HealthcareService => {
  if (service.category === 'lab-tests' || service.category === 'lab-tests-at-home') {
    const labImage = labTestsAtHomeImages[`./assets/images/lab-tests-at-home/${service.id}.jpg`];
    return labImage ? { ...service, image: labImage } : service;
  }

  const imageKey = getHomeHealthcareImageKey(service.title);
  const localImage = homeHealthcareImages[`./assets/images/home_healthcare/${imageKey}.jpg`];

  return localImage ? { ...service, image: localImage } : { ...service, image: service.image || DEFAULT_HEALTHCARE_SERVICE_IMAGE };
};

const withHomeHealthcareImages = (services: HealthcareService[]) =>
  services.map(resolveHealthcareServiceImage);

const rentalEquipmentImageNames: Record<string, string> = {
  'BIPAP Machine': 'bipap machine',
  'Patient Hoist': 'hospital patient hoist',
  'Patient Monitor 5 Parameter with trolley and accessories': 'Patient Monitor 5 Parameter with',
  'Suction Machine': 'suction machine',
};

const withRentalEquipmentImages = (products: Product[]) =>
  products.map((product) => {
    if (product.subcategory !== 'rent-medical-equipments') return product;
    const imageName = rentalEquipmentImageNames[product.name] || product.name;
    const localImage = rentalEquipmentImages[`./assets/images/rentalimg/${imageName}.jpg`];
    return localImage ? { ...product, image: localImage } : product;
  });

const buyMedicalEquipmentImageNames: Record<string, string> = {
  'Back Support Belt': 'back support belt',
};

const withBuyMedicalEquipmentImages = (products: Product[]) =>
  products.map((product) => {
    if (product.subcategory !== 'buy-medical-equipments') return product;
    const imageName = buyMedicalEquipmentImageNames[product.name] || product.name;
    const localImage = buyMedicalEquipmentImages[`./assets/images/buyrentalimg/${imageName}.jpg`];
    return localImage ? { ...product, image: localImage } : product;
  });

const normalizeLabId = (code: string) => `srv-custom-lab-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const parseCustomizeLabItems = (raw: string): HealthcareService[] =>
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code = '', title = '', priceText = ''] = line.split('|').map((part) => part.trim());
      const price = Number((priceText.match(/\d+(?:\.\d+)?/) || ['0'])[0]);
      return {
        id: normalizeLabId(code),
        title: title.replace(/\s+/g, ' ').trim(),
        category: 'lab-tests',
        subcategory: 'customize-lab-package',
        price,
        duration: '12 hours prior booking',
        image: LAB_TEST_IMAGE,
        description: `${code} | Available in Dubai and SHJ only.`,
        popular: false,
        bookingNotice: '12 hours prior booking slots',
        remarks: 'Dubai and SHJ only',
        attributes: [
          { label: 'Test Code', value: code },
          { label: 'Coverage', value: 'Dubai and SHJ only' },
        ],
      };
    });

const BASE_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-home-health',
    title: 'Nursing Care at Home',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    slug: 'home-healthcare',
    description: 'Nurses providing premium in-home clinical care, wound antiseptic dressing, and support.'
  },
  {
    id: 'cat-physio',
    title: 'Physiotherapy at Home',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
    slug: 'physiotherapy',
    description: 'Post-injury physical therapy, joint mobility restoration, and tailored skeletal recovery sessions.'
  },
  {
    id: 'cat-doctor-on-call',
    title: 'Doctor on Call',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    slug: 'doctor-on-call',
    description: '24/7 in-home primary physician consultations, checks, and on-call hotel dispatches in Dubai.'
  },
  {
    id: 'cat-speech',
    title: 'Speech and Language Therapy',
    image: '/speech.png',
    slug: 'speech-therapy',
    description: 'Interactive and professional diagnostic testing for children and adult communicational speech issues.'
  },
  {
    id: 'cat-occupational',
    title: 'Occupational Therapy',
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=400',
    slug: 'occupational-therapy',
    description: 'Functional diagnostic profiles helping to promote independent motor skills and daily work activities.'
  },
  {
    id: 'cat-iv-therapy',
    title: 'IV Therapy',
    image: 'https://images.unsplash.com/photo-1513224502586-d1e602410265?auto=format&fit=crop&q=80&w=400',
    slug: 'iv-therapy',
    description: 'Nurse-administered intravenous nutrient drips, energy infusions, and premium age reversal NAD+.'
  },
  {
    id: 'cat-devices',
    title: 'Medical Devices for Rent',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400',
    slug: 'devices-for-rent',
    description: 'Certified oxygen units, wheelchairs, electronic hospital beds, and clinical mobility lifts on weekly / Monthly.'
  }
];

const BASE_PRODUCTS: Product[] = [
  {
    id: 'rent-electric-bed-3-function',
    name: 'Electric Bed 3 Function',
    subtitle: 'MRP per week AED 480 | MRP per month AED 1344 | Security deposit AED 2500',
    price: 480,
    originalPrice: 1344,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 480' },
      { label: 'MRP per month', value: 'AED 1344' },
      { label: 'Security deposit', value: 'AED 2500' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-electric-bed-5-function',
    name: 'Electric Bed 5 Function',
    subtitle: 'MRP per week AED 660 | MRP per month AED 1848 | Security deposit AED 3000',
    price: 660,
    originalPrice: 1848,
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 660' },
      { label: 'MRP per month', value: 'AED 1848' },
      { label: 'Security deposit', value: 'AED 3000' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-oxygen-cylinder-set-48cft',
    name: 'Oxygen Cylinder Set 48cft',
    subtitle: 'Includes regulator and trolley | Weekly AED 120 | Monthly AED 336 | Deposit AED 900',
    price: 120,
    originalPrice: 336,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 120' },
      { label: 'MRP per month', value: 'AED 336' },
      { label: 'Security deposit', value: 'AED 900' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-oxygen-concentrator-5ltr',
    name: 'Oxygen Concentrator 5 ltr',
    subtitle: 'MRP per week AED 300 | MRP per month AED 840 | Security deposit AED 2000',
    price: 300,
    originalPrice: 840,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 300' },
      { label: 'MRP per month', value: 'AED 840' },
      { label: 'Security deposit', value: 'AED 2000' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-patient-monitor-5-parameter',
    name: 'Patient Monitor 5 Parameter with trolley and accessories',
    subtitle: 'MRP per week AED 360 | MRP per month AED 1008 | Security deposit AED 1500',
    price: 360,
    originalPrice: 1008,
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 360' },
      { label: 'MRP per month', value: 'AED 1008' },
      { label: 'Security deposit', value: 'AED 1500' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-bipap-machine',
    name: 'BIPAP Machine',
    subtitle: 'MRP per week AED 960 | MRP per month AED 2688 | Security deposit AED 3000',
    price: 960,
    originalPrice: 2688,
    image: 'https://images.unsplash.com/photo-1581093458791-9d09f031b3f3?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 960' },
      { label: 'MRP per month', value: 'AED 2688' },
      { label: 'Security deposit', value: 'AED 3000' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-cpap-machine',
    name: 'CPAP Machine',
    subtitle: 'MRP per week AED 780 | MRP per month AED 2184 | Security deposit AED 2500',
    price: 780,
    originalPrice: 2184,
    image: 'https://images.unsplash.com/photo-1581093458791-9d09f031b3f3?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 780' },
      { label: 'MRP per month', value: 'AED 2184' },
      { label: 'Security deposit', value: 'AED 2500' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-suction-machine',
    name: 'Suction Machine',
    subtitle: 'MRP per week AED 120 | MRP per month AED 336 | Security deposit AED 500',
    price: 120,
    originalPrice: 336,
    image: 'https://images.unsplash.com/photo-1581093458791-9d09f031b3f3?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 120' },
      { label: 'MRP per month', value: 'AED 336' },
      { label: 'Security deposit', value: 'AED 500' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-infusion-pump',
    name: 'Infusion Pump',
    subtitle: 'MRP per week AED 180 | MRP per month AED 504 | Security deposit AED 1800',
    price: 180,
    originalPrice: 504,
    image: 'https://images.unsplash.com/photo-1581093458791-9d09f031b3f3?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 180' },
      { label: 'MRP per month', value: 'AED 504' },
      { label: 'Security deposit', value: 'AED 1800' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-syringe-pump',
    name: 'Syringe Pump',
    subtitle: 'MRP per week AED 240 | MRP per month AED 672 | Security deposit AED 1800',
    price: 240,
    originalPrice: 672,
    image: 'https://images.unsplash.com/photo-1581093458791-9d09f031b3f3?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 240' },
      { label: 'MRP per month', value: 'AED 672' },
      { label: 'Security deposit', value: 'AED 1800' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-patient-hoist',
    name: 'Patient Hoist',
    subtitle: 'MRP per week AED 420 | MRP per month AED 1176 | Security deposit AED 3000',
    price: 420,
    originalPrice: 1176,
    image: 'https://images.unsplash.com/photo-1581093458791-9d09f031b3f3?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 420' },
      { label: 'MRP per month', value: 'AED 1176' },
      { label: 'Security deposit', value: 'AED 3000' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'rent-wheel-chair',
    name: 'Wheel Chair',
    subtitle: 'MRP per week AED 90 | MRP per month AED 252 | Security deposit AED 250',
    price: 90,
    originalPrice: 252,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    subcategory: 'rent-medical-equipments',
    brand: 'Rental Equipment',
    rating: 4.8,
    inStock: true,
    description: 'All services provided in UAE except AUH. 12 hours prior booking required.',
    attributes: [
      { label: 'MRP per week', value: 'AED 90' },
      { label: 'MRP per month', value: 'AED 252' },
      { label: 'Security deposit', value: 'AED 250' },
      { label: 'Booking notice', value: '12 hours prior booking' },
    ],
  },
  {
    id: 'prod-omron-bp',
    name: 'Omron BP Monitor',
    subtitle: 'HEM-7120 Electronic Upper Arm Blood Pressure Monitor',
    price: 139,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'Omron',
    rating: 4.8,
    inStock: true
  },
  {
    id: 'prod-pulse-ox',
    name: 'Pulse Oximeter',
    subtitle: 'Finger Pulse Blood Oxygen Saturation (SpO2) Monitor',
    price: 59,
    originalPrice: 99,
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'MedTech',
    rating: 4.7,
    inStock: true
  },
  {
    id: 'prod-neb',
    name: 'Nebulizer',
    subtitle: 'Compressor Medical Aerosol Steam Inhaler System',
    price: 149,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'Nebulyfe',
    rating: 4.9,
    inStock: true
  },
  {
    id: 'prod-therm',
    name: 'Digital Thermometer',
    subtitle: 'Highly Accurate Professional Electronic Fever Thermometer',
    price: 49,
    originalPrice: 79,
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'Omron',
    rating: 4.6,
    inStock: true
  },
  {
    id: 'prod-gluco',
    name: 'Glucometer',
    subtitle: 'Blood Sugar Monitor Kit with 25 Sterile Test Strips',
    price: 89,
    originalPrice: 129,
    image: 'https://images.unsplash.com/photo-1628115502411-ca48001146c5?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'AccuCheck',
    rating: 4.8,
    inStock: true
  },
  {
    id: 'prod-back-belt',
    name: 'Back Support Belt',
    subtitle: 'Adjustable Posture Corrector and Lumbar Relief Belt',
    price: 89,
    originalPrice: 129,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'FlexiBack',
    rating: 4.5,
    inStock: true
  },
  {
    id: 'prod-knee-supp',
    name: 'Knee Support',
    subtitle: 'Adjustable Neoprene Double Compression Patella Stabilizer Brace',
    price: 69,
    originalPrice: 99,
    image: 'https://images.unsplash.com/photo-1576091159399-a37f8d40a8ed?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'JointCare',
    rating: 4.7,
    inStock: true
  },
  {
    id: 'prod-whey',
    name: 'Whey Protein',
    subtitle: 'Chocolate flavor Premium Isolate Protein Supplement (1kg)',
    price: 149,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=400',
    category: 'supplements',
    subcategory: 'supplements',
    brand: 'Optimum Gold',
    rating: 4.9,
    inStock: true
  }
];

export const PRODUCTS: Product[] = withBuyMedicalEquipmentImages(withRentalEquipmentImages(BASE_PRODUCTS));

const BASE_HEALTHCARE_SERVICES: HealthcareService[] = [
  {
    id: "srv-generic-nurse",
    title: "Generic Nurse Visit",
    category: "home-healthcare",
    price: 250,
    duration: "1 Hour (Min 3 hrs)",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Expert nursing support brought to you — routine care, recovery assistance, and health monitoring, all in one visit.",
    popular: true,
    bookingNotice: "12 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 200
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 300
      }
    ]
  },
  {
    id: "srv-wound-small",
    title: "Wound Care and Surgical Dressing - Small",
    category: "home-healthcare",
    price: 500,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Precise, hygienic care for minor wounds and small surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.",
    popular: false,
    bookingNotice: "12 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 300
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 400
      }
    ]
  },
  {
    id: "srv-wound-medium",
    title: "Wound Care and Surgical Dressing - Medium",
    category: "home-healthcare",
    price: 650,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Precise, hygienic care for minor wounds and medium surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.",
    popular: false,
    bookingNotice: "12 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 500
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 500
      }
    ]
  },
  {
    id: "srv-wound-large",
    title: "Wound Care and Surgical Dressing - Large",
    category: "home-healthcare",
    price: 1000,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Precise, hygienic care for minor wounds and large surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.",
    popular: false,
    bookingNotice: "12 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 750
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 700
      }
    ]
  },
  {
    id: "srv-catheterisation-female",
    title: "Catheterisation at Home",
    category: "home-healthcare",
    price: 850,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Safe, sterile catheter insertion and care delivered in the comfort of your home — performed by a trained clinical nurse with full privacy, dignity, and clinical precision.",
    popular: false,
    bookingNotice: "12 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 650
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 500
      }
    ]
  },
  {
    id: "srv-iv-antibiotics-prescription",
    title: "IV Antibiotics at Home (With Dr Prescription)",
    category: "home-healthcare",
    price: 750,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1513224502586-d1e602410265?auto=format&fit=crop&q=80&w=400",
    description: "Complete your antibiotic course from the comfort of home — a qualified nurse administers your prescribed IV treatment safely and efficiently, so you recover without the hospital stay.",
    popular: false,
    bookingNotice: "12 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 500
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 500
      }
    ]
  },
  {
    id: "srv-longterm-dha-rn-live-in-30-days",
    title: "DHA Registered Nurse - 24 Hours Live In - 30 Days - 1 Staff",
    category: "long-term-care",
    price: 25000,
    duration: "30 Days - 1 Staff",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 18000
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 19500
      }
    ]
  },
  {
    id: "srv-longterm-dha-ventillator-trach-peg-24-hours-30-days",
    title: "DHA Registered Nurse to Manage Ventilator / Trach & PEG - 24 Hours - 30 Days - 1 Staff",
    category: "long-term-care",
    price: 28000,
    duration: "30 Days - 1 Staff",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing patients on ventilator support, tracheostomy, or PEG feeding.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 28000
      }
    ]
  },
  {
    id: "srv-longterm-dha-nurse-1-plus-1-live-in-30-days",
    title: "DHA Registered Nurse - 24 Hours Live In - 30 Days - 2 Staff (1+1) - 12 Hours Each per Shift",
    category: "long-term-care",
    price: 30000,
    duration: "30 Days - 2 Staff (1+1) - 12 Hours Each per Shift",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 23000
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 25500
      }
    ]
  },
  {
    id: "srv-longterm-dha-nurse-12-hours-30-days",
    title: "DHA Registered Nurse - 12 Hours - 30 Days - 1 Staff",
    category: "long-term-care",
    price: 15000,
    duration: "30 Days - 1 Staff",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 13000
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 12000
      }
    ]
  },
  {
    id: "srv-longterm-dha-nurse-8-hours-30-days",
    title: "DHA Registered Nurse - 8 Hours - 30 Days - 1 Staff",
    category: "long-term-care",
    price: 10000,
    duration: "30 Days - 1 Staff",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 9000
      }
    ]
  },
  {
    id: "srv-longterm-dha-nurse-less-than-12-hours-30-days",
    title: "DHA Registered Nurse - Less Than 12 Hours / Day - 30 Days - 1 Staff",
    category: "long-term-care",
    price: 13000,
    duration: "30 Days - 1 Staff",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 11000
      }
    ]
  },
  {
    id: "srv-longterm-dha-nurse-rn-an-live-in-per-day",
    title: "DHA Registered Nurse - 24 Hours Live In - 1 Day - 1 Staff",
    category: "long-term-care",
    price: 1500,
    duration: "1 Day - 1 Staff",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 800
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 1300
      }
    ]
  },
  {
    id: "srv-longterm-dha-nurse-24-hours-per-day-1-plus-1",
    title: "DHA Registered Nurse - 24 Hours Live In - 1 Day - 2 Staff (1+1) - 12 Hours Each per Shift",
    category: "long-term-care",
    price: 2500,
    duration: "1 Day - 2 Staff (1+1) - 12 Hours Each per Shift",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 1250
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 1800
      }
    ]
  },
  {
    id: "srv-longterm-dha-nurse-12-hours-per-day",
    title: "DHA Registered Nurse - 12 Hours - 1 Day - 1 Staff",
    category: "long-term-care",
    price: 1000,
    duration: "1 Day - 1 Staff",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 850
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 700
      }
    ]
  },
  {
    id: "srv-longterm-dha-nurse-less-than-12-hours-per-day",
    title: "DHA Registered Nurse - Less Than 12 Hours - 1 Day - 1 Staff",
    category: "long-term-care",
    price: 125,
    duration: "1 Day - 1 Staff",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 450
      }
    ],
    remarks: "AED 125/hour"
  },
  {
    id: "srv-longterm-caregiver-live-in-30-days",
    title: "Caregiver - 24 Hours Live In - 30 Days - 1 Staff",
    category: "long-term-care",
    price: 17000,
    duration: "30 Days - 1 Staff",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Continuous, compassionate support from a live-in caregiver - helping with daily activities, mobility, and wellbeing, day and night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 15000
      }
    ]
  },
  {
    id: "srv-longterm-caregiver-24-hours-30-days-1-plus-1",
    title: "Caregiver - 24 Hours Live In - 30 Days - 2 Staff (1+1) - 12 Hours Each per Shift",
    category: "long-term-care",
    price: 25000,
    duration: "30 Days - 2 Staff (1+1) - 12 Hours Each per Shift",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Continuous, compassionate support from a live-in caregiver - helping with daily activities, mobility, and wellbeing, day and night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 20000
      }
    ]
  },
  {
    id: "srv-longterm-caregiver-12-hours-30-days",
    title: "Caregiver - 12 Hours - 30 Days - 1 Staff",
    category: "long-term-care",
    price: 12000,
    duration: "30 Days - 1 Staff",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Continuous, compassionate support from a live-in caregiver - helping with daily activities, mobility, and wellbeing, day and night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 9000
      }
    ]
  },
  {
    id: "srv-longterm-caregiver-less-than-12-hours-30-days",
    title: "Caregiver - Less Than 12 Hours / Day - 30 Days - 1 Staff",
    category: "long-term-care",
    price: 11000,
    duration: "30 Days - 1 Staff",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Continuous, compassionate support from a live-in caregiver - helping with daily activities, mobility, and wellbeing, day and night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 8000
      }
    ]
  },
  {
    id: "srv-longterm-caregiver-live-in-per-day",
    title: "Caregiver - 24 Hours Live In - 1 Day - 1 Staff",
    category: "long-term-care",
    price: 850,
    duration: "1 Day - 1 Staff",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Continuous, compassionate support from a live-in caregiver - helping with daily activities, mobility, and wellbeing, day and night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 650
      }
    ]
  },
  {
    id: "srv-longterm-caregiver-24-hours-per-day-1-plus-1",
    title: "Caregiver - 24 Hours Live In - 1 Day - 2 Staff (1+1) - 12 Hours Each per Shift",
    category: "long-term-care",
    price: 1050,
    duration: "1 Day - 2 Staff (1+1) - 12 Hours Each per Shift",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Continuous, compassionate support from a live-in caregiver - helping with daily activities, mobility, and wellbeing, day and night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 800
      }
    ]
  },
  {
    id: "srv-longterm-caregiver-12-hours-per-day",
    title: "Caregiver - 12 Hours - 1 Day - 1 Staff",
    category: "long-term-care",
    price: 700,
    duration: "1 Day - 1 Staff",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Continuous, compassionate support from a live-in caregiver - helping with daily activities, mobility, and wellbeing, day and night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 500
      }
    ]
  },
  {
    id: "srv-longterm-caregiver-less-than-12-hours-per-day",
    title: "Caregiver - Less Than 12 Hours - 1 Day - 1 Staff",
    category: "long-term-care",
    price: 650,
    duration: "1 Day - 1 Staff",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Continuous, compassionate support from a live-in caregiver - helping with daily activities, mobility, and wellbeing, day and night.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 450
      }
    ]
  },
  {
    id: "srv-physiotherapy",
    title: "Physiotherapy - 1 Hour Session",
    category: "physiotherapy",
    price: 400,
    duration: "1 Hour",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400",
    description: "A dedicated hour with a certified physiotherapist to assess, treat, and rehabilitate — helping you move better, recover faster, and live more comfortably.",
    popular: true,
    bookingNotice: "12 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 300
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 300
      }
    ]
  },
  {
    id: "srv-physiotherapy-week-6",
    title: "Physiotherapy - 1 Hour Session / Week - 6 Sessions",
    category: "physiotherapy",
    price: 2000,
    duration: "6 Sessions",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400",
    description: "A dedicated hour with a certified physiotherapist to assess, treat, and rehabilitate — helping you move better, recover faster, and live more comfortably.",
    popular: false,
    bookingNotice: "12 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 1500
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 1620
      }
    ]
  },
  {
    id: "srv-dr-home",
    title: "Doctor at Home",
    category: "doctor-on-call",
    price: 500,
    duration: "30 Min Session",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    description: "A qualified doctor visits you for consultations, diagnosis, and treatment — no waiting rooms, no commute.",
    popular: true,
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 400
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 250
      }
    ]
  },
  {
    id: "srv-dr-hotel",
    title: "Doctor at Hotel",
    category: "doctor-on-call",
    price: 1000,
    duration: "30 Min Session",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
    description: "A qualified doctor brought to your hotel — expert diagnosis and treatment, right where you are in the city.",
    popular: false,
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Olives Al Noor Home Healthcare LLC",
        price: 800
      },
      {
        vendorName: "Doctor Plus Home Healthcare",
        price: 250
      }
    ]
  },
  {
    id: "srv-speech-therapy-hour",
    title: "Speech and Language Therapy",
    category: "speech-therapy",
    price: 400,
    duration: "1 Hour Session",
    image: "/speech.png",
    description: "Structured sessions addressing speech delays, articulation challenges, and swallowing difficulties — delivered by a qualified speech and language specialist.",
    popular: true,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Ephatha",
        price: 300
      }
    ]
  },
  {
    id: "srv-occupational-therapy-hour",
    title: "Occupational Therapy",
    category: "occupational-therapy",
    price: 400,
    duration: "1 Hour Session",
    image: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=400",
    description: "Practical, goal-driven sessions helping you regain independence in daily tasks — from fine motor skills and cognitive function to adaptive techniques for work, home, and life.",
    popular: true,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
      {
        vendorName: "Ephatha",
        price: 300
      }
    ]
  },
  {
    id: "srv-iv-skin-glow",
    title: "Skin Glow IV Therapy",
    category: "iv-therapy",
    price: 850,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1513224502586-d1e602410265?auto=format&fit=crop&q=80&w=400",
    description: "This powerful blend of antioxidants and vitamins promotes a radiant complexion by reducing oxidative stress and improving skin health.",
    popular: true,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Alpha Lipoic Acid\nZinc Sulphate\nSelenium\nVitamin C",
      clinical_benefits: "● Brightens skin and improves tone\n● Reduces signs of aging and oxidative stress\n● Promotes collagen synthesis and skin elasticity",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-hair-skin-nail-care",
    title: "Hair, Skin & Nail Care IV Therapy",
    category: "iv-therapy",
    price: 850,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=400",
    description: "For those looking to improve the appearance and health of their hair, nails and skin, this drip delivers essential nutrients to promote regeneration and hydration.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nBiotin\nZinc Sulphate\nMagnesium Chloride",
      clinical_benefits: "● Promotes healthy hair growth and nail strength\n● Enhances skin hydration and elasticity\n● Reduces inflammation and supports skin healing",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-energy-weight-loss",
    title: "Energy & Weight Loss IV Therapy",
    category: "iv-therapy",
    price: 900,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "Supports your metabolism and energy levels with its potent blend of vitamins, minerals and amino acids. Ideal for patients dealing with fatigue, weight management issues or those seeking enhanced athletic performance.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin B1\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
      clinical_benefits: "● Boosts energy and endurance\n● Enhances fat metabolism\n● Reduces exercise-related fatigue and muscle cramps",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-immune-hydration-drip",
    title: "Immune & Hydration Drip",
    category: "iv-therapy",
    price: 799,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1629904858656-aa8c3b3f39ca?auto=format&fit=crop&q=80&w=400",
    description: "Strengthen your immune defenses and ensure optimal hydration with this drip, formulated to help fight infections and promote recovery from illness.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin C\nZinc Sulphate\nMagnesium Chloride\nN-Acetylcysteine (NAC)\nSelenium",
      clinical_benefits: "● Supports immune system function\n● Enhances hydration and recovery\n● Reduces oxidative stress and inflammation",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-antistress-relax",
    title: "Antistress / Relax IV Therapy",
    category: "iv-therapy",
    price: 898.8,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=400",
    description: "Reduces mental fatigue and sharpens focus while promoting relaxation and reducing stress.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin B1\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
      clinical_benefits: "● Supports neurotransmitter function for sharper focus\n● Promotes better concentration and focus\n● Promotes relaxation and reduces stress\n● Magnesium and B vitamins help soothe the nervous system, leading to a more relaxed state of mind",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-gut-cleanse-acne-cure",
    title: "Gut Cleanse & Acne Cure IV Therapy",
    category: "iv-therapy",
    price: 899,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400",
    description: "This IV drip is designed to improve skin health and reduce acne through a blend of vitamins, minerals and antioxidants that support both skin and gut health.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin B Complex (B1, B5, B6, B12)\nMagnesium Chloride\nZinc Sulphate\nN-Acetylcysteine (NAC)\nL-Glutamine\nAlpha Lipoic Acid (ALA)\nAscorbic Acid (Vitamin C)",
      clinical_benefits: "● Sebum Regulation: Vitamins and zinc decrease oil production\n● Anti Inflammatory Effects: Magnesium, NAC, ALA and Vitamin C minimizes inflammation\n● Anti Oxidant Support: NAC, ALA and Vitamin C combat oxidative stress\n● Gut Health Improvement: L-Glutamine enhances gut health, reducing systemic inflammation",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-surgery-recovery",
    title: "Surgery Recovery IV Therapy",
    category: "iv-therapy",
    price: 898.8,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "This drip is specifically designed to support recovery following surgery by providing essential vitamins and amino acids that enhance healing, reduce inflammation and boost overall recovery.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nNiacinamide\nVitamin B2\nMagnesium Chloride\nZinc Sulphate\nIron III Hydroxide Sucrose\nL-Glutamine\nFolic Acid\nAscorbic Acid",
      clinical_benefits: "● Enhances Healing: Vitamins and amino acids promote tissue repair and recovery\n● Reduced Inflammation: Ingredients like Niacinamide and Vitamin C help mitigate inflammation\n● Support for immune function: Zinc and Vitamin B6 boost immune response\n● Energy production: B vitamins facilitate energy metabolism to support recovery",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-women-health-fertilty",
    title: "Women's Health / Fertility IV Therapy",
    category: "iv-therapy",
    price: 898.8,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=400",
    description: "This drip is designed to support women's fertility and reproductive health by improving egg quality, balancing hormones, reducing oxidative stress, and promoting overall reproductive wellness.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nVitamin B2\nMagnesium Chloride\nZinc Sulphate\nAscorbic Acid\nN-Acetylcysteine\nSelenium",
      clinical_benefits: "● Enhances women's fertility and health by improving egg quality, regulating hormones and reducing oxidative stress\n● Boosts energy and balances hormones\n● Provides antioxidant protection, promoting reproductive wellness",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-men-power-drip",
    title: "Men's Power IV Drip",
    category: "iv-therapy",
    price: 838.8,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400",
    description: "This drip is designed to support men's sexual health and vitality by enhancing energy levels, promoting healthy blood flow, supporting testosterone production, and improving overall performance and wellness.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nMagnesium Chloride\nZinc Sulphate\nL-Glutamine\nL-Arginine\nAscorbic Acid\nTaurine\nSelenium",
      clinical_benefits: "● Supports men's sexual performance by boosting energy, improving blood flow and enhancing overall vitality\n● Stimulates nitric oxide production promoting better circulation and erectile function\n● Zinc Sulphate aids testosterone synthesis",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-liver-detox-after-party",
    title: "Liver Detox Drip / After Party",
    category: "iv-therapy",
    price: 899,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400",
    description: "Promotes liver health and detoxification with this formula, ideal for those exposed to environmental toxins, medications or poor dietary habits.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "Vitamin B1\nVitamin B5\nVitamin B6\nVitamin B12\nCarnitine\nAlpha Lipoic Acid\nZinc Sulphate\nMagnesium Chloride",
      clinical_benefits: "● Supports detoxification and liver function\n● Reduces oxidative stress on the liver\n● Enhances fat metabolism and energy production",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-nad-100",
    title: "Antiaging with NAD 100mg IV Therapy",
    category: "iv-therapy",
    price: 800,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1513224502586-d1e602410265?auto=format&fit=crop&q=80&w=400",
    description: "Perfect for those seeking anti-aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "NAD+ 100mg",
      clinical_benefits: "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-nad-250",
    title: "Antiaging with NAD 250mg IV Therapy",
    category: "iv-therapy",
    price: 1198.8,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1513224502586-d1e602410265?auto=format&fit=crop&q=80&w=400",
    description: "Perfect for those seeking anti-aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.",
    popular: false,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "NAD+ 250mg",
      clinical_benefits: "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
  {
    id: "srv-iv-nad-500",
    title: "Antiaging with NAD 500mg IV Therapy",
    category: "iv-therapy",
    price: 1699,
    duration: "1 Session",
    image: "https://images.unsplash.com/photo-1513224502586-d1e602410265?auto=format&fit=crop&q=80&w=400",
    description: "Perfect for those seeking anti-aging benefits. This NAD+ drip supports cellular regeneration, improves energy levels and promotes overall longevity.",
    popular: true,
    bookingNotice: "24 hours prior booking",
    remarks: "Dubai and Sharjah Only",
    vendorPrices: [
    ],
    attributes: {
      key_ingredients: "NAD+ 500mg",
      clinical_benefits: "● Enhances cellular repair and regeneration\n● Boosts energy and combats fatigue\n● Supports anti-aging and overall vitality",
      disclaimer: "Disclaimer:\n1. IV Therapy is a wellness service and is not intended to diagnose, treat, cure, or prevent any disease.\n2. Treatment suitability is subject to a medical assessment by a qualified healthcare professional.\n3. Results may vary between individuals.\n4. By booking a service, you acknowledge and accept the potential risks and benefits of IV Therapy."
    }
  },
];

const BASE_HEALTHCARE_SERVICES_WITHOUT_LEGACY_HOME = BASE_HEALTHCARE_SERVICES.filter(
  (service) => service.category !== 'home-healthcare' && !(service.category === 'lab-tests' && service.subcategory !== 'customize-lab-package'),
);
const CUSTOMIZE_LAB_SERVICES = parseCustomizeLabItems(customizeLabItemsRaw);

export const SERVICE_CATEGORIES: ServiceCategory[] = mergeById(BASE_SERVICE_CATEGORIES, HOME_HEALTHCARE_CATEGORIES as ServiceCategory[]);
export const HEALTHCARE_SERVICES: HealthcareService[] = withHomeHealthcareImages(
  mergeById(
    mergeById(mergeById(BASE_HEALTHCARE_SERVICES_WITHOUT_LEGACY_HOME, CUSTOMIZE_LAB_SERVICES), LAB_TESTS_AT_HOME_SERVICES_WITH_LOCAL_IMAGES),
    HOME_HEALTHCARE_SERVICES as HealthcareService[],
  ),
);

export const DUBAI_LOCATIONS = [
  'Dubai Marina, Dubai',
  'Downtown Dubai, Dubai',
  'Palm Jumeirah, Dubai',
  'Jumeirah, Dubai',
  'Deira & Al Rigga, Dubai',
  'Business Bay, Dubai',
  'Al Barsha, Dubai',
  'Mirdif, Dubai',
  'JLT (Jumeirah Lake Towers), Dubai'
];
