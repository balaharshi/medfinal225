import { and, eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, vendors } from '../db/schema/index.js';
import { USER_ROLES } from '../constants/index.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signAccessToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { nextSequentialId } from '../utils/sequentialId.js';

const toSafeUser = (user) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

const createSession = (user) => ({
  accessToken: signAccessToken({ sub: user.id, role: user.role }),
  user: toSafeUser(user),
});

const toSafeVendor = (vendor) => {
  const { passwordHash, ...safeVendor } = vendor;
  return safeVendor;
};

export const register = async (payload) => {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  if (existing.length) throw new HttpError(409, 'Email is already registered');

  const [user] = await db
    .insert(users)
    .values({
      id: await nextSequentialId(users, 'u'),
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone || null,
      address: payload.address || null,
      passwordHash: await hashPassword(payload.password),
      role: USER_ROLES.CUSTOMER,
    })
    .returning();

  return createSession(user);
};

export const login = async ({ email, username, password }) => {
  const predicate = username
    ? or(eq(users.username, username), eq(users.email, username))
    : eq(users.email, email);
  const [user] = await db.select().from(users).where(predicate).limit(1);

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid credentials');
  }

  return createSession(user);
};

export const vendorLogin = async ({ email, password }) => {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.email, email)).limit(1);
  if (!vendor || !vendor.passwordHash || !(await comparePassword(password, vendor.passwordHash))) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.vendorId, vendor.id), eq(users.role, USER_ROLES.VENDOR)))
    .limit(1);

  if (!user) {
    throw new HttpError(404, 'Linked vendor account is missing');
  }

  return {
    success: true,
    vendorId: vendor.id,
    vendor: toSafeVendor(vendor),
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    user: toSafeUser(user),
  };
};

export const getSession = async (userId) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new HttpError(404, 'Session not found');

  const session = { user: toSafeUser(user) };
  if (user.role === USER_ROLES.VENDOR && user.vendorId) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, user.vendorId)).limit(1);
    if (vendor) {
      session.vendor = toSafeVendor(vendor);
    }
  }

  return session;
};

export const getProfile = async (userId) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new HttpError(404, 'Profile not found');
  return toSafeUser(user);
};

export const updateProfile = async (userId, payload) => {
  const updates = {
    ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
    ...(payload.email !== undefined ? { email: payload.email } : {}),
    ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
    ...(payload.address !== undefined ? { address: payload.address } : {}),
    updatedAt: new Date(),
  };

  const [user] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning();
  if (!user) throw new HttpError(404, 'Profile not found');
  return toSafeUser(user);
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    throw new HttpError(401, 'Current password is incorrect');
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { success: true };
};
