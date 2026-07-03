import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dbPath = path.join(root, 'src', 'db.json');
const dataPath = path.join(root, 'src', 'data.ts');

const commonLongTermDescription =
  'A DHA-licensed nurse dedicated to your care — managing medications, monitoring vitals, and providing professional support through the day or night.';
const commonCaregiverDescription =
  'Continuous, compassionate support from a live-in caregiver -helping with daily activities, mobility, and wellbeing, day and night.';
const physioDescription =
  'A dedicated hour with a certified physiotherapist to assess, treat, and rehabilitate — helping you move better, recover faster,';

const serviceUpdates = {
  'srv-generic-nurse': {
    title: 'Generic Nurse Visit',
    price: 250,
    description:
      'Expert nursing support brought to you — routine care, recovery assistance, and health monitoring, all in one visit.',
    bookingNotice: '12 hours prior booking for Vendor 1 and 2, 24 hours prioir for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 200 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 300 },
    ],
  },
  'srv-wound-small': {
    title: 'Wound care  and Surgical Dressing-Small',
    price: 500,
    description:
      'Precise, hygienic care for minor wounds and small surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.',
    bookingNotice: '12 hours prior booking for Vendor 1 and 2, 24 hours prioir for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 300 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 400 },
    ],
  },
  'srv-wound-medium': {
    title: 'Wound care  and Surgical Dressing-Medium',
    price: 650,
    description:
      'Precise, hygienic care for minor wounds and medium surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.',
    bookingNotice: '12 hours prior booking for Vendor 1 and 2, 24 hours prioir for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 500 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 500 },
    ],
  },
  'srv-wound-large': {
    title: 'Wound care  and Surgical Dressing-Large',
    price: 1000,
    description:
      'Precise, hygienic care for minor wounds and large surgical sites — cleaned, dressed, and monitored by a trained nurse to support faster healing and prevent infection.',
    bookingNotice: '12 hours prior booking for Vendor 1 and 2, 24 hours prioir for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 750 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 700 },
    ],
  },
  'srv-catheterisation-female': {
    title: 'Catheterisation at home',
    price: 850,
    description:
      'Safe, sterile catheter insertion and care delivered in the comfort of your home — performed by a trained clinical nurse with full privacy, dignity, and clinical precision.',
    bookingNotice: '12 hours prior booking for Vendor 1 and 2, 24 hours prioir for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 650 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 500 },
    ],
  },
  'srv-iv-antibiotics-prescription': {
    title: 'IV antibiotics at home (with Dr Prescription)',
    price: 750,
    description:
      'Complete your antibiotic course from the comfort of home — a qualified nurse administers your prescribed IV treatment safely and efficiently, so you recover without the hospital stay.',
    bookingNotice: '12 hours prior booking for Vendor 1 and 2, 24 hours prioir for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 500 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 500 },
    ],
  },
  'srv-longterm-dha-rn-live-in-30-days': {
    title: 'DHA REGISTERED NURSE-24 HOURS LIVE IN - 30 DAYS - 1 STAFF',
    price: 25000,
    duration: '30 DAYS - 1 STAFF',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 18000 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 19500 },
    ],
  },
  'srv-longterm-dha-an-live-in-30-days': {
    title: 'DHA REGISTERED NURSE-24 HOURS LIVE IN - 30 DAYS - 1 STAFF',
    price: 22000,
    duration: '30 DAYS - 1 STAFF',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 16500 }],
  },
  'srv-longterm-dha-nurse-1-plus-1-live-in-30-days': {
    title: 'DHA REGISTERED NURSE-24 HOURS LIVE IN - 30 DAYS - 2 STAFF( 1+1)-12 HOURS EACH PER SHIFT',
    price: 30000,
    duration: '30 DAYS - 2 STAFF( 1+1)-12 HOURS EACH PER SHIFT',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 23000 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 25500 },
    ],
  },
  'srv-longterm-dha-nurse-12-hours-30-days': {
    title: 'DHA REGISTERED NURSE-12 HOURS - 30 DAYS - 1 STAFF',
    price: 15000,
    duration: '30 DAYS - 1 STAFF',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 13000 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 12000 },
    ],
  },
  'srv-longterm-dha-nurse-8-hours-30-days': {
    title: 'DHA REGISTERED NURSE-8 HOURS - 30 DAYS - 1 STAFF',
    price: 10000,
    duration: '30 DAYS - 1 STAFF',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 9000 }],
  },
  'srv-longterm-dha-nurse-less-than-12-hours-30-days': {
    title: 'DHA REGISTERED NURSE-LESS THAN 12 HOURS/DAY - 30 DAYS - 1 STAFF',
    price: 13000,
    duration: '30 DAYS - 1 STAFF',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 11000 }],
  },
  'srv-longterm-dha-nurse-rn-an-live-in-per-day': {
    title: 'DHA REGISTERED NURSE-24 HOURS LIVE IN - 1 DAY - 1 STAFF',
    price: 1500,
    duration: '1 DAY - 1 STAFF',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 800 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 1300 },
    ],
  },
  'srv-longterm-dha-nurse-24-hours-per-day-1-plus-1': {
    title: 'DHA REGISTERED NURSE-24 HOURS LIVE IN - 1 DAY - 2 STAFF( 1+1)-12 HOURS EACH PER SHIFT',
    price: 2500,
    duration: '1 DAY - 2 STAFF( 1+1)-12 HOURS EACH PER SHIFT',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 1250 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 1800 },
    ],
  },
  'srv-longterm-dha-nurse-12-hours-per-day': {
    title: 'DHA REGISTERED NURSE-12 HOURS - 1 DAY - 1 STAFF',
    price: 1000,
    duration: '1 DAY - 1 STAFF',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 850 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 700 },
    ],
  },
  'srv-longterm-dha-nurse-less-than-12-hours-per-day': {
    title: 'DHA REGISTERED NURSE-LESS THAN 12 HOURS - 1 DAY - 1 STAFF',
    price: 125,
    duration: '1 DAY - 1 STAFF',
    description: commonLongTermDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    remarks: 'AED 125/hour',
  },
  'srv-longterm-dha-ventillator-trach-peg-24-hours-30-days': {
    title: 'DHA REGISTERED NURSE TO MANAGE VENTILLATOR/TRACH & PEG-24 hours - 30days - 1 STAFF',
    price: 28000,
    duration: '30days - 1 STAFF',
    description:
      'A DHA-licensed nurse dedicated to your care — managing patients on ventilator support, tracheostomy, or PEG feeding',
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
  },
  'srv-longterm-caregiver-live-in-30-days': {
    title: 'CARE GIVER -24 HOURS LIVE IN - 30 DAYS - 1 STAFF',
    price: 17000,
    duration: '30 DAYS - 1 STAFF',
    description: commonCaregiverDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 15000 }],
  },
  'srv-longterm-caregiver-24-hours-30-days-1-plus-1': {
    title: 'CARE GIVER -24 HOURS LIVE IN - 30 DAYS - 2 STAFF( 1+1)-12 HOURS EACH PER SHIFT',
    price: 25000,
    duration: '30 DAYS - 2 STAFF( 1+1)-12 HOURS EACH PER SHIFT',
    description: commonCaregiverDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 20000 }],
  },
  'srv-longterm-caregiver-12-hours-30-days': {
    title: 'CARE GIVER -12 HOURS - 30 DAYS - 1 STAFF',
    price: 12000,
    duration: '30 DAYS - 1 STAFF',
    description: commonCaregiverDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 9000 }],
  },
  'srv-longterm-caregiver-less-than-12-hours-30-days': {
    title: 'CARE GIVER -LESS THAN 12 HOURS/DAY - 30 DAYS - 1 STAFF',
    price: 11000,
    duration: '30 DAYS - 1 STAFF',
    description: commonCaregiverDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 8000 }],
  },
  'srv-longterm-caregiver-live-in-per-day': {
    title: 'CARE GIVER --24 HOURS LIVE IN - 1 DAY - 1 STAFF',
    price: 850,
    duration: '1 DAY - 1 STAFF',
    description: commonCaregiverDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 650 }],
  },
  'srv-longterm-caregiver-24-hours-per-day-1-plus-1': {
    title: 'CARE GIVER -24 HOURS LIVE IN - 1 DAY - 2 STAFF( 1+1)-12 HOURS EACH PER SHIFT',
    price: 1050,
    duration: '1 DAY - 2 STAFF( 1+1)-12 HOURS EACH PER SHIFT',
    description: commonCaregiverDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 800 }],
  },
  'srv-longterm-caregiver-12-hours-per-day': {
    title: 'CARE GIVER -12 HOURS - 1 DAY - 1 STAFF',
    price: 700,
    duration: '1 DAY - 1 STAFF',
    description: commonCaregiverDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 500 }],
  },
  'srv-longterm-caregiver-less-than-12-hours-per-day': {
    title: 'CARE GIVER -LESS THAN 12 HOURS - 1 DAY - 1 STAFF',
    price: 650,
    duration: '1 DAY - 1 STAFF',
    description: commonCaregiverDescription,
    bookingNotice: '24 hours prior booking for Vendor 1 and 2, 4 days prior notice for Vendor 3',
    vendorPrices: [{ vendorName: 'Doctor Plus Home Healthcare', price: 450 }],
  },
  'srv-physiotherapy': {
    title: 'Physiotherapy- 1 hour session',
    price: 400,
    description: physioDescription,
    bookingNotice: '12 hours prior booking for Vendor 1 and 2, 24 hours prioir for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 300 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 300 },
    ],
  },
  'srv-physiotherapy-week-6': {
    title: 'physiotherapy- 1 hour session/week-6 sessions',
    price: 2000,
    description: physioDescription,
    bookingNotice: '12 hours prior booking for Vendor 1 and 2, 24 hours prioir for Vendor 3',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 1500 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 1620 },
    ],
  },
  'srv-dr-home': {
    title: 'Doctor at Home',
    price: 500,
    description: 'A qualified doctor visits you for consultations, diagnosis, and treatment — no waiting rooms, no commute.',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 400 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 250 },
    ],
  },
  'srv-dr-hotel': {
    title: 'Doctor at Hotel',
    price: 1000,
    description: 'A qualified doctor brought to your hotel — expert diagnosis and treatment, right where you are in the city.',
    vendorPrices: [
      { vendorName: 'Olives Al Noor Home Healthcare LLC', price: 800 },
      { vendorName: 'Doctor Plus Home Healthcare', price: 250 },
    ],
  },
  'srv-speech-therapy-hour': {
    title: 'Speech and Language Therapy',
    price: 400,
    description:
      'Structured sessions addressing speech delays, articulation challenges, and swallowing difficulties — delivered by a qualified speech and language specialist.',
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Ephatha', price: 300 }],
  },
  'srv-occupational-therapy-hour': {
    title: 'Occupation Therapy',
    price: 400,
    description:
      'Practical, goal-driven sessions helping you regain independence in daily tasks — from fine motor skills and cognitive function to adaptive techniques for work, home, and life.',
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Ephatha', price: 300 }],
  },
  'srv-iv-skin-glow': {
    title: 'Skin Glow IV Therapy',
    price: 850,
    description:
      'This powerful blend of antioxidants and vitamins promotes a radiant complexion by reducing oxidative stress and improving skin health.',
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 699 }],
  },
  'srv-iv-hair-loss': {
    title: 'Hair Loss IV Therapy',
    price: 999,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 999 }],
  },
  'srv-iv-skin-hair-wellness': {
    title: 'Skin and Hair wellness IV Drip',
    price: 799.2,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 799.2 }],
  },
  'srv-iv-energy-booster': {
    title: 'Energy Booster IV Therapy',
    price: 999,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 999 }],
  },
  'srv-iv-immune-booster': {
    title: 'Immune Booster IV Therapy',
    price: 880,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 880 }],
  },
  'srv-iv-hangover': {
    title: 'Hangover IV Therapy',
    price: 999,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 999 }],
  },
  'srv-iv-liver-detox': {
    title: 'Liver Detox IV Therapy',
    price: 959.2,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 959.2 }],
  },
  'srv-iv-antistress': {
    title: 'Antistress and Antoixidant IV Therapy',
    price: 999,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 999 }],
  },
  'srv-iv-female-balance': {
    title: 'Female Balance IV Therapy',
    price: 898.8,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 749 }],
  },
  'srv-iv-memory-boost': {
    title: 'Memory Boost and Focus IV Therapy',
    price: 899,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 699 }],
  },
  'srv-iv-vitamin-mix': {
    title: 'Vitamin Mix IV Therapy',
    price: 1199,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 975 }],
  },
  'srv-iv-iron-boost': {
    title: 'Iron Boost IV Therapy',
    price: 500,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 500 }],
  },
  'srv-iv-gut-support': {
    title: 'Gut support IV Therapy',
    price: 749,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 749 }],
  },
  'srv-iv-nad-100': {
    title: 'Antiaging with NAD 100mg IV Therapy',
    price: 999,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 799 }],
  },
  'srv-iv-nad-250': {
    title: 'Antiaging with NAD 250mg IV Therapy',
    price: 1198.8,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 999 }],
  },
  'srv-iv-nad-500': {
    title: 'Antiaging with NAD 500mg IV Therapy',
    price: 1699,
    bookingNotice: '24 hours prior booking',
    vendorPrices: [{ vendorName: 'Olives Al Noor Home Healthcare LLC', price: 1399 }],
  },
};

const newServices = [];

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const obsoleteServiceIds = new Set([
  'srv-longterm-dha-an-live-in-30-days',
]);

db.services = db.services.filter((service) => !obsoleteServiceIds.has(service.id));

const serviceById = new Map(db.services.map((service) => [service.id, service]));

for (const [id, update] of Object.entries(serviceUpdates)) {
  if (obsoleteServiceIds.has(id)) continue;
  const service = serviceById.get(id);
  if (!service) {
    throw new Error(`Missing service id: ${id}`);
  }
  Object.assign(service, update);
}

const existingIds = new Set(db.services.map((service) => service.id));
const insertAfterId = 'srv-iv-skin-glow';
const insertIndex = db.services.findIndex((service) => service.id === insertAfterId) + 1;
const missingServices = newServices.filter((service) => !existingIds.has(service.id));
if (missingServices.length) {
  db.services.splice(insertIndex, 0, ...missingServices);
}

fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`);

const dataSource = fs.readFileSync(dataPath, 'utf8');
const blockPattern =
  /const BASE_HEALTHCARE_SERVICES: HealthcareService\[\] = \[[\s\S]*?\];\r?\n\r?\nconst BASE_HEALTHCARE_SERVICES_WITHOUT_LEGACY_HOME = BASE_HEALTHCARE_SERVICES\.filter\(/;
if (!blockPattern.test(dataSource)) {
  throw new Error('Could not locate BASE_HEALTHCARE_SERVICES block in data.ts');
}
const servicesLiteral = JSON.stringify(db.services, null, 2).replace(/"([^"]+)":/g, '$1:');
const nextDataSource = dataSource.replace(
  blockPattern,
  `const BASE_HEALTHCARE_SERVICES: HealthcareService[] = ${servicesLiteral};\n\nconst BASE_HEALTHCARE_SERVICES_WITHOUT_LEGACY_HOME = BASE_HEALTHCARE_SERVICES.filter(`
);
fs.writeFileSync(dataPath, nextDataSource);

console.log(JSON.stringify({
  updated: Object.keys(serviceUpdates).length,
  added: missingServices.length,
  totalServices: db.services.length,
}, null, 2));
