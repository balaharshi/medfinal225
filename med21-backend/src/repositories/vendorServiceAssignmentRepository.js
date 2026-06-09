import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { vendorServiceAssignments } from '../db/schema/index.js';

export const findAssignmentsByVendorId = (vendorId) =>
  db
    .select()
    .from(vendorServiceAssignments)
    .where(eq(vendorServiceAssignments.vendorId, vendorId));

export const findAssignment = async (vendorId, serviceId) => {
  const [assignment] = await db
    .select()
    .from(vendorServiceAssignments)
    .where(and(
      eq(vendorServiceAssignments.vendorId, vendorId),
      eq(vendorServiceAssignments.serviceId, serviceId),
    ))
    .limit(1);

  return assignment;
};

export const upsertAssignment = async ({ id, vendorId, serviceId, enabled }) => {
  const [assignment] = await db
    .insert(vendorServiceAssignments)
    .values({
      id,
      vendorId,
      serviceId,
      enabled,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [vendorServiceAssignments.vendorId, vendorServiceAssignments.serviceId],
      set: {
        enabled,
        updatedAt: new Date(),
      },
    })
    .returning();

  return assignment;
};
