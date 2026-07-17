/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { trackPageView, trackEvent, AnalyticsEvents } from '../services/analytics';
import { useSEO } from './useSEO';
import { api } from '../lib/api';
import {
  DEFAULT_HEALTHCARE_SERVICE_IMAGE,
  SERVICE_CATEGORIES,
  PRODUCTS,
  HEALTHCARE_SERVICES,
  DUBAI_LOCATIONS,
  resolveHealthcareServiceImage,
} from '../data';
import { ActiveTab, CartItem, Product, HealthcareService, ServiceCategory } from '../types';
import { LAB_TESTS_AT_HOME_CATEGORIES } from '../../../shared/labTestsAtHomeCatalog.js';
import { subscribeToNotifications } from '../services/pusherClient';
import { formatAedWhole } from '../utils/money';

// ── Module-level Constants ──────────────────────────────────────────────

export const SITE_DEFAULT_DESCRIPTION = 'Premium healthcare marketplace in Dubai — book home healthcare, lab tests, IV therapy, and medical equipment rental from DHA compliant providers.';

export const SERVICE_ROUTE_BY_SECTION_ID: Record<string, string> = {
  'home-healthcare-section': 'nursing-care-at-home',
  'long-term-care-section': 'long-term-specialized-care',
  'physiotherapy-section': 'physiotherapy-at-home',
  'doctor-on-call-section': 'doctor-on-call',
  'speech-therapy-section': 'speech-and-language-therapy',
  'occupational-therapy-section': 'occupational-therapy',
  'iv-therapy-section': 'iv-therapy',
};

export const SERVICE_SECTION_ID_BY_ROUTE: Record<string, string> = {
  'nursing-care-at-home': 'home-healthcare-section',
  'long-term-specialized-care': 'long-term-care-section',
  'physiotherapy-at-home': 'physiotherapy-section',
  'doctor-on-call': 'doctor-on-call-section',
  'speech-and-language-therapy': 'speech-therapy-section',
  'occupational-therapy': 'occupational-therapy-section',
  'iv-therapy': 'iv-therapy-section',
};

export const DEFAULT_SERVICE_ROUTE = 'nursing-care-at-home';

export const LAB_TESTS_AT_HOME_ROUTE_PREFIX = '/services/lab-tests-at-home';

export const LAB_TESTS_SECTION_ID_BY_ROUTE: Record<string, string> = LAB_TESTS_AT_HOME_CATEGORIES.reduce((acc, category) => {
  acc[category.slug] = `${category.slug}-section`;
  return acc;
}, {} as Record<string, string>);

export const LAB_TESTS_ROUTE_BY_SECTION_ID: Record<string, string> = LAB_TESTS_AT_HOME_CATEGORIES.reduce((acc, category) => {
  acc[`${category.slug}-section`] = category.slug;
  return acc;
}, {} as Record<string, string>);

export const LAB_TESTS_PAGE_COPY: Record<string, { title: string; description: string }> = LAB_TESTS_AT_HOME_CATEGORIES.reduce((acc, category) => {
  acc[category.slug] = {
    title: category.title,
    description:
      category.slug === 'routine-blood-tests'
        ? 'Convenient home-based blood sample collection for routine health checks, diagnostic testing, and regular monitoring with reliable laboratory support.'
        : category.slug === 'preventive-health-packages'
        ? 'Comprehensive health screening packages designed for early detection, wellness monitoring, and proactive management of your overall health.'
        : category.slug === 'mens-health-packages'
        ? "Specialized health screening packages designed to support men\u2019s wellness, including preventive care, early detection, and monitoring of key health conditions."
        : category.slug === 'womens-health-packages'
        ? "Comprehensive health screening packages designed to support women\u2019s wellness, preventive care, early detection, and monitoring of key health needs."
        : category.slug === 'std-sexual-health'
        ? 'Confidential testing and screening services for sexually transmitted infections, supporting early detection, prevention, and informed health management.'
        : category.slug === 'specialized-diagnostic-tests'
        ? 'Advanced diagnostic testing services for accurate detection, specialized health assessments, and personalized care planning.'
        : category.slug === 'genetic-testing'
        ? 'Advanced genetic testing services to assess inherited conditions, health risks, and personalized insights for informed healthcare decisions.'
        : '12 hours prior booking slots.',
  };
  return acc;
}, {} as Record<string, { title: string; description: string }>);

export const DEFAULT_LAB_TESTS_ROUTE = 'routine-blood-tests';

export const HOME_ADDITIONAL_HEALTHCARE_CATEGORIES: ServiceCategory[] = [];

export const PRODUCT_ROUTE_BY_SECTION_ID: Record<string, string> = {
  'rent-medical-equipments-section': 'rent-medical-equipments',
  'buy-medical-equipments-section': 'buy-medical-equipments',
  'supplements-section': 'supplements',
};

export const PRODUCT_SECTION_ID_BY_ROUTE: Record<string, string> = {
  'rent-medical-equipments': 'rent-medical-equipments-section',
  'buy-medical-equipments': 'buy-medical-equipments-section',
  'supplements': 'supplements-section',
};

export const PRODUCT_CATEGORY_BY_ROUTE: Record<string, string> = {
  'rent-medical-equipments': 'rent-medical-equipment',
  'buy-medical-equipments': 'buy-medical-equipments',
  'supplements': 'supplements',
};

export const PRODUCT_PAGE_COPY: Record<string, { title: string; description: string }> = {
  'rent-medical-equipments': {
    title: 'Rent Medical Equipment',
    description: 'Weekly and monthly rental options with listed security deposits.',
  },
  'buy-medical-equipments': {
    title: 'Buy Medical Equipment',
    description: 'Order certified medical equipment and home healthcare accessories delivered across the UAE.',
  },
  supplements: {
    title: 'Supplements',
    description: 'Nutrition and wellness supplements available through the MedZiva product store.',
  },
};

export const DEFAULT_PRODUCT_ROUTE = 'rent-medical-equipments';

// ── Utility helpers ─────────────────────────────────────────────────────

const addSpacesAroundSlashes = (value?: string) =>
  value?.replace(/\s*\/\s*/g, ' / ');

const addSpacesAroundOnePlusOne = (value?: string) =>
  value?.replace(/\s*\(1\+1\)\s*/g, ' (1+1) ');

const normalizeLongTermTextSpacing = (value?: string) =>
  addSpacesAroundOnePlusOne(addSpacesAroundSlashes(value))?.replace(/\s{2,}/g, ' ').trim();

const normalizeLongTermServiceSlashSpacing = (service: HealthcareService): HealthcareService => ({
  ...service,
  title: normalizeLongTermTextSpacing(service.title) || service.title,
  duration: normalizeLongTermTextSpacing(service.duration) || service.duration,
  shortDescription: normalizeLongTermTextSpacing(service.shortDescription),
  fullDescription: normalizeLongTermTextSpacing(service.fullDescription),
  description: normalizeLongTermTextSpacing(service.description) || service.description,
  preparationInstructions: normalizeLongTermTextSpacing(service.preparationInstructions),
  whoIsItFor: normalizeLongTermTextSpacing(service.whoIsItFor),
  availability: normalizeLongTermTextSpacing(service.availability),
  bookingNotice: normalizeLongTermTextSpacing(service.bookingNotice),
  remarks: normalizeLongTermTextSpacing(service.remarks),
  who: normalizeLongTermTextSpacing(service.who),
  prep: normalizeLongTermTextSpacing(service.prep),
  result: normalizeLongTermTextSpacing(service.result),
  inclusions: service.inclusions?.map((item) => normalizeLongTermTextSpacing(item) || item),
  attributes: Array.isArray(service.attributes)
    ? service.attributes.map((attribute) => ({
        ...attribute,
        label:
          typeof attribute.label === 'string'
            ? normalizeLongTermTextSpacing(attribute.label)
            : attribute.label,
        value:
          typeof attribute.value === 'string'
            ? normalizeLongTermTextSpacing(attribute.value)
            : attribute.value,
      }))
    : service.attributes,
});

// ── Hook ────────────────────────────────────────────────────────────────

export function useAppState() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  const currentLabTestsRoute = location.pathname.startsWith(`${LAB_TESTS_AT_HOME_ROUTE_PREFIX}/`)
    ? location.pathname.split(`${LAB_TESTS_AT_HOME_ROUTE_PREFIX}/`)[1]?.split('/')[0] || null
    : null;
  const currentLabTestsSectionId = currentLabTestsRoute ? LAB_TESTS_SECTION_ID_BY_ROUTE[currentLabTestsRoute] || null : null;

  const currentServiceRoute = location.pathname.startsWith('/services/') && !location.pathname.startsWith(LAB_TESTS_AT_HOME_ROUTE_PREFIX)
    ? location.pathname.split('/services/')[1]?.split('/')[0] || null
    : null;
  const currentServiceSectionId = currentServiceRoute ? SERVICE_SECTION_ID_BY_ROUTE[currentServiceRoute] || null : null;

  const currentProductRoute = location.pathname.startsWith('/products/')
    ? location.pathname.split('/products/')[1]?.split('/')[0] || null
    : null;
  const currentProductSectionId = currentProductRoute ? PRODUCT_SECTION_ID_BY_ROUTE[currentProductRoute] || null : null;

  // Core Platform States
  const [activeTab, setActiveTab] = useState<ActiveTab>(currentLabTestsRoute ? 'lab-tests' : currentServiceRoute ? 'services' : currentProductRoute ? 'products' : 'home');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(currentLabTestsSectionId || currentServiceSectionId || currentProductSectionId);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('medziva_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState(() =>
    typeof window !== 'undefined' ? String(localStorage.getItem('medziva_search_query') || '') : ''
  );
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedHistory = JSON.parse(localStorage.getItem('medziva_search_history') || '[]');
      return Array.isArray(savedHistory)
        ? savedHistory.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  });
  const [customLabSearch, setCustomLabSearch] = useState('');
  const [labTestsAtHomeSearch, setLabTestsAtHomeSearch] = useState('');

  useEffect(() => {
    if (searchQuery) {
      localStorage.setItem('medziva_search_query', searchQuery);
    } else {
      localStorage.removeItem('medziva_search_query');
    }
  }, [searchQuery]);

  useEffect(() => {
    localStorage.setItem('medziva_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('medziva_cart', JSON.stringify(cart));
  }, [cart]);

  // Drawer & Overlay Triggers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [isRentalOpen, setIsRentalOpen] = useState(false);
  const [selectedRentalProduct, setSelectedRentalProduct] = useState<any>(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Auto-redirect to My Bookings after 3 seconds
  useEffect(() => {
    if (showBookingSuccess) {
      const timer = setTimeout(() => {
        setShowBookingSuccess(false);
        setIsProfileOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBookingSuccess]);

  // Prefilled parameters for home visiting scheduler selection
  const [preselectedServiceTitle, setPreselectedServiceTitle] = useState('');
  const [preselectedPrice, setPreselectedPrice] = useState(0);
  const [bookingIsLabTest, setBookingIsLabTest] = useState(false);
  const [preselectedEnquiryServiceTitle, setPreselectedEnquiryServiceTitle] = useState('');

  // Authenticated profile state is kept in memory so personal data is not exposed in browser storage.
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState<string>('');
  const [loggedInUserPhone, setLoggedInUserPhone] = useState<string>('');
  const [loggedInUserAddress, setLoggedInUserAddress] = useState<string>('');

  useEffect(() => {
    if (!loggedInUserEmail) return undefined;
    return subscribeToNotifications((payload) => {
      const message = String(payload.message || 'You have a new MedZiva notification.');
      toast.success(message);
    });
  }, [loggedInUserEmail]);

  useEffect(() => {
    localStorage.removeItem('medziva_user_name');
    localStorage.removeItem('medziva_user_email');
    localStorage.removeItem('medziva_user_phone');
    localStorage.removeItem('medziva_user_address');
  }, []);

  useEffect(() => {
    const restoreCustomerSession = async () => {
      try {
        const token = localStorage.getItem('medziva_user_token');
        if (!token) return;
        const data = await api.get<{ user?: { role?: string; fullName?: string; email?: string; phone?: string; address?: string } }>('/api/auth/session');
        if (data?.user?.role !== 'customer') return;
        setLoggedInUser(data.user.fullName || '');
        setLoggedInUserEmail(data.user.email || '');
        setLoggedInUserPhone(data.user.phone || '');
        setLoggedInUserAddress(data.user.address || '');
      } catch {
        localStorage.removeItem('medziva_user_token');
      }
    };
    restoreCustomerSession();
  }, []);

  // Success Feedback state variables
  const [providerApplied, setProviderApplied] = useState(false);
  const [providerSpecializations, setProviderSpecializations] = useState<string[]>([]);
  const [providerName, setProviderName] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [providerEmail, setProviderEmail] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [serviceDetails, setServiceDetails] = useState<HealthcareService | null>(null);

  // Toast / Copy notification states
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Reactive ERP states loaded from back-end
  const [db, setDb] = useState<{
    categories: any[];
    products: any[];
    services: any[];
  }>({
    categories: SERVICE_CATEGORIES,
    products: PRODUCTS,
    services: HEALTHCARE_SERVICES,
  });

  const fetchDb = useCallback(async () => {
    try {
      const [catRes, srvRes] = await Promise.all([
        api.get<any[]>('/api/categories'),
        api.get<any[]>('/api/services'),
      ]);
      if (catRes && catRes.length > 0) setDb(prev => ({ ...prev, categories: catRes }));
      if (srvRes && srvRes.length > 0) {
        const liveServices = srvRes
          .map(resolveHealthcareServiceImage);
          const normalizeTitle = (t: string) => (t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
          const liveIds = new Set(liveServices.map((s: any) => s.id));
          const liveKeys = new Set(liveServices.map((s: any) => `${normalizeTitle(s.title)}|${s.category || ''}|${s.subcategory || ''}`));
          setDb(prev => ({
            ...prev,
            services: [
              ...prev.services.filter(s => !liveIds.has(s.id) && !liveKeys.has(`${normalizeTitle(s.title)}|${s.category || ''}|${s.subcategory || ''}`)),
              ...liveServices,
            ],
        }));
      }
    } catch (e) {
      console.error('Error fetching service data:', e);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDb();
  }, [fetchDb]);

  useEffect(() => {
    if (activeTab !== 'search-results') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery('');
    }
    setCustomLabSearch('');
    setLabTestsAtHomeSearch('');
    if (currentLabTestsRoute && LAB_TESTS_SECTION_ID_BY_ROUTE[currentLabTestsRoute]) {
      setActiveTab('lab-tests');
      setActiveSectionId(LAB_TESTS_SECTION_ID_BY_ROUTE[currentLabTestsRoute]);
      return;
    }
    if (currentServiceRoute && SERVICE_SECTION_ID_BY_ROUTE[currentServiceRoute]) {
      setActiveTab('services');
      setActiveSectionId(SERVICE_SECTION_ID_BY_ROUTE[currentServiceRoute]);
      return;
    }
    if (currentProductRoute && PRODUCT_SECTION_ID_BY_ROUTE[currentProductRoute]) {
      setActiveTab('products');
      setActiveSectionId(PRODUCT_SECTION_ID_BY_ROUTE[currentProductRoute]);
      return;
    }
    if (location.pathname === '/') {
      if (activeTab === 'services' || activeTab === 'products') {
        setActiveTab('home');
        setActiveSectionId(null);
      }
    }
  }, [currentLabTestsRoute, currentServiceRoute, currentProductRoute, location.pathname]);

  // ── Toast helper ──────────────────────────────────────────────────────

  const triggerToast = useCallback((msg: string) => {
    toast.success(msg);
  }, []);

  // ── Computed / Derived data ───────────────────────────────────────────

  const filteredServices = useMemo(() => {
    return db.services;
  }, [db.services]);

  const filteredProducts = useMemo(() => {
    return db.products;
  }, [db.products]);

  const displayedProducts = useMemo(() => {
    if (!currentProductRoute) return filteredProducts;
    const category = PRODUCT_CATEGORY_BY_ROUTE[currentProductRoute];
    if (!category) return filteredProducts;
    return filteredProducts.filter((product) => product.category === category || product.subcategory === currentProductRoute);
  }, [currentProductRoute, filteredProducts]);

  const homeHealthcareCategories = useMemo(() => {
    const categoriesBySlug = new Map<string, ServiceCategory>(
      SERVICE_CATEGORIES.map((category) => [category.slug, category as ServiceCategory]),
    );
    db.categories
      .filter((category) => category.slug !== 'service')
      .forEach((category) => {
        const existing = categoriesBySlug.get(category.slug);
        categoriesBySlug.set(category.slug, {
          ...(category as ServiceCategory),
          image: existing?.image || (category as ServiceCategory).image || '',
        } as ServiceCategory);
      });
    HOME_ADDITIONAL_HEALTHCARE_CATEGORIES.forEach((category) => {
      const existingCategory = categoriesBySlug.get(category.slug);
      const matchingService = db.services.find(
        (service) => service.category === category.slug || service.subcategory === category.slug,
      );
      const catImage = (category as any).image;
      categoriesBySlug.set(category.slug, {
        ...existingCategory,
        ...category,
        image:
          catImage ||
          existingCategory?.image ||
          matchingService?.image ||
          '',
      });
    });
    return Array.from(categoriesBySlug.values());
  }, [db.categories, db.services]);

  const homeHealthcareServices = useMemo<HealthcareService[]>(() => {
    const normalizedServices = db.services.map((service) =>
      service.category === 'long-term-care' || service.subcategory === 'long-term-care'
        ? normalizeLongTermServiceSlashSpacing(service)
        : service,
    );
    const rentalEquipment = db.products
      .filter(
        (product) =>
          product.category === 'rent-medical-equipment',
      )
      .map((product) => ({
        id: product.id,
        title: product.name,
        category: 'rent-medical-equipment',
        subcategory: '',
        price: product.price,
        originalPrice: product.originalPrice,
        duration: 'Weekly / Monthly Rental',
        image: product.image,
        description: product.description || product.subtitle,
        shortDescription: product.subtitle,
        popular: false,
        bookingNotice: '12 hours prior booking',
        remarks: 'Available across the UAE except Abu Dhabi.',
        attributes: product.attributes,
        vendorPrices: product.vendorPrices,
      }));
    const serviceIds = new Set(normalizedServices.map((service) => service.id));
    return [
      ...normalizedServices,
      ...rentalEquipment.filter((product) => !serviceIds.has(product.id)),
    ];
  }, [db.products, db.services]);

  const nursingServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'home-healthcare'),
    [filteredServices],
  );

  const placeVentilatorCareAfterLessThan12Hours = (services: HealthcareService[]) => {
    const itemId = 'srv-longterm-dha-ventillator-trach-peg-24-hours-30-days';
    const afterId = 'srv-longterm-dha-nurse-less-than-12-hours-per-day';
    const itemIndex = services.findIndex((srv) => srv.id === itemId);
    const afterIndex = services.findIndex((srv) => srv.id === afterId);
    if (itemIndex === -1 || afterIndex === -1) return services;
    const nextServices = [...services];
    const [item] = nextServices.splice(itemIndex, 1);
    const nextAfterIndex = nextServices.findIndex((srv) => srv.id === afterId);
    nextServices.splice(nextAfterIndex + 1, 0, item);
    return nextServices;
  };

  const longTermServices = useMemo(
    () =>
      placeVentilatorCareAfterLessThan12Hours(
          filteredServices
            .filter((srv) => srv.category === 'home-healthcare' && srv.subcategory === 'long-term-specialized-care')
          .map(normalizeLongTermServiceSlashSpacing),
      ),
    [filteredServices],
  );

  const physioServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'home-healthcare' && srv.subcategory === 'physiotherapy-at-home'),
    [filteredServices],
  );

  const doctorServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'home-healthcare' && srv.subcategory === 'doctor-on-call'),
    [filteredServices],
  );

  const speechServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'home-healthcare' && srv.subcategory === 'speech-and-language-therapy'),
    [filteredServices],
  );

  const occupationalServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'home-healthcare' && srv.subcategory === 'occupational-therapy'),
    [filteredServices],
  );

  const ivServices = useMemo(
    () => filteredServices.filter((srv) => srv.category === 'home-healthcare' && srv.subcategory === 'iv-therapy'),
    [filteredServices],
  );

  const displayedLabServices = useMemo(() => {
    if (activeSectionId === 'customize-lab-package-section') {
      const customizeServices = db.services.filter((service) =>
        service.subcategory === 'customize-lab-package' &&
        (service.category === 'lab-tests-at-home' || service.category === 'lab-tests')
      );
      const query = customLabSearch.trim().toLowerCase();
      if (!query) return customizeServices;
      return customizeServices.filter((service) => {
        const testCode = Array.isArray(service.attributes) ? service.attributes.find((item: any) => item.label === 'Test Code')?.value || '' : '';
        const attrText = Array.isArray(service.attributes)
          ? service.attributes.map((a: any) => `${a.label || ''} ${a.value || ''}`).join(' ').toLowerCase()
          : '';
        return (
          String(service.title || '').toLowerCase().includes(query) ||
          String(service.description || '').toLowerCase().includes(query) ||
          String(testCode).toLowerCase().includes(query) ||
          attrText.includes(query)
        );
      });
    }
    if (!currentLabTestsRoute) return [];
    const categoryServices = db.services.filter((service) => service.category === 'lab-tests-at-home' && service.subcategory === currentLabTestsRoute);
    const query = labTestsAtHomeSearch.trim().toLowerCase();
    if (!query) return categoryServices;
    return categoryServices.filter((service) => {
      const attributeText = (service.attributes || [])
        .map((item: any) => `${item.label || ''} ${item.value || ''}`)
        .join(' ');
      return (
        String(service.title || '').toLowerCase().includes(query) ||
        String(service.description || '').toLowerCase().includes(query) ||
        attributeText.toLowerCase().includes(query)
      );
    });
  }, [activeSectionId, currentLabTestsRoute, customLabSearch, labTestsAtHomeSearch, db.services]);

  // ── Utility functions used in rendering ───────────────────────────────

  const getServiceAttributeValue = (srv: HealthcareService, label: string) => {
    const attributes = srv.attributes;
    if (Array.isArray(attributes)) {
      return attributes.find((item: any) => item.label === label)?.value;
    }
    if (attributes && typeof attributes === 'object') {
      const key = label
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[A-Z]/, (char) => char.toLowerCase());
      const snakeKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return (attributes as Record<string, any>)[key] || (attributes as Record<string, any>)[snakeKey] || (attributes as Record<string, any>)[label];
    }
    return undefined;
  };

  const getVisibleServiceDetailAttributes = (srv: HealthcareService) =>
    [
      ['Key Ingredients', getServiceAttributeValue(srv, 'Key Ingredients')],
      ['Clinical Benefits', getServiceAttributeValue(srv, 'Clinical Benefits')],
      ['Who is it for?', getServiceAttributeValue(srv, 'Who is it for?')],
      ['Preparation', getServiceAttributeValue(srv, 'Preparation')],
      ['Results Time', getServiceAttributeValue(srv, 'Results Time')],
      ['Disclaimer', getServiceAttributeValue(srv, 'Disclaimer')],
      ['Inclusions', Array.isArray(srv.inclusions) && srv.inclusions.length > 0 ? srv.inclusions.join(', ') : undefined],
    ].filter(([, value]) => value != null);

  const hasExtraDetails = (srv: HealthcareService) =>
    getVisibleServiceDetailAttributes(srv).length > 0 ||
    Boolean(srv.fullDescription && srv.fullDescription !== srv.description) ||
    Boolean(srv.inclusions?.length) ||
    Boolean(srv.preparationInstructions) ||
    Boolean(srv.whoIsItFor) ||
    Boolean(srv.availability);

  const getVisibleLabAttributes = (srv: HealthcareService) =>
    (srv.attributes || []).filter((item: any) =>
      !['Excel Row', 'Category', 'Collection', 'Coverage'].includes(item.label) && item.value,
    );

  const getServiceImageClassName = (_srv: HealthcareService) => 'w-full h-full object-cover';

  const getServiceImage = (srv: HealthcareService) =>
    resolveHealthcareServiceImage(srv).image || DEFAULT_HEALTHCARE_SERVICE_IMAGE;


  // ── Cart Interactions ─────────────────────────────────────────────────

  const handleAddToCart = useCallback((product: Product | HealthcareService) => {
    if ('enquiryOnly' in product && product.enquiryOnly) return;
    const existing = cart.find((it) => it.product.id === product.id);
    setCart((prevCart) =>
      existing
        ? prevCart.map((it) =>
            it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
          )
        : [...prevCart, { product, quantity: 1 }]
    );
    if (existing) {
      triggerToast('Item quantity updated in cart');
      return;
    }
    triggerToast('Added to cart');
  }, [cart, triggerToast]);

  const handleUpdateCartQty = useCallback((productId: string, qty: number) => {
    setCart((prevCart) =>
      prevCart.map((it) => (it.product.id === productId ? { ...it, quantity: qty } : it))
    );
  }, []);

  const handleRemoveCartItem = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((it) => it.product.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.quantity, 0);
  }, [cart]);

  // ── Booking / Enquiry triggers ────────────────────────────────────────

  const triggerServiceBooking = useCallback((serviceTitle: string, price: number, isLabTest?: boolean) => {
    if (!loggedInUser) {
      triggerToast('Please log in with your customer account first to proceed with booking.');
      setIsAuthOpen(true);
      return;
    }
    setPreselectedServiceTitle(serviceTitle);
    setPreselectedPrice(price);
    setBookingIsLabTest(isLabTest || false);
    setIsBookingOpen(true);
  }, [loggedInUser, triggerToast]);

  const triggerRentalBooking = useCallback((product: any) => {
    if (!loggedInUser) {
      triggerToast('Please log in with your customer account first to proceed with booking.');
      setIsAuthOpen(true);
      return;
    }
    setSelectedRentalProduct(product);
    setIsRentalOpen(true);
  }, [loggedInUser, triggerToast]);

  const triggerServiceEnquiry = useCallback((serviceTitle: string) => {
    setPreselectedEnquiryServiceTitle(serviceTitle);
    setIsEnquiryOpen(true);
  }, []);

  const triggerCustomServiceRequest = useCallback(() => {
    setPreselectedEnquiryServiceTitle('Custom Service Request');
    setIsEnquiryOpen(true);
  }, []);

  // ── Tab / navigation handler ──────────────────────────────────────────

  const handleTabChange = useCallback((tab: ActiveTab, sectionId?: string) => {
    if (tab === 'services') {
      const targetSectionId = sectionId || 'home-healthcare-section';
      const targetRoute = SERVICE_ROUTE_BY_SECTION_ID[targetSectionId] || DEFAULT_SERVICE_ROUTE;
      setActiveTab('services');
      setActiveSectionId(targetSectionId);
      navigate(`/services/${targetRoute}`);
      return;
    }
    if (tab === 'products') {
      const targetSectionId = sectionId || 'rent-medical-equipments-section';
      const targetRoute = PRODUCT_ROUTE_BY_SECTION_ID[targetSectionId] || DEFAULT_PRODUCT_ROUTE;
      setActiveTab('products');
      setActiveSectionId(targetSectionId);
      navigate(`/products/${targetRoute}`);
      return;
    }
    if (tab === 'lab-tests' || tab === 'health-packages') {
      if (sectionId === 'customize-lab-package-section') {
        setActiveTab('lab-tests');
        setActiveSectionId(sectionId);
        navigate('/');
        window.setTimeout(() => {
          const section = document.getElementById(sectionId);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 80);
        return;
      }
      const targetSectionId = sectionId || 'routine-blood-tests-section';
      const targetRoute = LAB_TESTS_ROUTE_BY_SECTION_ID[targetSectionId] || DEFAULT_LAB_TESTS_ROUTE;
      setActiveTab('lab-tests');
      setActiveSectionId(targetSectionId);
      navigate(`${LAB_TESTS_AT_HOME_ROUTE_PREFIX}/${targetRoute}`);
      return;
    }
    setActiveTab(tab);
    setActiveSectionId(sectionId || null);
    navigate('/');
    if (!sectionId) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
      return;
    }
    window.setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  }, [navigate]);

  // ── Search ────────────────────────────────────────────────────────────

  const handleGlobalSearch = useCallback((submittedQuery: string) => {
    const normalizedSearch = submittedQuery.trim();
    const query = normalizedSearch.toLowerCase();
    if (!query) {
      triggerToast('Enter a search term.');
      return;
    }
    setSearchQuery(normalizedSearch);
    setSearchHistory((current) => [
      normalizedSearch,
      ...current.filter((item) => typeof item === 'string' && item.toLowerCase() !== query),
    ].slice(0, 8));
    setActiveTab('search-results');
    setActiveSectionId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [triggerToast]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { services: [], products: [], customLabs: [] };

    const matchService = (s: any) => {
      const title = String(s.title || '').toLowerCase();
      const desc = String(s.description || '').toLowerCase();
      const shortDesc = String(s.shortDescription || '').toLowerCase();
      const attrs = Array.isArray(s.attributes) ? s.attributes : [];
      const testCode = attrs.find((a: any) => a.label === 'Test Code')?.value || '';
      const includedTests = attrs.find((a: any) => /include|test|parameter|marker/i.test(a.label))?.value || '';
      return (
        title.includes(query) ||
        desc.includes(query) ||
        shortDesc.includes(query) ||
        String(testCode).toLowerCase().includes(query) ||
        String(includedTests).toLowerCase().includes(query)
      );
    };

    const matchProduct = (p: any) => {
      return (
        String(p.name || '').toLowerCase().includes(query) ||
        String(p.subtitle || '').toLowerCase().includes(query) ||
        String(p.description || '').toLowerCase().includes(query) ||
        String(p.brand || '').toLowerCase().includes(query)
      );
    };

    const allMatching = db.services.filter(matchService);
    const customLabs = allMatching.filter((s: any) => s.category === 'lab-tests' && s.subcategory === 'customize-lab-package');
    const services = allMatching.filter((s: any) => !(s.category === 'lab-tests' && s.subcategory === 'customize-lab-package'));

    return {
      services,
      products: db.products.filter(matchProduct),
      customLabs,
    };
  }, [searchQuery, db.services, db.products]);

  // ── Copy coupon ───────────────────────────────────────────────────────

  const copyCouponCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => {
      setCopiedCoupon(null);
    }, 2000);
  }, []);

  // ── Dynamic SEO per tab/page ──────────────────────────────────────────

  const seoData = useMemo(() => {
    if (activeTab === 'services' && currentServiceRoute) {
      const routeLabels: Record<string, { title: string; desc: string }> = {
        'nursing-care-at-home': { title: 'Nursing Care at Home', desc: 'Professional nursing support delivered at the comfort of your home, including routine nurse visits, wound dressing, catheterisation, and prescription-based IV antibiotic administration.' },
        'long-term-specialized-care': { title: 'Long-Term / Specialized Care', desc: 'Dedicated nursing support at home for long-term and specialized care needs, including ongoing monitoring, chronic condition management, and personalized patient assistance.' },
        'physiotherapy-at-home': { title: 'Physiotherapy at Home', desc: 'Professional physiotherapy sessions delivered at the comfort of your home, including rehabilitation support, mobility improvement, pain management, and recovery-focused exercises.' },
        'doctor-on-call': { title: 'Doctor on Call', desc: 'Convenient medical consultations at your home with qualified doctors providing assessment, advice, treatment guidance, and follow-up care.' },
        'speech-and-language-therapy': { title: 'Speech and Language Therapy', desc: 'Specialized therapy at home to support speech, communication, language development, and swallowing difficulties through personalized care plans.' },
        'occupational-therapy': { title: 'Occupational Therapy', desc: 'Personalized therapy at home to improve daily living skills, independence, mobility, and functional abilities through tailored rehabilitation programs.' },
        'iv-therapy': { title: 'IV Therapy', desc: 'Professional IV therapy administered at home under medical guidance, offering convenient access to prescribed treatments, hydration support, and wellness infusions.' },
      };
      const data = routeLabels[currentServiceRoute] || { title: 'Healthcare Services', desc: SITE_DEFAULT_DESCRIPTION };
      return { title: data.title, description: data.desc, canonicalPath: `/services/${currentServiceRoute}` };
    }
    if (activeTab === 'lab-tests') {
      return { title: 'Lab Tests at Home', description: 'Book lab tests at home in Dubai. Routine blood tests, preventive health packages, STD screening, and genetic testing with home sample collection.', canonicalPath: '/services/lab-tests-at-home' };
    }
    if (activeTab === 'products') {
      return { title: 'Medical Equipment', description: 'Rent certified medical equipment in Dubai. Hospital beds, oxygen concentrators, wheelchairs, BP monitors, and more.', canonicalPath: '/products' };
    }
    if (activeTab === 'wellness') {
      return { title: 'Other Services', description: 'Medical tourism facilitation and medical support for shipping crew members in Dubai and Sharjah.' };
    }
    if (activeTab === 'providers') {
      return { title: 'For Healthcare Providers', description: 'Join MedZiva\'s premium healthcare network. Register as a provider to offer home healthcare, lab tests, and medical services.' };
    }
    if (activeTab === 'support') {
      return { title: 'Help & Support', description: 'Customer support and FAQs center for bookings, cancellations, payments, accounts, and services.' };
    }
    if (activeTab === 'offers') {
      return { title: 'Offers & Promotions', description: 'Exclusive healthcare deals, promo codes, and seasonal offers from MedZiva.' };
    }
    if (activeTab === 'privacy') {
      return { title: 'Privacy Policy', description: 'MedZiva privacy policy — how we collect, use, and protect your personal and health data.' };
    }
    if (activeTab === 'terms') {
      return { title: 'Terms & Conditions', description: 'MedZiva terms and conditions for using our healthcare marketplace platform.' };
    }
    if (activeTab === 'about') {
      return { title: 'About Us', description: 'MedZiva International Healthcare L.L.C — premium healthcare marketplace in Dubai connecting patients with DHA compliant providers.', canonicalPath: '/about' };
    }
    return { title: 'Home', description: SITE_DEFAULT_DESCRIPTION, canonicalPath: '/' };
  }, [activeTab, currentServiceRoute]);

  useSEO(seoData);

  // ── Logout handler ────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    setLoggedInUser(null);
    setLoggedInUserEmail('');
    setLoggedInUserPhone('');
    setLoggedInUserAddress('');
    setCart([]);
    localStorage.removeItem('medziva_user_token');
    api.post('/api/auth/logout').catch(() => undefined);
    localStorage.removeItem('medziva_user_name');
    localStorage.removeItem('medziva_user_email');
    localStorage.removeItem('medziva_user_phone');
    localStorage.removeItem('medziva_user_address');
    toast.success('Logged out successfully.');
  }, []);

  // ── Return everything ─────────────────────────────────────────────────

  return {
    // Navigation
    navigate,
    location,

    // Core state
    activeTab,
    setActiveTab,
    activeSectionId,
    setActiveSectionId,
    cart,
    setCart,
    cartTotalItems,
    searchQuery,
    setSearchQuery,
    searchHistory,
    setSearchHistory,
    customLabSearch,
    setCustomLabSearch,
    labTestsAtHomeSearch,
    setLabTestsAtHomeSearch,

    // Drawer & Overlay triggers
    isCartOpen,
    setIsCartOpen,
    isBookingOpen,
    setIsBookingOpen,
    isAuthOpen,
    setIsAuthOpen,
    isEnquiryOpen,
    setIsEnquiryOpen,
    isRentalOpen,
    setIsRentalOpen,
    selectedRentalProduct,
    setSelectedRentalProduct,
    showBookingSuccess,
    setShowBookingSuccess,

    // Prefill params
    preselectedServiceTitle,
    setPreselectedServiceTitle,
    preselectedPrice,
    setPreselectedPrice,
    bookingIsLabTest,
    setBookingIsLabTest,
    preselectedEnquiryServiceTitle,
    setPreselectedEnquiryServiceTitle,

    // Auth & profile
    loggedInUser,
    setLoggedInUser,
    loggedInUserEmail,
    setLoggedInUserEmail,
    loggedInUserPhone,
    setLoggedInUserPhone,
    loggedInUserAddress,
    setLoggedInUserAddress,
    isProfileOpen,
    setIsProfileOpen,

    // Provider/support feedback
    providerApplied,
    setProviderApplied,
    providerSpecializations,
    setProviderSpecializations,
    providerName,
    setProviderName,
    providerPhone,
    setProviderPhone,
    providerEmail,
    setProviderEmail,
    supportSubmitted,
    setSupportSubmitted,
    supportName,
    setSupportName,
    supportEmail,
    setSupportEmail,
    supportMessage,
    setSupportMessage,
    serviceDetails,
    setServiceDetails,

    // Toast / coupon
    triggerToast,
    copiedCoupon,
    setCopiedCoupon,

    // DB
    db,

    // Route info
    currentLabTestsRoute,
    currentLabTestsSectionId,
    currentServiceRoute,
    currentServiceSectionId,
    currentProductRoute,
    currentProductSectionId,

    // Derived data
    filteredServices,
    filteredProducts,
    displayedProducts,
    homeHealthcareCategories,
    homeHealthcareServices,
    nursingServices,
    longTermServices,
    physioServices,
    doctorServices,
    speechServices,
    occupationalServices,
    ivServices,
    displayedLabServices,
    searchResults,

    // Utility functions
    getServiceAttributeValue,
    getVisibleServiceDetailAttributes,
    getVisibleLabAttributes,
    hasExtraDetails,
    getServiceImage,
    getServiceImageClassName,

    // Handlers
    handleAddToCart,
    handleUpdateCartQty,
    handleRemoveCartItem,
    handleClearCart,
    triggerServiceBooking,
    triggerRentalBooking,
    triggerServiceEnquiry,
    triggerCustomServiceRequest,
    handleTabChange,
    handleGlobalSearch,
    copyCouponCode,
    handleLogout,

    // SEO
    seoData,
  };
}
