import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { HttpError } from '../utils/httpError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
    if (!token) throw new HttpError(401, 'Authentication token is required');

    const payload = verifyAccessToken(token);
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user || !user.isActive) throw new HttpError(401, 'Invalid authentication token');

    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Invalid authentication token'));
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new HttpError(403, 'You do not have permission to access this resource'));
  }
  return next();
};
