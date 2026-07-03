import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}

const rentalDescription = 'All services provided in UAE except AUH. 12 hours prior booking required.';
const rentalImage = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400';
const equipmentImage = 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400';

const rentalProduct = (id, name, week, month, deposit, image = rentalImage, subtitlePrefix = '') => ({
  id,
  name,
  subtitle: `${subtitlePrefix ? `${subtitlePrefix} | ` : ''}MRP per week AED ${week} | MRP per month AED ${month} | Security deposit AED ${deposit}`,
  price: week,
  originalPrice: month,
  image,
  category: 'devices-for-rent',
  subcategory: 'rent-medical-equipments',
  brand: 'Rental Equipment',
  rating: 4.8,
  inStock: true,
  description: rentalDescription,
  attributes: [
    { label: 'MRP per week', value: `AED ${week}` },
    { label: 'MRP per month', value: `AED ${month}` },
    { label: 'Security deposit', value: `AED ${deposit}` },
    { label: 'Booking notice', value: '12 hours prior booking' },
  ],
  vendorPrices: [],
});

const products = [
  rentalProduct('rent-electric-bed-3-function', 'Electric Bed 3 Function', 480, 1344, 2500),
  rentalProduct('rent-electric-bed-5-function', 'Electric Bed 5 Function', 660, 1848, 3000),
  rentalProduct('rent-oxygen-cylinder-set-48cft', 'Oxygen Cylinder Set 48cft', 120, 336, 900, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400', 'Includes regulator and trolley'),
  rentalProduct('rent-oxygen-concentrator-5ltr', 'Oxygen Concentrator 5 ltr', 300, 840, 2000, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=400'),
  rentalProduct('rent-patient-monitor-5-parameter', 'Patient Monitor 5 Parameter with trolley and accessories', 360, 1008, 1500, 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400'),
  rentalProduct('rent-bipap-machine', 'BIPAP Machine', 960, 2688, 3000),
  rentalProduct('rent-cpap-machine', 'CPAP Machine', 780, 2184, 2500),
  rentalProduct('rent-suction-machine', 'Suction Machine', 120, 336, 500),
  rentalProduct('rent-infusion-pump', 'Infusion Pump', 180, 504, 1800),
  rentalProduct('rent-syringe-pump', 'Syringe Pump', 240, 672, 1800),
  rentalProduct('rent-patient-hoist', 'Patient Hoist', 420, 1176, 3000),
  rentalProduct('rent-wheel-chair', 'Wheel Chair', 90, 252, 250, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400'),
  {
    id: 'prod-omron-bp',
    name: 'Omron BP Monitor',
    subtitle: 'HEM-7120 Electronic Upper Arm Blood Pressure Monitor',
    price: 139,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'Omron',
    rating: 4.8,
    inStock: true,
    description: '',
    attributes: [],
    vendorPrices: [],
  },
  {
    id: 'prod-pulse-ox',
    name: 'Pulse Oximeter',
    subtitle: 'Finger Pulse Blood Oxygen Saturation (SpO2) Monitor',
    price: 59,
    originalPrice: 99,
    image: equipmentImage,
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'MedTech',
    rating: 4.7,
    inStock: true,
    description: '',
    attributes: [],
    vendorPrices: [],
  },
  {
    id: 'prod-neb',
    name: 'Nebulizer',
    subtitle: 'Compressor Medical Aerosol Steam Inhaler System',
    price: 149,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'Nebulyfe',
    rating: 4.9,
    inStock: true,
    description: '',
    attributes: [],
    vendorPrices: [],
  },
  {
    id: 'prod-therm',
    name: 'Digital Thermometer',
    subtitle: 'Highly Accurate Professional Electronic Fever Thermometer',
    price: 49,
    originalPrice: 79,
    image: equipmentImage,
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'Omron',
    rating: 4.6,
    inStock: true,
    description: '',
    attributes: [],
    vendorPrices: [],
  },
  {
    id: 'prod-gluco',
    name: 'Glucometer',
    subtitle: 'Blood Sugar Monitor Kit with 25 Sterile Test Strips',
    price: 89,
    originalPrice: 129,
    image: 'https://images.unsplash.com/photo-1628115502411-ca48001146c5?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'AccuCheck',
    rating: 4.8,
    inStock: true,
    description: '',
    attributes: [],
    vendorPrices: [],
  },
  {
    id: 'prod-back-belt',
    name: 'Back Support Belt',
    subtitle: 'Adjustable Posture Corrector and Lumbar Relief Belt',
    price: 89,
    originalPrice: 129,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'FlexiBack',
    rating: 4.5,
    inStock: true,
    description: '',
    attributes: [],
    vendorPrices: [],
  },
  {
    id: 'prod-knee-supp',
    name: 'Knee Support',
    subtitle: 'Adjustable Neoprene Double Compression Patella Stabilizer Brace',
    price: 69,
    originalPrice: 99,
    image: 'https://images.unsplash.com/photo-1576091159399-a37f8d40a8ed?auto=format&fit=crop&q=80&w=400',
    category: 'buy-medical-equipments',
    subcategory: 'buy-medical-equipments',
    brand: 'JointCare',
    rating: 4.7,
    inStock: true,
    description: '',
    attributes: [],
    vendorPrices: [],
  },
  {
    id: 'prod-whey',
    name: 'Whey Protein',
    subtitle: 'Chocolate flavor Premium Isolate Protein Supplement (1kg)',
    price: 149,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=400',
    category: 'supplements',
    subcategory: 'supplements',
    brand: 'Optimum Gold',
    rating: 4.9,
    inStock: true,
    description: '',
    attributes: [],
    vendorPrices: [],
  },
];

const pool = new Pool({ connectionString: databaseUrl });

const affectedIds = products.map((product) => product.id);

try {
  await pool.query('begin');
  await pool.query(
    `delete from products
     where id = any($1)
        or category in ('devices-for-rent', 'buy-medical-equipments', 'supplements', 'nutrition-diet', 'wellness')`,
    [affectedIds],
  );

  for (const product of products) {
    await pool.query(
      `insert into products (
        id, name, subtitle, price, original_price, image, category, subcategory,
        brand, rating, in_stock, description, attributes, vendor_prices, updated_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13::jsonb, $14::jsonb, now()
      )`,
      [
        product.id,
        product.name,
        product.subtitle,
        product.price,
        product.originalPrice,
        product.image,
        product.category,
        product.subcategory,
        product.brand,
        product.rating,
        product.inStock,
        product.description,
        JSON.stringify(product.attributes),
        JSON.stringify(product.vendorPrices),
      ],
    );
  }

  await pool.query('commit');

  const counts = await pool.query(
    `select category, subcategory, count(*)::int as count
     from products
     where category in ('devices-for-rent', 'buy-medical-equipments', 'supplements')
     group by category, subcategory
     order by category, subcategory`,
  );

  console.log(JSON.stringify({ synced: products.length, counts: counts.rows }, null, 2));
} catch (error) {
  await pool.query('rollback');
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
