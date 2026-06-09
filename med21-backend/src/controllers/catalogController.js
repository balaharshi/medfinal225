import * as service from '../services/catalogService.js';

export const getDatabase = async (_req, res) => res.json(await service.getDatabase());
export const getCategories = async (_req, res) => res.json(await service.getCategories());
export const createCategory = async (req, res) => res.status(201).json(await service.createCategory(req.body));
export const updateCategory = async (req, res) => res.json(await service.updateCategory(req.params.id, req.body));
export const deleteCategory = async (req, res) => res.json(await service.deleteCategory(req.params.id));
export const createSubcategory = async (req, res) => res.status(201).json(await service.createSubcategory(req.params.catId, req.body));
export const deleteSubcategory = async (req, res) => res.json(await service.deleteSubcategory(req.params.catId, req.params.subId));

export const getProducts = async (_req, res) => res.json(await service.getProducts());
export const createProduct = async (req, res) => res.status(201).json(await service.createProduct(req.body));
export const deleteProduct = async (req, res) => res.json(await service.deleteProduct(req.params.id));

export const getServices = async (_req, res) => res.json(await service.getServices());
export const createService = async (req, res) => res.status(201).json(await service.createService(req.body));
export const updateService = async (req, res) => res.json(await service.updateService(req.params.id, req.body));
export const deleteService = async (req, res) => res.json(await service.deleteService(req.params.id));

export const getVendors = async (_req, res) => res.json(await service.getVendors());
export const getUsers = async (_req, res) => res.json(await service.getUsers());
export const createVendor = async (req, res) => res.status(201).json(await service.createVendor(req.body));
export const updateVendor = async (req, res) => res.json(await service.updateVendor(req.params.id, req.body));
export const deleteVendor = async (req, res) => res.json(await service.deleteVendor(req.params.id));
export const getVendorBookings = async (req, res) => res.json(await service.getVendorBookings(req.params.vendorId));
export const getVendorServices = async (req, res) => res.json(await service.getVendorServices(req.params.vendorId));
export const getVendorProfile = async (req, res) => res.json(await service.getVendorProfile(req.params.vendorId));
export const updateVendorProfile = async (req, res) => {
  const updates = {
    ...(req.body.name !== undefined ? { name: req.body.name } : {}),
    ...(req.body.type !== undefined ? { type: req.body.type } : {}),
    ...(req.body.contact !== undefined ? { contact: req.body.contact } : {}),
    ...(req.body.address !== undefined ? { address: req.body.address } : {}),
  };

  res.json({ success: true, ...(await service.updateVendor(req.params.vendorId, updates)) });
};

export const getBookings = async (_req, res) => res.json(await service.getBookings());
export const createBooking = async (req, res) => res.status(201).json(await service.createBooking(req.body));
export const cancelBooking = async (req, res) => res.json(await service.cancelBooking(req.params.id));
export const updateBooking = async (req, res) => res.json(await service.updateBooking(req.params.id, req.body));
export const acceptVendorBooking = async (req, res) => {
  res.json({ success: true, booking: await service.acceptVendorBooking(req.params.id, req.params.vendorId) });
};

export const getEnquiries = async (_req, res) => res.json(await service.getEnquiries());
export const createEnquiry = async (req, res) => res.status(201).json(await service.createEnquiry(req.body));
export const updateEnquiryStatus = async (req, res) => res.json(await service.updateEnquiryStatus(req.params.id, req.body.status));
export const deleteEnquiry = async (req, res) => res.json(await service.deleteEnquiry(req.params.id));

export const getSettings = async (_req, res) => res.json(await service.getSettings());
export const updateSettings = async (req, res) => res.json(await service.updateSettings(req.body));
