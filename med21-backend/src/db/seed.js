import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { eq } from 'drizzle-orm';
import { db } from './index.js';
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
} from './schema/index.js';
import { DEFAULT_SETTINGS_KEY, USER_ROLES } from '../constants/index.js';
import { hashPassword } from '../utils/password.js';
import { logger } from '../utils/logger.js';
import { nextSequentialId } from '../utils/sequentialId.js';
import { HOME_HEALTHCARE_CATEGORIES, HOME_HEALTHCARE_SERVICES } from '../../../shared/homeHealthcareCatalog.js';
import { LAB_TESTS_AT_HOME_SERVICES } from '../../../shared/labTestsAtHomeCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceDbPath = path.resolve(__dirname, '../../../med21/src/db.json');

const hasRows = async (table) => {
  const rows = await db.select().from(table).limit(1);
  return rows.length > 0;
};

const loadSeedData = () => {
  if (!fs.existsSync(sourceDbPath)) {
    logger.warn(`Seed source not found at ${sourceDbPath}`);
    return {};
  }
  return JSON.parse(fs.readFileSync(sourceDbPath, 'utf8'));
};

const mergeById = (baseRows = [], overrideRows = []) => {
  const merged = new Map();
  baseRows.forEach((row) => merged.set(row.id, row));
  overrideRows.forEach((row) => merged.set(row.id, row));
  return Array.from(merged.values());
};

export const seedDatabase = async () => {
  const seedData = loadSeedData();
  const data = {
    ...seedData,
    categories: mergeById(seedData.categories, HOME_HEALTHCARE_CATEGORIES),
    services: mergeById(
      mergeById(
        (seedData.services || []).filter((service) => service.category !== 'home-healthcare' && service.category !== 'lab-tests-at-home'),
        LAB_TESTS_AT_HOME_SERVICES,
      ),
      HOME_HEALTHCARE_SERVICES,
    ),
  };
  const categoryIdMap = new Map();
  const serviceIdMap = new Map();
  const vendorIdMap = new Map();

  if (Array.isArray(data.categories) && !(await hasRows(categories))) {
    await db.insert(categories).values(
      data.categories.map(({ subcategories: _subcategories, ...category }, index) => ({
        id: category.id || `cat-seed-${index + 1}`,
        title: category.title,
        image: category.image,
        slug: category.slug,
        type: category.type || 'service',
        description: category.description || '',
      })).map((category, index) => {
        categoryIdMap.set(data.categories[index].id, category.id);
        return category;
      }),
    );

    let subcategoryCounter = 1;
    const subs = data.categories.flatMap((category) =>
      (category.subcategories || []).map((subcategory) => ({
        id: subcategory.id || `sub-seed-${subcategoryCounter++}`,
        categoryId: categoryIdMap.get(category.id),
        title: subcategory.title,
      })),
    );
    if (subs.length) await db.insert(subcategories).values(subs);
  }

  if (Array.isArray(data.products) && !(await hasRows(products))) {
    await db.insert(products).values(
      data.products.map((product, index) => ({
        id: product.id || `prod-seed-${index + 1}`,
        name: product.name,
        subtitle: product.subtitle || '',
        price: Number(product.price || 0),
        originalPrice: Number(product.originalPrice || product.price || 0),
        image: product.image,
        category: product.category || 'devices-for-rent',
        subcategory: product.subcategory || '',
        brand: product.brand || 'MedZiva Store',
        rating: Number(product.rating || 5),
        inStock: product.inStock !== false,
        description: product.description || '',
        attributes: product.attributes || [],
        vendorPrices: product.vendorPrices || [],
      })),
    );
  }

  if (Array.isArray(data.services) && !(await hasRows(services))) {
    await db.insert(services).values(
      data.services.map((service, index) => ({
        id: service.id || `srv-seed-${index + 1}`,
        title: service.title,
        category: service.category || 'home-healthcare',
        subcategory: service.subcategory || '',
        price: Number(service.price || 0),
        duration: service.duration || '1 Hour',
        image: service.image,
        description: service.description || '',
        popular: !!service.popular,
        enquiryOnly: !!service.enquiryOnly,
        attributes: service.attributes || [],
        vendorPrices: service.vendorPrices || [],
        bookingNotice: service.bookingNotice || '',
        remarks: service.remarks || '',
      })).map((service, index) => {
        serviceIdMap.set(data.services[index].id, service.id);
        return service;
      }),
    );
  }

  if (Array.isArray(data.services)) {
    const ivServices = data.services.filter(
      (s) => (s.category === 'iv-therapy' || s.subcategory === 'iv-therapy') && s.attributes && Object.keys(s.attributes).length > 0
    );
    for (const svc of ivServices) {
      const updated = await db.update(services)
        .set({ attributes: svc.attributes, vendorPrices: svc.vendorPrices || [] })
        .where(eq(services.id, svc.id))
        .returning();
      if (updated.length === 0) {
        await db.update(services)
          .set({ attributes: svc.attributes, vendorPrices: svc.vendorPrices || [] })
          .where(eq(services.title, svc.title));
      }
    }
  }

  if (Array.isArray(data.vendors) && !(await hasRows(vendors))) {
    const vendorPasswordHash = await hashPassword('vendor123');
    await db.insert(vendors).values(
      data.vendors.map((vendor, index) => ({
        id: vendor.id || `v-seed-${index + 1}`,
        name: vendor.id === 'v-4' ? 'Vendor' : vendor.name,
        type: vendor.type || 'Pharmacy',
        email: vendor.id === 'v-4' ? 'vendor@medziva.ae' : null,
        contact: vendor.contact || '',
        rating: Number(vendor.rating || 5),
        address: vendor.address || 'Dubai',
        commission: Number(vendor.commission || 10),
        active: vendor.active !== false,
        passwordHash: vendor.id === 'v-4' ? vendorPasswordHash : null,
      })).map((vendor, index) => {
        vendorIdMap.set(data.vendors[index].id, vendor.id);
        return vendor;
      }),
    )
    .onConflictDoUpdate({
      target: vendors.email,
      set: {
        id: 'v-4',
        name: 'Vendor',
        type: 'Nursing Provider',
        contact: '+971 4 555 7788',
        rating: 5,
        address: 'Deira, Dubai',
        commission: 10,
        active: true,
        passwordHash: vendorPasswordHash,
        updatedAt: new Date(),
      },
    });
  }

  const [demoVendorRow] = await db.select().from(vendors).where(eq(vendors.email, 'vendor@medziva.ae')).limit(1);
  if (demoVendorRow) {
    const vendorUserId = await nextSequentialId(users, 'u');
    await db
      .insert(users)
      .values({
        id: vendorUserId,
        email: 'vendor@medziva.ae',
        fullName: 'Vendor',
        passwordHash: await hashPassword('vendor123'),
        role: USER_ROLES.VENDOR,
        vendorId: demoVendorRow.id,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          fullName: 'Vendor',
          passwordHash: await hashPassword('vendor123'),
          role: USER_ROLES.VENDOR,
          vendorId: demoVendorRow.id,
          updatedAt: new Date(),
        },
      });
  }

  if (Array.isArray(data.bookings) && !(await hasRows(bookings))) {
    await db.insert(bookings).values(
      data.bookings.map((booking, index) => ({
        id: booking.id || `b-seed-${index + 1}`,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail || 'guest@example.com',
        customerPhone: booking.customerPhone || '',
        serviceTitle: booking.serviceTitle,
        vendorName: booking.vendorName || 'MedZiva Premium Provider',
        vendorId: booking.vendorId ? vendorIdMap.get(booking.vendorId) || booking.vendorId : null,
        serviceId: booking.serviceId ? serviceIdMap.get(booking.serviceId) || booking.serviceId : null,
        price: Number(booking.price || 0),
        date: booking.date || new Date().toISOString().split('T')[0],
        timeSlot: booking.timeSlot || 'Flexible',
        region: booking.region || 'Dubai',
        status: booking.status || 'Pending',
        notes: booking.notes || '',
        createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date(),
      })),
    );
  }

  if (Array.isArray(data.enquiries) && !(await hasRows(enquiries))) {
    await db.insert(enquiries).values(
      data.enquiries.map((enquiry, index) => ({
        id: enquiry.id || `e-seed-${index + 1}`,
        customerName: enquiry.customerName,
        customerEmail: enquiry.customerEmail || 'guest@example.com',
        customerPhone: enquiry.customerPhone || 'N/A',
        serviceTitle: enquiry.serviceTitle || 'General Interest',
        message: enquiry.message,
        date: enquiry.date || new Date().toISOString().split('T')[0],
        status: enquiry.status || 'Pending Response',
      })),
    );
  }

  const appSettings = data.settings || {};
  await db
    .insert(settings)
    .values({
      key: DEFAULT_SETTINGS_KEY,
      siteName: appSettings.siteName || 'MedZiva Home Healthcare',
      vatPercent: Number(appSettings.vatPercent || 5),
      platformFeePercent: Number(appSettings.platformFeePercent || 2.5),
      defaultCurrency: appSettings.defaultCurrency || 'AED',
      supportEmail: appSettings.supportEmail || 'support@medziva.ae',
      serviceRegions: appSettings.serviceRegions || ['Dubai', 'Sharjah'],
      maintenanceMode: !!appSettings.maintenanceMode,
      adminUsername: appSettings.adminUsername || 'admin',
    })
    .onConflictDoNothing();

  const adminPasswordHash = await hashPassword(appSettings.adminPassword || 'admin123');
  const adminUserId = await nextSequentialId(users, 'u');
  await db
    .insert(users)
    .values({
      id: adminUserId,
      username: appSettings.adminUsername || 'admin',
      email: 'admin@medziva.local',
      fullName: 'Admin',
      passwordHash: adminPasswordHash,
      role: USER_ROLES.ADMIN,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        username: appSettings.adminUsername || 'admin',
        fullName: 'Admin',
        passwordHash: adminPasswordHash,
        role: USER_ROLES.ADMIN,
        updatedAt: new Date(),
      },
    });

  const demoCustomerPasswordHash = await hashPassword('admin123');
  const customerUserId = await nextSequentialId(users, 'u');
  await db
    .insert(users)
    .values({
      id: customerUserId,
      email: 'admin@gmail.com',
      fullName: 'Admin',
      passwordHash: demoCustomerPasswordHash,
      role: USER_ROLES.ADMIN,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        fullName: 'Admin',
        passwordHash: demoCustomerPasswordHash,
        role: USER_ROLES.ADMIN,
        updatedAt: new Date(),
      },
    });
};
