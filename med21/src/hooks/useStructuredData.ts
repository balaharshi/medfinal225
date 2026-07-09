import { useEffect } from 'react';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://medzivahealthcare.com';

export function useStructuredData() {
  useEffect(() => {
    // Remove existing JSON-LD to avoid duplicates
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());

    const schemas = [
      // Organization
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "MedZiva Healthcare",
        "url": SITE_URL,
        "logo": `${SITE_URL}/newlogo.png`,
        "description": "Premium healthcare marketplace in Dubai — book home healthcare, lab tests, IV therapy, and medical equipment rental from DHA-compliant providers.",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Al Gaizi Plaza, Al Garhoud",
          "addressLocality": "Dubai",
          "addressCountry": "AE"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+971-55-951-0794",
          "contactType": "customer service",
          "email": "info@medzivahealthcare.com"
        },
        "sameAs": [
          "https://www.facebook.com/medzivahealthcare",
          "https://www.instagram.com/medzivahealthcare",
          "https://www.linkedin.com/company/medzivahealthcare"
        ]
      },
      // LocalBusiness
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "MedZiva Healthcare",
        "image": `${SITE_URL}/b23.png`,
        "telephone": "+971-55-951-0794",
        "email": "info@medzivahealthcare.com",
        "priceRange": "AED 59 - AED 30,000",
        "openingHoursSpecification": [
          { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], "opens": "08:00", "closes": "22:00" }
        ],
        "areaServed": ["Dubai", "Sharjah"],
        "url": SITE_URL
      },
      // Services offered
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "item": { "@type": "MedicalService", "name": "Nursing Care at Home", "url": `${SITE_URL}/services/nursing-care-at-home` } },
          { "@type": "ListItem", "position": 2, "item": { "@type": "MedicalService", "name": "Doctor on Call", "url": `${SITE_URL}/services/doctor-on-call` } },
          { "@type": "ListItem", "position": 3, "item": { "@type": "MedicalService", "name": "Physiotherapy at Home", "url": `${SITE_URL}/services/physiotherapy-at-home` } },
          { "@type": "ListItem", "position": 4, "item": { "@type": "MedicalService", "name": "IV Therapy", "url": `${SITE_URL}/services/iv-therapy` } },
          { "@type": "ListItem", "position": 5, "item": { "@type": "MedicalService", "name": "Lab Tests at Home", "url": `${SITE_URL}/services/lab-tests-at-home` } },
          { "@type": "ListItem", "position": 6, "item": { "@type": "MedicalService", "name": "Speech and Language Therapy", "url": `${SITE_URL}/services/speech-and-language-therapy` } },
          { "@type": "ListItem", "position": 7, "item": { "@type": "MedicalService", "name": "Occupational Therapy", "url": `${SITE_URL}/services/occupational-therapy` } },
          { "@type": "ListItem", "position": 8, "item": { "@type": "MedicalBusiness", "name": "Rent Medical Equipment", "url": `${SITE_URL}/products/rent-medical-equipments` } }
        ]
      },
      // FAQ
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What services does MedZiva offer?", "acceptedAnswer": { "@type": "Answer", "text": "We offer nursing care at home, doctor on call, physiotherapy, IV therapy, lab tests at home, speech therapy, occupational therapy, and medical equipment rental across Dubai and Sharjah." } },
          { "@type": "Question", "name": "How do I book a service?", "acceptedAnswer": { "@type": "Answer", "text": "Browse services on our website, select your preferred date and time slot, and complete the booking. You'll receive a confirmation once a healthcare provider accepts." } },
          { "@type": "Question", "name": "What areas do you serve?", "acceptedAnswer": { "@type": "Answer", "text": "We currently serve all areas of Dubai and Sharjah." } },
          { "@type": "Question", "name": "Can I cancel or reschedule?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Cancellations made more than 24 hours before the appointment are eligible for a full refund. Rescheduling requires at least 24 hours notice." } }
        ]
      },
      // WebSite search
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "url": SITE_URL,
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${SITE_URL}/?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      }
    ];

    schemas.forEach(schema => {
      const script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, []);
}
