import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.resolve(__dirname, '../../med21/src/data/customize_lab_items.txt');
const labImage = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400';

const normalizeLabId = (code) => `srv-custom-lab-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const parseItems = (raw) =>
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code = '', title = '', priceText = ''] = line.split('|').map((part) => part.trim());
      const price = Number((priceText.match(/\d+(?:\.\d+)?/) || ['0'])[0]);
      const homeCollectionNote = price < 1000 ? 'Home collection charge AED 150 applies below AED 1000.' : 'No AED 150 home collection charge for AED 1000 and above.';

      return {
        id: normalizeLabId(code),
        title: title.replace(/\s+/g, ' ').trim(),
        category: 'lab-tests',
        subcategory: 'customize-lab-package',
        price,
        duration: '12 hours prior booking',
        image: labImage,
        description: `${code} | ${homeCollectionNote} Available in Dubai and SHJ only.`,
        popular: false,
        enquiryOnly: false,
        attributes: [
          { label: 'Test Code', value: code },
          { label: 'Collection', value: homeCollectionNote },
          { label: 'Coverage', value: 'Dubai and SHJ only' },
        ],
        vendorPrices: [],
        bookingNotice: '12 hours prior booking slots',
        remarks: 'Dubai and SHJ only',
      };
    });

if (!fs.existsSync(sourcePath)) {
  console.error(`Customize lab source file not found: ${sourcePath}`);
  process.exit(1);
}

const items = parseItems(fs.readFileSync(sourcePath, 'utf8'));
const pool = new Pool({ connectionString: databaseUrl });

try {
  await pool.query('begin');
  await pool.query(
    `delete from services where category = 'lab-tests' and subcategory = 'customize-lab-package'`,
  );

  for (const item of items) {
    await pool.query(
      `insert into services (
        id, title, category, subcategory, price, duration, image, description,
        popular, enquiry_only, attributes, vendor_prices, booking_notice, remarks, updated_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11::jsonb, $12::jsonb, $13, $14, now()
      )`,
      [
        item.id,
        item.title,
        item.category,
        item.subcategory,
        item.price,
        item.duration,
        item.image,
        item.description,
        item.popular,
        item.enquiryOnly,
        JSON.stringify(item.attributes),
        JSON.stringify(item.vendorPrices),
        item.bookingNotice,
        item.remarks,
      ],
    );
  }

  await pool.query('commit');

  const result = await pool.query(
    `select count(*)::int as count
     from services
     where category = 'lab-tests' and subcategory = 'customize-lab-package'`,
  );

  console.log(JSON.stringify({ synced: items.length, databaseCount: result.rows[0].count }, null, 2));
} catch (error) {
  await pool.query('rollback');
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
