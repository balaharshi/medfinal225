import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
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
import { BOOKING_STATUSES, DEFAULT_SETTINGS_KEY, ENQUIRY_STATUSES } from '../constants/index.js';
import { slugify } from '../utils/slug.js';
import { HttpError } from '../utils/httpError.js';
import { nextSequentialId } from '../utils/sequentialId.js';
import {
  ensureVendorServiceEnabled,
  getEnabledVendorServices,
} from './vendorServiceAssignmentService.js';

const defaultImage = 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400';

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
  services: await getServices(),
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
      brand: payload.brand || 'Medziva Store',
      rating: Number(payload.rating || 5),
      inStock: payload.inStock !== undefined ? payload.inStock : true,
      description: payload.description || '',
      attributes: Array.isArray(payload.attributes) ? payload.attributes : [],
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

export const getServices = async () => db.select().from(services);

export const createService = async (payload) => {
  const [service] = await db
    .insert(services)
    .values({
      id: await nextSequentialId(services, 'srv'),
      title: payload.title,
      category: payload.category || 'home-healthcare',
      subcategory: payload.subcategory || '',
      price: Number(payload.price || 0),
      duration: payload.duration || '1 Hour',
      image: payload.image || defaultImage,
      description: payload.description || '',
      popular: payload.popular !== undefined ? payload.popular : false,
      enquiryOnly: payload.enquiryOnly !== undefined ? payload.enquiryOnly : false,
      attributes: Array.isArray(payload.attributes) ? payload.attributes : [],
      vendorPrices: Array.isArray(payload.vendorPrices) ? payload.vendorPrices : [],
    })
    .returning();
  return service;
};

export const updateService = async (id, payload) => {
  const [service] = await db
    .update(services)
    .set({
      ...payload,
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      attributes: Array.isArray(payload.attributes) ? payload.attributes : undefined,
      vendorPrices: Array.isArray(payload.vendorPrices) ? payload.vendorPrices : undefined,
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
      notes: payload.notes || '',
    })
    .returning();
  return booking;
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
    siteName: 'Medziva Home Healthcare',
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
