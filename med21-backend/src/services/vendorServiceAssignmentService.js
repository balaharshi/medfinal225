import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { services, vendors } from '../db/schema/index.js';
import { HttpError } from '../utils/httpError.js';
import {
  findAssignment,
  findAssignmentsByVendorId,
  upsertAssignment,
} from '../repositories/vendorServiceAssignmentRepository.js';

const ensureVendorExists = async (vendorId) => {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
  if (!vendor) throw new HttpError(404, 'Vendor not found');
  return vendor;
};

const ensureServiceExists = async (serviceId) => {
  const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service) throw new HttpError(404, 'Service not found');
  return service;
};

const toAssignmentView = (service, assignment) => ({
  ...service,
  assigned: !!assignment,
  enabled: !!assignment?.enabled,
  status: assignment?.enabled ? 'Enabled' : 'Disabled',
  assignmentId: assignment?.id || null,
});

export const getVendorServiceAssignments = async (vendorId) => {
  await ensureVendorExists(vendorId);
  const [serviceRows, assignmentRows] = await Promise.all([
    db.select().from(services),
    findAssignmentsByVendorId(vendorId),
  ]);

  const assignmentsByServiceId = new Map(assignmentRows.map((assignment) => [assignment.serviceId, assignment]));
  return serviceRows.map((service) => toAssignmentView(service, assignmentsByServiceId.get(service.id)));
};

export const setVendorServiceAssignment = async (vendorId, serviceId, enabled = true) => {
  await Promise.all([
    ensureVendorExists(vendorId),
    ensureServiceExists(serviceId),
  ]);

  return upsertAssignment({
    id: `vsa-${vendorId}-${serviceId}`,
    vendorId,
    serviceId,
    enabled: !!enabled,
  });
};

export const bulkSetVendorServiceAssignments = async (vendorId, serviceIds = [], enabled = true) => {
  await ensureVendorExists(vendorId);
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw new HttpError(400, 'At least one serviceId is required');
  }

  const results = [];
  for (const serviceId of serviceIds) {
    results.push(await setVendorServiceAssignment(vendorId, serviceId, enabled));
  }

  return { success: true, count: results.length, assignments: results };
};

export const getEnabledVendorServices = async (vendorId) => {
  await ensureVendorExists(vendorId);
  const [serviceRows, assignmentRows] = await Promise.all([
    db.select().from(services),
    findAssignmentsByVendorId(vendorId),
  ]);

  const enabledServiceIds = new Set(
    assignmentRows
      .filter((assignment) => assignment.enabled)
      .map((assignment) => assignment.serviceId),
  );

  return serviceRows
    .filter((service) => enabledServiceIds.has(service.id))
    .map((service) => ({
      ...service,
      status: 'Enabled',
      enabled: true,
    }));
};

export const ensureVendorServiceEnabled = async (vendorId, serviceId) => {
  const assignment = await findAssignment(vendorId, serviceId);
  if (!assignment || !assignment.enabled) {
    throw new HttpError(403, 'This service is not enabled for the selected vendor');
  }
  return assignment;
};
