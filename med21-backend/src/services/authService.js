import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import appleSigninAuth from 'apple-signin-auth';
import { and, eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, vendors } from '../db/schema/index.js';
import { USER_ROLES } from '../constants/index.js';
import { env } from '../config/env.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signAccessToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { nextSequentialId } from '../utils/sequentialId.js';

const PRIMARY_ADMIN_EMAIL = 'admin@gmail.com';
const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const toSafeUser = (user) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

const promotePrimaryAdmin = async (user) => {
  if (user.email !== PRIMARY_ADMIN_EMAIL || user.role === USER_ROLES.ADMIN) {
    return user;
  }

  const [promotedUser] = await db
    .update(users)
    .set({ role: USER_ROLES.ADMIN, updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();

  return promotedUser || { ...user, role: USER_ROLES.ADMIN };
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

  return createSession(await promotePrimaryAdmin(user));
};

const verifyGoogleIdentity = async ({ credential, idToken }) => {
  const token = credential || idToken;
  if (!googleClient || !env.googleClientId) {
    throw new HttpError(503, 'Google login is not configured');
  }
  if (!token) throw new HttpError(400, 'Google credential is required');

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: env.googleClientId,
    });
  } catch {
    throw new HttpError(401, 'Google login could not be verified');
  }

  const payload = ticket.getPayload();
  if (!payload?.email || payload.email_verified === false) {
    throw new HttpError(401, 'Google account email could not be verified');
  }

  return {
    email: payload.email,
    fullName: payload.name || [payload.given_name, payload.family_name].filter(Boolean).join(' '),
  };
};

const upsertOAuthUser = async ({ email, fullName, role = USER_ROLES.CUSTOMER, vendorId = null }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new HttpError(400, 'OAuth account email is required');

  const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existingUser) {
    const updates = {
      fullName: existingUser.fullName || fullName || normalizedEmail.split('@')[0],
      role,
      vendorId,
      updatedAt: new Date(),
    };
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, existingUser.id))
      .returning();
    return createSession(await promotePrimaryAdmin(updatedUser || existingUser));
  }

  const [user] = await db
    .insert(users)
    .values({
      id: await nextSequentialId(users, 'u'),
      fullName: fullName || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      passwordHash: await hashPassword(crypto.randomUUID()),
      role,
      vendorId,
    })
    .returning();

  return createSession(user);
};

const upsertOAuthCustomer = (payload) => upsertOAuthUser({ ...payload, role: USER_ROLES.CUSTOMER });

const upsertOAuthAdmin = (payload) => upsertOAuthUser({ ...payload, role: USER_ROLES.ADMIN });

const upsertOAuthVendor = async ({ email, fullName }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const vendorName = fullName || normalizedEmail.split('@')[0] || 'MedZiva Vendor';
  const [existingVendor] = await db.select().from(vendors).where(eq(vendors.email, normalizedEmail)).limit(1);
  const vendor = existingVendor || (await db
    .insert(vendors)
    .values({
      id: await nextSequentialId(vendors, 'v'),
      name: vendorName,
      type: 'Healthcare Provider',
      email: normalizedEmail,
      contact: null,
      address: 'Dubai',
    })
    .returning())[0];

  const session = await upsertOAuthUser({
    email: normalizedEmail,
    fullName: vendorName,
    role: USER_ROLES.VENDOR,
    vendorId: vendor.id,
  });

  return { ...session, vendor: toSafeVendor(vendor) };
};

export const loginWithGoogle = async ({ credential, idToken }) => {
  return upsertOAuthCustomer(await verifyGoogleIdentity({ credential, idToken }));
};

export const loginWithGoogleAdmin = async ({ credential, idToken }) =>
  upsertOAuthAdmin(await verifyGoogleIdentity({ credential, idToken }));

export const loginWithGoogleVendor = async ({ credential, idToken }) =>
  upsertOAuthVendor(await verifyGoogleIdentity({ credential, idToken }));

export const loginWithApple = async ({ credential, idToken, user }) => {
  const token = credential || idToken;
  if (!env.appleClientId) {
    throw new HttpError(503, 'Apple login is not configured');
  }
  if (!token) throw new HttpError(400, 'Apple credential is required');

  let payload;
  try {
    payload = await appleSigninAuth.verifyIdToken(token, {
      audience: env.appleClientId,
      ignoreExpiration: false,
    });
  } catch {
    throw new HttpError(401, 'Apple login could not be verified');
  }
  const name = user?.name
    ? [user.name.firstName, user.name.lastName].filter(Boolean).join(' ')
    : '';

  return upsertOAuthCustomer({
    email: payload.email,
    fullName: name || payload.email?.split('@')[0],
  });
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

  const activeUser = await promotePrimaryAdmin(user);
  const session = { user: toSafeUser(activeUser) };
  if (activeUser.role === USER_ROLES.VENDOR && activeUser.vendorId) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, activeUser.vendorId)).limit(1);
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
