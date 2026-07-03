import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/errorHandler.js';
import {
  changePasswordValidator,
  loginValidator,
  profileValidator,
  registerValidator,
} from '../validators/authValidators.js';

const router = Router();

router.post('/register', registerValidator, validateRequest, asyncHandler(authController.register));
router.post('/login', loginValidator, validateRequest, asyncHandler(authController.login));
router.post('/google', asyncHandler(authController.googleLogin));
router.post('/google/admin', asyncHandler(authController.googleAdminLogin));
router.post('/google/vendor', asyncHandler(authController.googleVendorLogin));
router.post('/google/callback', asyncHandler(authController.googleCallback));
router.post('/apple', asyncHandler(authController.appleLogin));
router.post('/apple/callback', asyncHandler(authController.appleCallback));
router.post('/logout', asyncHandler(authController.logout));
router.get('/session', authenticate, asyncHandler(authController.session));
router.get('/profile', authenticate, asyncHandler(authController.profile));
router.put('/profile', authenticate, profileValidator, validateRequest, asyncHandler(authController.updateProfile));
router.put('/change-password', authenticate, changePasswordValidator, validateRequest, asyncHandler(authController.changePassword));

export default router;
