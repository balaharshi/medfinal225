import { body } from 'express-validator';

export const registerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ values: 'falsy' }).isString(),
  body('address').optional({ values: 'falsy' }).isString(),
];

export const loginValidator = [
  body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
  body('username').optional({ values: 'falsy' }).trim().isString(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const profileValidator = [
  body('fullName').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).isString(),
  body('address').optional({ values: 'falsy' }).isString(),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];
