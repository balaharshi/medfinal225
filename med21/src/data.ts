/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceCategory, Product, HealthcareService } from './types';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-home-health',
    title: 'Nursing care at Home',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    slug: 'home-healthcare',
    description: 'DHA licensed nurses providing premium in-home clinical care, wound antiseptic dressing, and support.'
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
    image: '/speach.png',
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
    description: 'DHA licensed nurse administered intravenous nutrient drips, energy infusions, and premium age reversal NAD+.'
  },
  {
    id: 'cat-devices',
    title: 'Medical Devices for Rent',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400',
    slug: 'devices-for-rent',
    description: 'Certified oxygen units, wheelchairs, electronic hospital beds, and clinical mobility lifts on weekly / Monthly.'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-omron-bp',
    name: 'Omron BP Monitor',
    subtitle: 'HEM-7120 Electronic Upper Arm Blood Pressure Monitor',
    price: 139,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
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
    category: 'devices-for-rent',
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
    category: 'devices-for-rent',
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
    category: 'devices-for-rent',
    brand: 'Omron',
    rating: 4.6,
    inStock: true
  },
  {
    id: 'prod-electric-bed',
    name: 'Electric Bed 3 Function',
    subtitle: 'Weekly: AED 480 | Monthly: AED 1344 | Security Deposit: AED 2000',
    price: 1344,
    originalPrice: 1800,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    brand: 'MedEquip',
    rating: 4.9,
    inStock: true
  },
  {
    id: 'prod-back-belt',
    name: 'Back Support Belt',
    subtitle: 'Adjustable Posture Corrector and Lumbar Relief Belt',
    price: 89,
    originalPrice: 129,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=400',
    category: 'wellness',
    brand: 'FlexiBack',
    rating: 4.5,
    inStock: true
  },
  {
    id: 'prod-whey',
    name: 'Whey Protein',
    subtitle: 'Chocolate flavor Premium Isolate Protein Supplement (1kg)',
    price: 149,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=400',
    category: 'nutrition-diet',
    brand: 'Optimum Gold',
    rating: 4.9,
    inStock: true
  },
  {
    id: 'prod-gluco',
    name: 'Glucometer',
    subtitle: 'Blood Sugar Monitor Kit with 25 Sterile Test Strips',
    price: 89,
    originalPrice: 129,
    image: 'https://images.unsplash.com/photo-1628115502411-ca48001146c5?auto=format&fit=crop&q=80&w=400',
    category: 'devices-for-rent',
    brand: 'AccuCheck',
    rating: 4.8,
    inStock: true
  },
  {
    id: 'prod-knee-supp',
    name: 'Knee Support',
    subtitle: 'Adjustable Neoprene Double Compression Patella Stabilizer Brace',
    price: 69,
    originalPrice: 99,
    image: 'https://images.unsplash.com/photo-1576091159399-a37f8d40a8ed?auto=format&fit=crop&q=80&w=400',
    category: 'wellness',
    brand: 'JointCare',
    rating: 4.7,
    inStock: true
  }
];

export const HEALTHCARE_SERVICES: HealthcareService[] = [
  // 1. Nursing care at Home
  {
    id: 'srv-generic-nurse',
    title: 'Generic Nurse Visit',
    category: 'home-healthcare',
    price: 200,
    duration: '1 Hour (Min 3 hrs)',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    description: 'Experienced registered nurses for checkups, injection preparation, or general clinical assistance at home.',
    popular: true
  },
  {
    id: 'srv-wound-small',
    title: 'Wound care and Surgical Dressing-Small',
    category: 'home-healthcare',
    price: 500,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    description: 'Standard clinical dressing for small incisions or wounds focusing on premium sanitary and infection controls.',
    popular: false
  },
  {
    id: 'srv-wound-medium',
    title: 'Wound care and Surgical Dressing-Medium',
    category: 'home-healthcare',
    price: 650,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    description: 'Specialized antiseptic cleaning and surgical dressing application for medium-sized post-operative wounds.',
    popular: false
  },
  {
    id: 'srv-wound-large',
    title: 'Wound care and Surgical Dressing-Large',
    category: 'home-healthcare',
    price: 1000,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    description: 'Advanced sterile surgical dressing & intensive wound debridement overview for large ulcers, skin incisions or bedsores.',
    popular: false
  },
  {
    id: 'srv-longterm-nursing',
    title: 'Long term Nursing Care',
    category: 'home-healthcare',
    price: 0,
    duration: 'Hourly / Monthly',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400',
    description: 'Customized long-term home nursing schedules supervised by senior certified DHA health specialists.',
    popular: true,
    enquiryOnly: true
  },
  {
    id: 'srv-elderly-longterm',
    title: 'Elderly and Long term care',
    category: 'home-healthcare',
    price: 0,
    duration: 'Daily / Weekly',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400',
    description: 'Supportive elder assistance, companionship, nutritional checks, and daily activities management.',
    popular: true,
    enquiryOnly: true
  },
  {
    id: 'srv-post-surgery',
    title: 'Post Surgery Recovery',
    category: 'home-healthcare',
    price: 0,
    duration: 'Custom Basis',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    description: 'Clinical profile tracking, wound audit, therapeutic guidance and supportive recovery following hospital discharges.',
    popular: false,
    enquiryOnly: true
  },
  {
    id: 'srv-chronic-clinical',
    title: 'Chronic Disease management',
    category: 'home-healthcare',
    price: 0,
    duration: 'Continuous',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400',
    description: 'Certified chronic wellness and clinical oversight targeting diabetes, high blood pressure, asthma, or COPD.',
    popular: false,
    enquiryOnly: true
  },
  {
    id: 'srv-palliative',
    title: 'Palliative care',
    category: 'home-healthcare',
    price: 0,
    duration: 'Continuous',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400',
    description: 'Compassionate multi-disciplinary support focusing on pain relief, symptom reduction, and spiritual alignment.',
    popular: false,
    enquiryOnly: true
  },

  // 2. Physiotherapy at Home
  {
    id: 'srv-physiotherapy',
    title: 'Physiotherapy',
    category: 'physiotherapy',
    price: 450,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
    description: 'Personalized muscle recovery, mobility restoration and skeletal manipulation with a certified physiotherapist.',
    popular: true
  },

  // 3. Doctor on Call
  {
    id: 'srv-dr-home',
    title: 'Doctor at Home',
    category: 'doctor-on-call',
    price: 500,
    duration: '30 Min Session',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    description: 'DHA Licensed Primary Care Doctor visit at your home for standard diagnostic evaluation and acute symptom relief.',
    popular: true
  },
  {
    id: 'srv-dr-hotel',
    title: 'Doctor at Hotel',
    category: 'doctor-on-call',
    price: 500,
    duration: '30 Min Session',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    description: 'Urgent premium doctor dispatch directly to your hotel room or suite with treatment prescriptions and checkups.',
    popular: false
  },

  // 4. Speech and Language Therapy
  {
    id: 'srv-speech-therapy-hour',
    title: 'Speech and Language Therapy',
    category: 'speech-therapy',
    price: 400,
    duration: '1 Hour Session',
    image: '/speach.png',
    description: 'Interactions and communication exercises addressing expressive articulation, speech issues, or swallow patterns.',
    popular: true
  },
  {
    id: 'srv-child-speech-therapy',
    title: 'Child Speech Therapy',
    category: 'speech-therapy',
    price: 350,
    duration: '45 Min Session',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    description: 'Specialized speech therapy for children focusing on language development, articulation, and communication skills.',
    popular: false
  },
  {
    id: 'srv-adult-speech-rehab',
    title: 'Adult Speech Rehabilitation',
    category: 'speech-therapy',
    price: 450,
    duration: '1 Hour Session',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    description: 'Rehabilitation services for adults recovering from stroke, brain injury, or neurological conditions affecting speech.',
    popular: false
  },

  // 5. Occupational Therapy
  {
    id: 'srv-occupational-therapy-hour',
    title: 'Occupation Therapy',
    category: 'occupational-therapy',
    price: 400,
    duration: '1 Hour Session',
    image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=400',
    description: 'Functional recovery programs targeting motor skill recovery, joint alignment, and day-to-day work autonomy support.',
    popular: true
  },

  // 6. Lab Tests at Home
  {
    id: 'srv-cbc-differential',
    title: 'Complete Blood Count (CBC) with differential',
    category: 'lab-tests',
    subcategory: 'routine-blood-tests',
    price: 99,
    duration: 'Result: 24 hrs',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400',
    description: 'Routine blood test for complete blood count with differential, available with at-home sample collection.',
    who: 'Routine check, fatigue, infection, anemia, monitoring',
    prep: 'No fasting • Stay hydrated • Inform meds',
    result: '24 hrs (same day possible)',
    popular: true
  },

  // 7. IV Therapy
  {
    id: 'srv-iv-skin-glow',
    title: 'Skin Glow IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Premium Glutathione and Vitamin C infusion designed to nourish skin radiance, fight hyperpigmentation and clarify complexion.',
    popular: true
  },
  {
    id: 'srv-iv-hair-loss',
    title: 'Hair Loss IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Biotin-fortified medical infusion to support hair follicle strengths, stimulate locks growth and reverse scalp thinning.',
    popular: false
  },
  {
    id: 'srv-iv-skin-hair-wellness',
    title: 'Skin and Hair wellness IV Drip',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Synergistic beauty blend of vital amino acids and high-dose trace elements for complete dermal and hair density enhancement.',
    popular: false
  },
  {
    id: 'srv-iv-energy-booster',
    title: 'Energy Booster IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Recharging clinical fluid loaded with B-complex vitamins, helping to overcome physical lethargy and restore peak muscle performance.',
    popular: true
  },
  {
    id: 'srv-iv-immune-booster',
    title: 'Immune Booster IV Therapy',
    category: 'iv-therapy',
    price: 1100,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1629904858656-aa8c3b3f39ca?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Super-defense mineral shield combined with high zinc formulation to ward off seasonal cold, flu, and chronic immune vulnerabilities.',
    popular: true
  },
  {
    id: 'srv-iv-hangover',
    title: 'Hangover IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1631217868484-e4b8c8193a38?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Hyper-hydration therapeutic recipe neutralizing free radicals, curing severe migraines, and restoring electrolyte balance.',
    popular: false
  },
  {
    id: 'srv-iv-liver-detox',
    title: 'Liver Detox IV Therapy',
    category: 'iv-therapy',
    price: 1100,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'In-depth hepatic flushing combining strong hepatoprotective elements to clear internal toxins and liver cell stress.',
    popular: false
  },
  {
    id: 'srv-iv-antistress',
    title: 'Antistress and Antoixidant IV Therapy',
    category: 'iv-therapy',
    price: 1299,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Premium neural calming blend containing calming magnesium and powerful antioxidants to defeat stress, fatigue, and burnout.',
    popular: false
  },
  {
    id: 'srv-iv-female-balance',
    title: 'Female Balance IV Therapy',
    category: 'iv-therapy',
    price: 899,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Specially engineered mineral balancing infusion to optimize hormonal health, soothe PMS muscle cramps and improve sleep cycles.',
    popular: false
  },
  {
    id: 'srv-iv-memory-boost',
    title: 'Memory Boost IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Critical neuro-support factors designed to optimize cognitive focus, elevate retention speeds and clear mental fog.',
    popular: false
  },
  {
    id: 'srv-iv-vitamin-mix',
    title: 'Vitamin Mix IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Wellness cocktails featuring an intensive spectrum of 12 vital micronutrients for complete physical restoration.',
    popular: false
  },
  {
    id: 'srv-iv-iron-boost',
    title: 'Iron Boost IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Highly bioavailable medical iron replacement therapy to correct chronic fatigue and optimize blood cell oxygenation.',
    popular: false
  },
  {
    id: 'srv-iv-gut-support',
    title: 'Gut support IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Soothing hydration flush focused on digestion health, reducing gut lining irritation and promoting healthy bowel absorption.',
    popular: false
  },
  {
    id: 'srv-iv-nad-100',
    title: 'Antiaging with NAD 100mg IV Therapy',
    category: 'iv-therapy',
    price: 999,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Moderate Nicotinamide Adenine Dinucleotide (NAD+) infusion initiating mitochondrial DNA repairs and cell revitalization.',
    popular: false
  },
  {
    id: 'srv-iv-nad-250',
    title: 'Antiaging with NAD 250mg IV Therapy',
    category: 'iv-therapy',
    price: 1299,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1559757175-0ebdcd4616ae?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Strong clinical NAD+ infusion activating deep sirtuin enzymes to boost cellular lifespan, energy, and anti-aging defenses.',
    popular: false
  },
  {
    id: 'srv-iv-nad-500',
    title: 'Antiaging with NAD 500mg IV Therapy',
    category: 'iv-therapy',
    price: 1499,
    duration: '1 Session',
    image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400&v=' + Date.now(),
    description: 'Vigorous longevity infusion delivering 500mg pure medical NAD+ to optimize cognitive neuro-protection and full systemic age reversal.',
    popular: false
  },
];

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
