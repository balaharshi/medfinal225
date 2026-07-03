import { and, asc, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  bookings,
  categories,
  enquiries,
  products,
  services,
  settings,
  subcategories,
  users,
  vendors,
} from '../db/schema/index.js';
import { BOOKING_STATUSES, DEFAULT_SETTINGS_KEY, ENQUIRY_STATUSES, PAYMENT_STATUSES } from '../constants/index.js';
import { slugify } from '../utils/slug.js';
import { HttpError } from '../utils/httpError.js';
import { nextSequentialId } from '../utils/sequentialId.js';
import {
  ensureVendorServiceEnabled,
  getEnabledVendorServices,
} from './vendorServiceAssignmentService.js';

const defaultImage = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400';
const IV_THERAPY_ALLOWED_IDS = new Set([
  'srv-iv-skin-glow',
  'srv-iv-hair-skin-nail-care',
  'srv-iv-energy-weight-loss',
  'srv-iv-immune-hydration-drip',
  'srv-iv-antistress-relax',
  'srv-iv-gut-cleanse-acne-cure',
  'srv-iv-memory-boost',
  'srv-iv-surgery-recovery',
  'srv-iv-women-health-fertilty',
  'srv-iv-men-power-drip',
  'srv-iv-liver-detox-after-party',
  'srv-iv-nad-100',
  'srv-iv-nad-250',
  'srv-iv-nad-500',
]);

const withSubcategories = async (categoryRows) => {
  const subRows = await db.select().from(subcategories);
  return categoryRows.map((category) => ({
    ...category,
    subcategories: subRows
      .filter((sub) => sub.categoryId === category.id)
      .map(({ categoryId, createdAt, updatedAt, ...sub }) => sub),
  }));
};

export const getDatabase = async () => ({
  categories: await getCategories(),
  products: await getProducts(),
  services: await getServices({ includeHidden: true }),
  vendors: await getVendors(),
  settings: await getSettings(),
  bookings: await getBookings(),
  enquiries: await getEnquiries(),
});

export const getCategories = async () => withSubcategories(await db.select().from(categories));

export const createCategory = async (payload) => {
  const slug = slugify(payload.title);
  const [category] = await db
    .insert(categories)
    .values({
      id: await nextSequentialId(categories, 'cat'),
      title: payload.title,
      slug,
      image: payload.image || defaultImage,
      description: payload.description || '',
      type: payload.type || 'service',
    })
    .returning();
  return { ...category, subcategories: [] };
};

export const updateCategory = async (id, payload) => {
  const updates = {
    updatedAt: new Date(),
    ...(payload.title ? { title: payload.title, slug: slugify(payload.title) } : {}),
    ...(payload.image ? { image: payload.image } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.type ? { type: payload.type } : {}),
  };
  const [category] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
  if (!category) throw new HttpError(404, 'Category not found');
  const [withSubs] = await withSubcategories([category]);
  return withSubs;
};

export const deleteCategory = async (id) => {
  await db.delete(subcategories).where(eq(subcategories.categoryId, id));
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
  if (!deleted.length) throw new HttpError(404, 'Category not found');
  return { success: true, deleted };
};

export const createSubcategory = async (categoryId, payload) => {
  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!category) throw new HttpError(404, 'Parent category not found');
  const [subcategory] = await db
    .insert(subcategories)
    .values({
      id: await nextSequentialId(subcategories, 'sub'),
      categoryId,
      title: payload.title,
    })
    .returning();
  const { categoryId: _categoryId, createdAt, updatedAt, ...safeSubcategory } = subcategory;
  return safeSubcategory;
};

export const deleteSubcategory = async (categoryId, subcategoryId) => {
  const deleted = await db
    .delete(subcategories)
    .where(eq(subcategories.id, subcategoryId))
    .returning();
  if (!deleted.length || deleted[0].categoryId !== categoryId) throw new HttpError(404, 'Subcategory not found');
  return { success: true, deleted };
};

export const getProducts = async () => db.select().from(products);

export const createProduct = async (payload) => {
  const price = Number(payload.price || 0);
  const [product] = await db
    .insert(products)
    .values({
      id: await nextSequentialId(products, 'prod'),
      name: payload.name,
      subtitle: payload.subtitle || '',
      price,
      originalPrice: Number(payload.originalPrice || price),
      image: payload.image || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400',
      category: payload.category || 'devices-for-rent',
      subcategory: payload.subcategory || '',
      brand: payload.brand || 'MedZiva Store',
      rating: Number(payload.rating || 5),
      inStock: payload.inStock !== undefined ? payload.inStock : true,
      description: payload.description || '',
      attributes: (Array.isArray(payload.attributes) || (payload.attributes && typeof payload.attributes === 'object')) ? payload.attributes : [],
      vendorPrices: Array.isArray(payload.vendorPrices) ? payload.vendorPrices : [],
    })
    .returning();
  return product;
};

export const deleteProduct = async (id) => {
  const deleted = await db.delete(products).where(eq(products.id, id)).returning();
  if (!deleted.length) throw new HttpError(404, 'Product not found');
  return { success: true, deleted };
};

const toStringList = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split('\n')
      .flatMap((line) => line.split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeServicePayload = (payload, { partial = false } = {}) => {
  const updates = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(payload, key);
  const textValue = (key, fallback = '') => (partial && !has(key) ? undefined : (payload[key] || fallback));
  const assign = (key, value) => {
    if (!partial || value !== undefined) updates[key] = value;
  };

  assign('title', payload.title);
  assign('slug', has('slug') ? slugify(payload.slug) : (payload.title ? slugify(payload.title) : (partial ? undefined : '')));
  assign('category', textValue('category', 'home-healthcare'));
  assign('subcategory', textValue('subcategory'));
  assign('status', textValue('status', 'active'));
  assign('active', payload.active !== undefined ? Boolean(payload.active) : (partial ? undefined : true));
  assign('price', payload.price !== undefined ? Number(payload.price) : (partial ? undefined : 0));
  assign('originalPrice', payload.originalPrice !== undefined ? Number(payload.originalPrice) : (payload.price !== undefined ? Number(payload.price) : (partial ? undefined : 0)));
  assign('salePrice', payload.salePrice !== undefined ? Number(payload.salePrice) : (payload.price !== undefined ? Number(payload.price) : (partial ? undefined : 0)));
  assign('currency', textValue('currency', 'AED'));
  assign('homeVisitFeeIncluded', payload.homeVisitFeeIncluded !== undefined ? Boolean(payload.homeVisitFeeIncluded) : (partial ? undefined : true));
  assign('duration', textValue('duration', '1 Hour'));
  assign('estimatedVisitTime', textValue('estimatedVisitTime'));
  assign('image', textValue('image', defaultImage));
  assign('shortDescription', partial && !has('shortDescription') && !has('description') ? undefined : (payload.shortDescription || payload.description || ''));
  assign('fullDescription', partial && !has('fullDescription') && !has('description') ? undefined : (payload.fullDescription || payload.description || ''));
  assign('description', partial && !has('description') && !has('shortDescription') ? undefined : (payload.description || payload.shortDescription || ''));
  assign('inclusions', has('inclusions') ? (Array.isArray(payload.inclusions) ? payload.inclusions : toStringList(payload.inclusions)) : (partial ? undefined : []));
  assign('preparationInstructions', textValue('preparationInstructions'));
  assign('whoIsItFor', textValue('whoIsItFor'));
  assign('serviceLocation', textValue('serviceLocation', 'at-home'));
  assign('availability', textValue('availability'));
  assign('tags', has('tags') ? (Array.isArray(payload.tags) ? payload.tags : toStringList(payload.tags)) : (partial ? undefined : []));
  assign('displayPriority', payload.displayPriority !== undefined ? Number(payload.displayPriority) : (partial ? undefined : 100));
  assign('seoTitle', textValue('seoTitle'));
  assign('seoDescription', textValue('seoDescription'));
  assign('popular', payload.popular !== undefined ? Boolean(payload.popular) : (partial ? undefined : false));
  assign('enquiryOnly', payload.enquiryOnly !== undefined ? Boolean(payload.enquiryOnly) : (partial ? undefined : false));
  assign('attributes', (Array.isArray(payload.attributes) || (payload.attributes && typeof payload.attributes === 'object')) ? payload.attributes : (partial ? undefined : []));
  assign('vendorPrices', Array.isArray(payload.vendorPrices) ? payload.vendorPrices : (partial ? undefined : []));
  assign('bookingNotice', textValue('bookingNotice'));
  assign('remarks', textValue('remarks'));

  Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
  return updates;
};

export const getServices = async ({ includeHidden = false } = {}) => {
  const rows = await db
    .select()
    .from(services)
    .orderBy(asc(services.displayPriority), desc(services.updatedAt));

  const filteredRows = rows.filter((service) => {
    const isIvTherapy = service.category === 'iv-therapy' || service.subcategory === 'iv-therapy';
    return !isIvTherapy || IV_THERAPY_ALLOWED_IDS.has(service.id);
  });

  if (includeHidden) return filteredRows;

  return filteredRows.filter((service) => service.active && service.status === 'active');
};

export const createService = async (payload) => {
  const [service] = await db
    .insert(services)
    .values({
      id: await nextSequentialId(services, 'srv'),
      ...normalizeServicePayload(payload),
    })
    .returning();
  return service;
};

export const updateService = async (id, payload) => {
  const [service] = await db
    .update(services)
    .set({
      ...normalizeServicePayload(payload, { partial: true }),
      updatedAt: new Date(),
    })
    .where(eq(services.id, id))
    .returning();
  if (!service) throw new HttpError(404, 'Service not found');
  return service;
};

export const deleteService = async (id) => {
  const deleted = await db.delete(services).where(eq(services.id, id)).returning();
  if (!deleted.length) throw new HttpError(404, 'Service not found');
  return { success: true, deleted };
};

export const getVendors = async () => {
  const rows = await db.select().from(vendors);
  return rows.map(({ passwordHash, ...vendor }) => vendor);
};

export const getUsers = async () => {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  return rows.map(({ passwordHash, ...user }) => user);
};

export const createVendor = async (payload) => {
  const values = {
    id: payload.id || await nextSequentialId(vendors, 'v'),
    name: payload.name,
    type: payload.type || 'Pharmacy',
    email: payload.email || null,
    contact: payload.contact || '',
    rating: Number(payload.rating || 5),
    address: payload.address || 'Dubai',
    commission: Number(payload.commission || 10),
    active: payload.active !== undefined ? payload.active : true,
  };
  const [vendor] = await db.insert(vendors).values(values).returning();
  const { passwordHash, ...safeVendor } = vendor;
  return safeVendor;
};

export const updateVendor = async (id, payload) => {
  const [vendor] = await db
    .update(vendors)
    .set({
      ...payload,
      rating: payload.rating !== undefined ? Number(payload.rating) : undefined,
      commission: payload.commission !== undefined ? Number(payload.commission) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, id))
    .returning();
  if (!vendor) throw new HttpError(404, 'Vendor not found');
  const { passwordHash, ...safeVendor } = vendor;
  return safeVendor;
};

export const deleteVendor = async (id) => {
  const deleted = await db.delete(vendors).where(eq(vendors.id, id)).returning();
  if (!deleted.length) throw new HttpError(404, 'Vendor not found');
  return { success: true, deleted };
};

export const getBookings = async () => db.select().from(bookings).orderBy(desc(bookings.createdAt));

export const createBooking = async (payload) => {
  if (payload.vendorId && payload.serviceId) {
    await ensureVendorServiceEnabled(String(payload.vendorId), String(payload.serviceId));
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      id: await nextSequentialId(bookings, 'b'),
      customerName: payload.customerName,
      customerEmail: payload.customerEmail || 'guest@example.com',
      customerPhone: payload.customerPhone || '',
      serviceTitle: payload.serviceTitle,
      vendorName: payload.vendorName || 'Unassigned',
      vendorId: payload.vendorId || null,
      serviceId: payload.serviceId || null,
      price: Number(payload.price || 150),
      date: payload.date || new Date().toISOString().split('T')[0],
      timeSlot: payload.timeSlot || 'Flexible',
      region: payload.region || 'Dubai',
      status: payload.status || BOOKING_STATUSES.PENDING,
      paymentStatus: payload.paymentStatus || PAYMENT_STATUSES.UNPAID,
      paymentProvider: payload.paymentProvider || null,
      paymentAppUtr: payload.paymentAppUtr || null,
      paymentOrderId: payload.paymentOrderId || null,
      paymentTransactionUtr: payload.paymentTransactionUtr || null,
      paymentResponseStatus: payload.paymentResponseStatus || null,
      paidAt: payload.paidAt ? new Date(payload.paidAt) : null,
      notes: payload.notes || '',
    })
    .returning();
  return booking;
};

export const attachBookingPayment = async (bookingId, payment = {}) => {
  if (!bookingId) return null;

  const updates = {
    paymentStatus: payment.paymentStatus || PAYMENT_STATUSES.PENDING,
    paymentProvider: payment.paymentProvider || 'ENBDpay',
    paymentAppUtr: payment.paymentAppUtr || null,
    paymentOrderId: payment.paymentOrderId || null,
    paymentTransactionUtr: payment.paymentTransactionUtr || null,
    paymentResponseStatus: payment.paymentResponseStatus || null,
    updatedAt: new Date(),
  };

  const [booking] = await db.update(bookings).set(updates).where(eq(bookings.id, bookingId)).returning();
  return booking || null;
};

export const updateBookingPaymentStatus = async (payment = {}) => {
  const responseStatus = String(payment.responseStatus || payment.paymentResponseStatus || '').toUpperCase();
  const isPaid = ['CAPTURED', 'AUTHORIZED', 'PROCESSED', 'SUCCESS'].includes(responseStatus);
  const isFailed = ['FAILED', 'DECLINED', 'REJECTED', 'ERROR', 'AUTHORIZATION_DECLINED'].includes(responseStatus);
  const isCancelled = ['CANCELLED', 'CANCELED', 'VOIDED'].includes(responseStatus);
  const paymentStatus = isPaid
    ? PAYMENT_STATUSES.PAID
    : isCancelled
      ? PAYMENT_STATUSES.CANCELLED
      : isFailed
        ? PAYMENT_STATUSES.FAILED
        : PAYMENT_STATUSES.PENDING;

  const updates = {
    paymentStatus,
    paymentProvider: 'ENBDpay',
    paymentAppUtr: payment.appUtr || payment.paymentAppUtr || null,
    paymentOrderId: payment.orderId || payment.paymentOrderId || null,
    paymentTransactionUtr: payment.transactionUtr || payment.paymentTransactionUtr || null,
    paymentResponseStatus: responseStatus || null,
    paidAt: isPaid ? new Date() : null,
    updatedAt: new Date(),
  };

  const predicates = [];
  if (payment.bookingId) predicates.push(eq(bookings.id, payment.bookingId));
  if (updates.paymentAppUtr) predicates.push(eq(bookings.paymentAppUtr, updates.paymentAppUtr));
  if (updates.paymentTransactionUtr) predicates.push(eq(bookings.paymentTransactionUtr, updates.paymentTransactionUtr));
  if (updates.paymentOrderId) predicates.push(eq(bookings.paymentOrderId, updates.paymentOrderId));
  if (!predicates.length) return null;

  const [booking] = await db.update(bookings).set(updates).where(or(...predicates)).returning();
  return booking || null;
};

export const cancelBooking = async (id) => {
  const [booking] = await db
    .update(bookings)
    .set({ status: BOOKING_STATUSES.CANCELLED, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();
  if (!booking) throw new HttpError(404, 'Booking record not found');
  return { success: true, updated: booking };
};

export const updateBooking = async (id, payload) => {
  const [booking] = await db.update(bookings).set({ ...payload, updatedAt: new Date() }).where(eq(bookings.id, id)).returning();
  if (!booking) throw new HttpError(404, 'Booking record not found');
  return booking;
};

export const getVendorBookings = async (vendorId) => {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor) throw new HttpError(404, 'Vendor not found');

  const enabledServices = await getEnabledVendorServices(vendorId);
  const enabledServiceIds = enabledServices.map((service) => service.id);
  const visibilityRules = [
    eq(bookings.vendorId, vendorId),
    eq(bookings.vendorName, vendor.name),
  ];

  if (enabledServiceIds.length > 0 && vendor.active !== false) {
    visibilityRules.push(and(
      isNull(bookings.vendorId),
      eq(bookings.status, BOOKING_STATUSES.PENDING),
      inArray(bookings.serviceId, enabledServiceIds),
    ));
  }

  return db
    .select()
    .from(bookings)
    .where(or(...visibilityRules))
    .orderBy(desc(bookings.createdAt));
};

export const acceptVendorBooking = async (bookingId, vendorId) => {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor) throw new HttpError(404, 'Vendor not found');
  if (vendor.active === false) throw new HttpError(403, 'Inactive vendors cannot accept bookings');

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) throw new HttpError(404, 'Booking record not found');
  if (booking.vendorId) throw new HttpError(409, 'This booking has already been accepted by another vendor');
  if (booking.status !== BOOKING_STATUSES.PENDING) throw new HttpError(409, 'Only pending bookings can be accepted');
  if (!booking.serviceId) throw new HttpError(400, 'Booking is missing a service assignment');

  await ensureVendorServiceEnabled(String(vendorId), String(booking.serviceId));

  const [accepted] = await db
    .update(bookings)
    .set({
      vendorId,
      vendorName: vendor.name,
      status: BOOKING_STATUSES.ACTIVE,
      updatedAt: new Date(),
    })
    .where(and(
      eq(bookings.id, bookingId),
      isNull(bookings.vendorId),
      eq(bookings.status, BOOKING_STATUSES.PENDING),
    ))
    .returning();

  if (!accepted) throw new HttpError(409, 'This booking has already been accepted by another vendor');
  return accepted;
};

export const getVendorServices = async (vendorId) => {
  return getEnabledVendorServices(vendorId);
};

export const getVendorProfile = async (id) => {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
  if (!vendor) throw new HttpError(404, 'Vendor not found');
  const { passwordHash, ...safeVendor } = vendor;
  return safeVendor;
};

export const getEnquiries = async () => db.select().from(enquiries).orderBy(desc(enquiries.createdAt));

export const createEnquiry = async (payload) => {
  const [enquiry] = await db
    .insert(enquiries)
    .values({
      id: await nextSequentialId(enquiries, 'e'),
      customerName: payload.customerName,
      customerEmail: payload.customerEmail || 'guest@example.com',
      customerPhone: payload.customerPhone || 'N/A',
      serviceTitle: payload.serviceTitle || 'General Interest',
      message: payload.message,
      contactMethod: payload.contactMethod || null,
      date: payload.date || new Date().toISOString().split('T')[0],
      status: payload.status || ENQUIRY_STATUSES.PENDING_RESPONSE,
    })
    .returning();
  return enquiry;
};

export const updateEnquiryStatus = async (id, status) => {
  const [enquiry] = await db
    .update(enquiries)
    .set({ status: status || ENQUIRY_STATUSES.ANSWERED, updatedAt: new Date() })
    .where(eq(enquiries.id, id))
    .returning();
  if (!enquiry) throw new HttpError(404, 'Enquiry not found');
  return enquiry;
};

export const deleteEnquiry = async (id) => {
  const deleted = await db.delete(enquiries).where(eq(enquiries.id, id)).returning();
  if (!deleted.length) throw new HttpError(404, 'Enquiry not found');
  return { success: true, deleted };
};

export const getSettings = async () => {
  const [row] = await db.select().from(settings).where(eq(settings.key, DEFAULT_SETTINGS_KEY)).limit(1);
  return row || {
    siteName: 'MedZiva Home Healthcare',
    vatPercent: 5,
    platformFeePercent: 2.5,
    defaultCurrency: 'AED',
    supportEmail: 'support@medziva.ae',
    serviceRegions: ['Dubai', 'Sharjah'],
    maintenanceMode: false,
    adminUsername: 'admin',
  };
};

export const updateSettings = async (payload) => {
  const [row] = await db
    .insert(settings)
    .values({
      key: DEFAULT_SETTINGS_KEY,
      ...payload,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: { ...payload, updatedAt: new Date() },
    })
    .returning();
  return { success: true, settings: row };
};
