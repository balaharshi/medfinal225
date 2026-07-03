import 'dotenv/config';
import { db, pool } from '../src/config/db.js';
import { eq } from 'drizzle-orm';
import { services } from '../src/db/schema/index.js';
import { LAB_TESTS_AT_HOME_EXPECTED_COUNTS, LAB_TESTS_AT_HOME_SERVICES } from '../../shared/labTestsAtHomeCatalog.js';

const labTestIds = new Set(LAB_TESTS_AT_HOME_SERVICES.map((service) => service.id));

const syncServices = async () => {
  for (const service of LAB_TESTS_AT_HOME_SERVICES) {
    await db
      .insert(services)
      .values({
        id: service.id,
        title: service.title,
        category: service.category,
        subcategory: service.subcategory || '',
        price: Number(service.price || 0),
        duration: service.duration || '12 hours prior booking slots',
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
          duration: service.duration || '12 hours prior booking slots',
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

  const existingRows = await db
    .select({ id: services.id })
    .from(services)
    .where(eq(services.category, 'lab-tests-at-home'));

  for (const row of existingRows) {
    if (!labTestIds.has(row.id)) {
      await db.delete(services).where(eq(services.id, row.id));
    }
  }
};

try {
  await syncServices();

  const rows = await db
    .select({ subcategory: services.subcategory })
    .from(services)
    .where(eq(services.category, 'lab-tests-at-home'));

  const counts = rows.reduce((acc, row) => {
    acc[row.subcategory] = (acc[row.subcategory] || 0) + 1;
    return acc;
  }, {});

  for (const [subcategory, expected] of Object.entries(LAB_TESTS_AT_HOME_EXPECTED_COUNTS)) {
    if (counts[subcategory] !== expected) {
      throw new Error(`Lab Tests at Home count mismatch for ${subcategory}: expected ${expected}, got ${counts[subcategory] || 0}`);
    }
  }

  console.log(JSON.stringify({ synced: LAB_TESTS_AT_HOME_SERVICES.length, counts }, null, 2));
} finally {
  await pool.end();
}
