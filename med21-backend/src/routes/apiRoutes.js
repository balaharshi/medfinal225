import { Router } from 'express';
import * as controller from '../controllers/catalogController.js';
import * as authController from '../controllers/authController.js';
import * as vendorServiceAssignmentController from '../controllers/vendorServiceAssignmentController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { validateRequest } from '../middlewares/errorHandler.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import { USER_ROLES } from '../constants/index.js';
import {
  bookingValidator,
  categoryValidator,
  enquiryValidator,
  productValidator,
  serviceValidator,
  subcategoryValidator,
  vendorValidator,
} from '../validators/catalogValidators.js';
import { loginValidator } from '../validators/authValidators.js';

const router = Router();
const adminRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN];
const requireAdmin = [authenticate, authorize(...adminRoles)];
const requireVendorSelfOrAdmin = async (req, _res, next) => {
  if (!req.user) {
    return next(new HttpError(401, 'Authentication token is required'));
  }

  if (
    adminRoles.includes(req.user.role) ||
    (req.user.role === USER_ROLES.VENDOR && String(req.user.vendorId) === String(req.params.vendorId))
  ) {
    return next();
  }

  return next(new HttpError(403, 'You do not have permission to access this resource'));
};

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'medziva-backend' }));
router.get('/db', ...requireAdmin, asyncHandler(controller.getDatabase));

router.get('/categories', asyncHandler(controller.getCategories));
router.post('/categories', ...requireAdmin, categoryValidator, validateRequest, asyncHandler(controller.createCategory));
router.patch('/category/:id', ...requireAdmin, categoryValidator, validateRequest, asyncHandler(controller.updateCategory));
router.delete('/category/:id', ...requireAdmin, asyncHandler(controller.deleteCategory));
router.delete('/categories/:id', ...requireAdmin, asyncHandler(controller.deleteCategory));
router.post('/categories/:catId/subcategories', ...requireAdmin, subcategoryValidator, validateRequest, asyncHandler(controller.createSubcategory));
router.post('/subcategories/:catId', ...requireAdmin, subcategoryValidator, validateRequest, asyncHandler(controller.createSubcategory));
router.delete('/categories/:catId/subcategories/:subId', ...requireAdmin, asyncHandler(controller.deleteSubcategory));
router.delete('/subcategory/:catId/:subId', ...requireAdmin, asyncHandler(controller.deleteSubcategory));

router.get('/products', asyncHandler(controller.getProducts));
router.post('/products', ...requireAdmin, productValidator, validateRequest, asyncHandler(controller.createProduct));
router.delete('/products/:id', ...requireAdmin, asyncHandler(controller.deleteProduct));

router.get('/services', asyncHandler(controller.getServices));
router.post('/services', ...requireAdmin, serviceValidator, validateRequest, asyncHandler(controller.createService));
router.patch('/service/:id', ...requireAdmin, serviceValidator, validateRequest, asyncHandler(controller.updateService));
router.patch('/services/:id', ...requireAdmin, serviceValidator, validateRequest, asyncHandler(controller.updateService));
router.delete('/service/:id', ...requireAdmin, asyncHandler(controller.deleteService));
router.delete('/services/:id', ...requireAdmin, asyncHandler(controller.deleteService));

router.get('/vendors', asyncHandler(controller.getVendors));
router.get('/users', ...requireAdmin, asyncHandler(controller.getUsers));
router.post('/vendors', ...requireAdmin, vendorValidator, validateRequest, asyncHandler(controller.createVendor));
router.patch('/vendor/:id', ...requireAdmin, vendorValidator, validateRequest, asyncHandler(controller.updateVendor));
router.delete('/vendors/:id', ...requireAdmin, asyncHandler(controller.deleteVendor));
router.get('/vendorBookings/:vendorId', authenticate, requireVendorSelfOrAdmin, asyncHandler(controller.getVendorBookings));
router.post('/vendorBookings/:vendorId/:id/accept', authenticate, requireVendorSelfOrAdmin, asyncHandler(controller.acceptVendorBooking));
router.get('/vendorServices/:vendorId', authenticate, requireVendorSelfOrAdmin, asyncHandler(controller.getVendorServices));
router.get('/vendors/:vendorId/service-assignments', ...requireAdmin, asyncHandler(vendorServiceAssignmentController.getVendorServiceAssignments));
router.patch('/vendors/:vendorId/service-assignments/:serviceId', ...requireAdmin, asyncHandler(vendorServiceAssignmentController.setVendorServiceAssignment));
router.post('/vendors/:vendorId/service-assignments/bulk', ...requireAdmin, asyncHandler(vendorServiceAssignmentController.bulkSetVendorServiceAssignments));
router.get('/vendorProfile/:vendorId', authenticate, requireVendorSelfOrAdmin, asyncHandler(controller.getVendorProfile));
router.patch('/vendorProfile/:vendorId', authenticate, requireVendorSelfOrAdmin, asyncHandler(controller.updateVendorProfile));
router.post('/vendorLogin', loginValidator, validateRequest, asyncHandler(authController.vendorLogin));

router.get('/bookings', ...requireAdmin, asyncHandler(controller.getBookings));
router.post('/bookings', bookingValidator, validateRequest, asyncHandler(controller.createBooking));
router.patch('/booking/:id', ...requireAdmin, asyncHandler(controller.updateBooking));
router.delete('/booking/:id', ...requireAdmin, asyncHandler(controller.cancelBooking));
router.delete('/bookings/:id', ...requireAdmin, asyncHandler(controller.cancelBooking));

router.get('/enquiries', ...requireAdmin, asyncHandler(controller.getEnquiries));
router.post('/enquiries', enquiryValidator, validateRequest, asyncHandler(controller.createEnquiry));
router.post('/enquiryStatus/:id', ...requireAdmin, asyncHandler(controller.updateEnquiryStatus));
router.post('/enquiries/:id/status', ...requireAdmin, asyncHandler(controller.updateEnquiryStatus));
router.delete('/enquiry/:id', ...requireAdmin, asyncHandler(controller.deleteEnquiry));
router.delete('/enquiries/:id', ...requireAdmin, asyncHandler(controller.deleteEnquiry));

router.get('/settings', ...requireAdmin, asyncHandler(controller.getSettings));
router.post('/settings', ...requireAdmin, asyncHandler(controller.updateSettings));

export default router;
