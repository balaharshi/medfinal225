import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workbookPath = process.argv[2] || 'C:/Users/ELCOT/Downloads/Pricelist-Phase 2- 5th June 2026.xlsx';
const outputPath = path.resolve(__dirname, '../../shared/labTestsAtHomeCatalog.js');

const categoryPanels = [
  { title: 'Routine Blood Tests', slug: 'routine-blood-tests', start: 1, end: 85, titleCol: 2, priceCol: 3, detailCol: 4 },
  { title: 'Preventive Health Packages', slug: 'preventive-health-packages', start: 86, end: 290, titleCol: 2, priceCol: 3, detailCol: 4 },
  { title: "Men's Health Packages", slug: 'mens-health-packages', start: 1, end: 47, titleCol: 8, priceCol: 9, detailCol: 10 },
  { title: "Women's Health Packages", slug: 'womens-health-packages', start: 48, end: 170, titleCol: 8, priceCol: 9, detailCol: 10 },
  { title: 'STD / Sexual Health', slug: 'std-sexual-health', start: 171, end: 224, titleCol: 8, priceCol: 9, detailCol: 10 },
  { title: 'Specialized Diagnostic Tests', slug: 'specialized-diagnostic-tests', start: 225, end: 267, titleCol: 8, priceCol: 9, detailCol: 10 },
  { title: 'Genetic Testing', slug: 'genetic-testing', start: 268, end: 290, titleCol: 8, priceCol: 9, detailCol: 10 },
];

const labImage = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=400';
const expectedCounts = {
  'routine-blood-tests': 7,
  'preventive-health-packages': 16,
  'mens-health-packages': 3,
  'womens-health-packages': 8,
  'std-sexual-health': 4,
  'specialized-diagnostic-tests': 3,
  'genetic-testing': 9,
};

const findEnd = (buffer, signature, start) => {
  for (let index = start; index <= buffer.length - 4; index += 1) {
    if (buffer[index] === signature[0] && buffer[index + 1] === signature[1] && buffer[index + 2] === signature[2] && buffer[index + 3] === signature[3]) {
      return index;
    }
  }
  return -1;
};

const readZipEntry = (zipBuffer, entryName) => {
  let offset = 0;
  while (offset < zipBuffer.length - 30) {
    if (zipBuffer.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const method = zipBuffer.readUInt16LE(offset + 8);
    let compressedSize = zipBuffer.readUInt32LE(offset + 18);
    let uncompressedSize = zipBuffer.readUInt32LE(offset + 22);
    const nameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraLength = zipBuffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = zipBuffer.subarray(nameStart, nameStart + nameLength).toString('utf8');
    const dataStart = nameStart + nameLength + extraLength;

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || compressedSize === 0) {
      const descriptorAt = findEnd(zipBuffer, [0x50, 0x4b, 0x07, 0x08], dataStart);
      if (descriptorAt === -1) throw new Error(`Could not find ZIP descriptor for ${name}`);
      compressedSize = descriptorAt - dataStart;
      offset = descriptorAt + 16;
    } else {
      offset = dataStart + compressedSize;
    }

    if (name !== entryName) continue;

    const compressed = zipBuffer.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) return compressed.toString('utf8');
    if (method === 8) return zlib.inflateRawSync(compressed).toString('utf8');
    throw new Error(`Unsupported ZIP compression method ${method} for ${entryName}`);
  }

  throw new Error(`Entry not found: ${entryName}`);
};

const decodeXml = (value) => value
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'");

const columnIndex = (cellRef) => {
  const letters = cellRef.replace(/\d/g, '');
  return [...letters].reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0);
};

const slugify = (text) => text
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const parseSharedStrings = (xml) => {
  const strings = [];
  for (const match of xml.matchAll(/<si\b[\s\S]*?<\/si>/g)) {
    const text = [...match[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((part) => decodeXml(part[1]))
      .join('');
    strings.push(text);
  }
  return strings;
};

const parseWorksheet = (xml, sharedStrings) => {
  const rows = new Map();
  for (const rowMatch of xml.matchAll(/<row[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(rowMatch[1]);
    const row = new Map();
    for (const cellMatch of rowMatch[2].matchAll(/<c\b((?:(?!\/>)[^>])*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/\br="([^"]+)"/)?.[1];
      const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (!ref || rawValue === undefined) continue;
      row.set(columnIndex(ref), type === 's' ? sharedStrings[Number(rawValue)] : decodeXml(rawValue));
    }
    rows.set(rowNumber, row);
  }
  return rows;
};

const getCell = (rows, row, col) => rows.get(row)?.get(col)?.trim() || '';
const isPrice = (value) => /^\d+(?:\.\d+)?$/.test(value);

const normalizeLabel = (label) => {
  if (/who/i.test(label)) return 'Who';
  if (/prep/i.test(label)) return 'Prep';
  if (/result/i.test(label)) return 'Results';
  if (/include/i.test(label)) return 'Includes';
  return label;
};

const detailLabel = (text) => /who|prep|result|include/i.test(text);

const toAttributes = (details) => {
  const attrs = [];
  let current = null;

  for (const detail of details) {
    if (detailLabel(detail.text)) {
      current = { label: normalizeLabel(detail.text), sourceLabel: detail.text, row: detail.row, value: '' };
      attrs.push(current);
      continue;
    }

    if (!current) {
      attrs.push({ label: 'Description', sourceLabel: 'Description', row: detail.row, value: detail.text });
      continue;
    }

    current.value = current.value ? `${current.value}\n${detail.text}` : detail.text;
  }

  return attrs;
};

const zipBuffer = fs.readFileSync(workbookPath);
const sharedStrings = parseSharedStrings(readZipEntry(zipBuffer, 'xl/sharedStrings.xml'));
const rows = parseWorksheet(readZipEntry(zipBuffer, 'xl/worksheets/sheet3.xml'), sharedStrings);
const services = [];

for (const panel of categoryPanels) {
  for (let row = panel.start; row <= panel.end; row += 1) {
    const title = getCell(rows, row, panel.titleCol);
    const priceText = getCell(rows, row, panel.priceCol);
    if (!title || !isPrice(priceText)) continue;

    let nextRow = panel.end + 1;
    for (let probe = row + 1; probe <= panel.end; probe += 1) {
      if (getCell(rows, probe, panel.titleCol) && isPrice(getCell(rows, probe, panel.priceCol))) {
        nextRow = probe;
        break;
      }
    }

    const details = [];
    for (let detailRow = row; detailRow < nextRow; detailRow += 1) {
      const text = getCell(rows, detailRow, panel.detailCol);
      if (text) details.push({ row: detailRow, text });
    }

    const attributes = toAttributes(details);
    const description = attributes.find((attr) => attr.label === 'Description')?.value
      || attributes.find((attr) => attr.label === 'Who')?.value
      || '';

    services.push({
      id: `srv-lab-home-${slugify(title)}`,
      title,
      category: 'lab-tests-at-home',
      subcategory: panel.slug,
      price: Number(priceText),
      duration: attributes.find((attr) => attr.label === 'Results')?.value || '12 hours prior booking slots',
      image: labImage,
      description,
      popular: false,
      enquiryOnly: false,
      bookingNotice: '12 hours prior booking slots',
      remarks: 'Lab tests below AED 1000 will attract a home collection amount of AED 150. All services will be provided in Dubai and SHJ ONLY.',
      attributes: [
        { label: 'Excel Row', value: String(row) },
        { label: 'Category', value: panel.title },
        { label: 'Collection', value: Number(priceText) < 1000 ? 'Lab tests below AED 1000 will attract a home collection amount of AED 150' : 'AED 1000 and above' },
        { label: 'Coverage', value: 'All services will be provided in Dubai and SHJ ONLY' },
        ...attributes,
      ],
      vendorPrices: [],
    });
  }
}

const counts = services.reduce((acc, service) => {
  acc[service.subcategory] = (acc[service.subcategory] || 0) + 1;
  return acc;
}, {});

for (const [slug, expected] of Object.entries(expectedCounts)) {
  if (counts[slug] !== expected) {
    console.error(JSON.stringify({
      counts,
      rows: services.map((service) => ({
        subcategory: service.subcategory,
        row: service.attributes.find((attr) => attr.label === 'Excel Row')?.value,
        title: service.title,
        price: service.price,
      })),
    }, null, 2));
    throw new Error(`Count mismatch for ${slug}: expected ${expected}, got ${counts[slug] || 0}`);
  }
}

const file = `export const LAB_TESTS_AT_HOME_CATEGORIES = ${JSON.stringify(categoryPanels.map(({ title, slug }) => ({ title, slug })), null, 2)};\n\nexport const LAB_TESTS_AT_HOME_EXPECTED_COUNTS = ${JSON.stringify(expectedCounts, null, 2)};\n\nexport const LAB_TESTS_AT_HOME_SERVICES = ${JSON.stringify(services, null, 2)};\n`;

fs.writeFileSync(outputPath, file, 'utf8');
console.log(JSON.stringify({ outputPath, total: services.length, counts }, null, 2));
