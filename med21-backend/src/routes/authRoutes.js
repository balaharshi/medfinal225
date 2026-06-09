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
router.post('/logout', asyncHandler(authController.logout));
router.get('/session', authenticate, asyncHandler(authController.session));
router.get('/profile', authenticate, asyncHandler(authController.profile));
router.put('/profile', authenticate, profileValidator, validateRequest, asyncHandler(authController.updateProfile));
router.put('/change-password', authenticate, changePasswordValidator, validateRequest, asyncHandler(authController.changePassword));

export default router;
