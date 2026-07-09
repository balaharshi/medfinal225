/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Image resolution and utility data for the MedZiva website.
 * All services, products, and categories come from the database API.
 * This file only provides image mappings and utility helpers.
 */

import type { Product, HealthcareService } from './types';

const serviceImages = import.meta.glob('./assets/images/services/*.jpg', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

const getServiceImage = (name: string): string => {
  const key = `./assets/images/services/${name}.jpg`;
  return serviceImages[key] || '';
};

const labTestsAtHomeImages = import.meta.glob('./assets/images/lab-tests-at-home/*.jpg', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
const homeHealthcareImages = import.meta.glob('./assets/images/home_healthcare/*.jpg', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;
const rentalEquipmentImages = import.meta.glob('./assets/images/rentalimg/*.jpg', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

export const DEFAULT_HEALTHCARE_SERVICE_IMAGE =
  homeHealthcareImages['./assets/images/home_healthcare/Generic Nurse Visit.jpg'] ||
  getServiceImage('generic-nurse');

// ── Image Aliases ──────────────────────────────────────────────

const homeHealthcareImageAliases: Record<string, string> = {
  'GUT CLEANSE & ACNE CURE IV THERAPY': 'Gut support IV Therapy',
  'GUT CLEANSE AND ACNE CURE IV THERAPY': 'Gut support IV Therapy',
  'MEMORY BOOST AND FOCUS IV THERAPY': 'Memory Boost IV Therapy',
  'MEMORY BOOST IV THERAPY': 'Memory Boost IV Therapy',
  'SPEECH AND LANGUAGE THERAPY': 'speech_therapy_session',
  'SPEECH THERAPY': 'speech_therapy_session',
  'SURGERY RECOVERY IV THERAPY': 'Surgery Recovery IV Therapy',
  "MEN'S POWER IV DRIP": 'Men Power IV Therapy',
  "MEN POWER IV DRIP": 'Men Power IV Therapy',
  "MEN'S POWER IV THERAPY": 'Men Power IV Therapy',
  'OXYGEN CYLINDER SET 48CFT (INCLUDES REGULATOR AND TROLLEY)': 'Oxygen Cylinder Set 48cft',
  'OCCUPATIONAL THERAPY': 'occupational_therapy_session',
  'LONG-TERM SPECIALIZED CARE': 'caregiver_home',
};

// ── Image Resolution ───────────────────────────────────────────

const getHomeHealthcareImageKey = (title: string) => {
  const normalizedTitle = title.replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim().toUpperCase();
  const normalizedTitleCompact = title.replace(/&amp;/gi, '&').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim().toUpperCase();
  if (normalizedTitle === 'WOUND CARE AND SURGICAL DRESSING - SMALL' || normalizedTitleCompact.includes('WOUND CARE AND SURGICAL DRESSING-SMALL')) return 'Wound Care and Surgical Dressing-Small';
  if (normalizedTitle === 'WOUND CARE AND SURGICAL DRESSING - MEDIUM' || normalizedTitleCompact.includes('WOUND CARE AND SURGICAL DRESSING-MEDIUM')) return 'Wound Care and Surgical Dressing-Medium';
  if (normalizedTitle === 'WOUND CARE AND SURGICAL DRESSING - LARGE' || normalizedTitleCompact.includes('WOUND CARE AND SURGICAL DRESSING-LARGE')) return 'Wound Care and Surgical Dressing-Large';
  if (normalizedTitle === 'CATHETERISATION AT HOME (FEMALE)' || normalizedTitle === 'CATHETERISATION AT HOME') return 'Catheterisation at home (Female)';
  if (normalizedTitle === 'IV ANTIBIOTICS AT HOME (WITH DR PRESCRIPTION)') return 'IV antibiotics at home (with Dr Prescription)';
  if (normalizedTitle.startsWith('PHYSIOTHERAPY')) return 'physiotherapy_session';
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
  if (normalizedTitle.startsWith('CARE GIVER') || normalizedTitle.startsWith('CAREGIVER')) return 'caregiver_home';
  if (normalizedTitle.includes('IV THERAPY') || normalizedTitle.includes('IV DRIP') || normalizedTitle.includes('IV INFUSION')) return 'iv_therapy_drip';
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

const normalizeLabImageSlug = (title: string) =>
  'srv-lab-home-' + title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const resolveHealthcareServiceImage = (service: HealthcareService): HealthcareService => {
  if (service.category === 'lab-tests' || service.category === 'lab-tests-at-home') {
    const labSlug = normalizeLabImageSlug(service.title);
    const labImage = labTestsAtHomeImages[`./assets/images/lab-tests-at-home/${labSlug}.jpg`];
    if (labImage) return { ...service, image: labImage };
    return service;
  }

  const imageKey = getHomeHealthcareImageKey(service.title);
  const localImage = homeHealthcareImages[`./assets/images/home_healthcare/${imageKey}.jpg`];

  return localImage ? { ...service, image: localImage } : { ...service, image: service.image || DEFAULT_HEALTHCARE_SERVICE_IMAGE };
};

export const withRentalEquipmentImages = (products: Product[]) =>
  products.map((product) => {
    if (product.subcategory !== 'rent-medical-equipments') return product;
    const rentalEquipmentImageNames: Record<string, string> = {
      'BIPAP Machine': 'bipap machine',
      'Patient Hoist': 'hospital patient hoist',
      'Patient Monitor 5 Parameter with trolley and accessories': 'Patient Monitor 5 Parameter with',
      'Suction Machine': 'suction machine',
      'Electric Bed 3 Function': 'hospital_bed',
      'Electric Bed 5 Function': 'hospital_bed',
    };
    const imageName = rentalEquipmentImageNames[product.name] || product.name;
    const localImage = rentalEquipmentImages[`./assets/images/rentalimg/${imageName}.jpg`];
    return localImage ? { ...product, image: localImage } : product;
  });

// ── Utility Data ───────────────────────────────────────────────

export const DUBAI_LOCATIONS = [
  'Dubai Marina', 'Jumeirah', 'Deira', 'Bur Dubai', 'Al Barsha',
  'Downtown Dubai', 'Business Bay', 'Al Garhoud', 'Mirdif',
];
