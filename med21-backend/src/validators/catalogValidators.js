import { body } from 'express-validator';

export const categoryValidator = [
  body('title').trim().notEmpty().withMessage('Category title is required'),
  body('image').optional({ values: 'falsy' }).isString(),
  body('description').optional({ values: 'falsy' }).isString(),
  body('type').optional({ values: 'falsy' }).isString(),
];

export const subcategoryValidator = [
  body('title').trim().notEmpty().withMessage('Subcategory title is required'),
];

export const productValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Product price is required'),
];

export const serviceValidator = [
  body('title').trim().notEmpty().withMessage('Service title is required'),
  body('price').isNumeric().withMessage('Service price is required'),
  body('slug').optional({ values: 'falsy' }).isString(),
  body('status').optional({ values: 'falsy' }).isIn(['draft', 'active', 'inactive']),
  body('active').optional().isBoolean(),
  body('originalPrice').optional({ values: 'falsy' }).isNumeric(),
  body('salePrice').optional({ values: 'falsy' }).isNumeric(),
  body('displayPriority').optional({ values: 'falsy' }).isNumeric(),
  body('shortDescription').optional({ values: 'falsy' }).isString(),
  body('fullDescription').optional({ values: 'falsy' }).isString(),
  body('preparationInstructions').optional({ values: 'falsy' }).isString(),
  body('whoIsItFor').optional({ values: 'falsy' }).isString(),
  body('availability').optional({ values: 'falsy' }).isString(),
  body('seoTitle').optional({ values: 'falsy' }).isString(),
  body('seoDescription').optional({ values: 'falsy' }).isString(),
];

export const vendorValidator = [
  body('name').trim().notEmpty().withMessage('Vendor name is required'),
];

export const bookingValidator = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('serviceTitle').trim().notEmpty().withMessage('Service title is required'),
];

export const enquiryValidator = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
];
