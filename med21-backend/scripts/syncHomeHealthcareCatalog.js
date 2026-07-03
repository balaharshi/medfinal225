import 'dotenv/config';
import { db, pool } from '../src/config/db.js';
import { eq } from 'drizzle-orm';
import { categories, services } from '../src/db/schema/index.js';
import { HOME_HEALTHCARE_CATEGORIES, HOME_HEALTHCARE_SERVICES } from '../../shared/homeHealthcareCatalog.js';
const homeServiceIds = new Set(
  HOME_HEALTHCARE_SERVICES
    .filter((service) => service.category === 'home-healthcare')
    .map((service) => service.id),
);

const syncCategories = async () => {
  for (const category of HOME_HEALTHCARE_CATEGORIES) {
    await db
      .insert(categories)
      .values({
        id: category.id,
        title: category.title,
        image: category.image,
        slug: category.slug,
        type: 'service',
        description: category.description || '',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          title: category.title,
          image: category.image,
          slug: category.slug,
          type: 'service',
          description: category.description || '',
          updatedAt: new Date(),
        },
      });
  }
};

const syncServices = async () => {
  for (const service of HOME_HEALTHCARE_SERVICES) {
    await db
      .insert(services)
      .values({
        id: service.id,
        title: service.title,
        category: service.category,
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
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: services.id,
        set: {
          title: service.title,
          category: service.category,
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
          updatedAt: new Date(),
        },
      });
  }
};

try {
  await syncCategories();
  await syncServices();

  const legacyHomeRows = await db
    .select({ id: services.id })
    .from(services)
    .where(eq(services.category, 'home-healthcare'));

  for (const row of legacyHomeRows) {
    if (!homeServiceIds.has(row.id)) {
      await db.delete(services).where(eq(services.id, row.id));
    }
  }

  console.log('Home Healthcare catalog synchronized successfully.');
} finally {
  await pool.end();
}
