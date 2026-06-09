import * as service from '../services/vendorServiceAssignmentService.js';

export const getVendorServiceAssignments = async (req, res) => {
  res.json(await service.getVendorServiceAssignments(req.params.vendorId));
};

export const setVendorServiceAssignment = async (req, res) => {
  res.json({
    success: true,
    assignment: await service.setVendorServiceAssignment(
      req.params.vendorId,
      req.params.serviceId,
      req.body.enabled,
    ),
  });
};

export const bulkSetVendorServiceAssignments = async (req, res) => {
  res.json(await service.bulkSetVendorServiceAssignments(
    req.params.vendorId,
    req.body.serviceIds,
    req.body.enabled,
  ));
};
