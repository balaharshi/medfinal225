import * as authService from '../services/authService.js';
import { triggerPusherEvent } from '../services/pusherService.js';

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  const session = await authService.register(req.body);
  res.cookie('accessToken', session.accessToken, authCookieOptions);
  res.status(201).json({ success: true, user: session.user, accessToken: session.accessToken });
};

export const login = async (req, res) => {
  const session = await authService.login(req.body);
  res.cookie('accessToken', session.accessToken, authCookieOptions);
  triggerPusherEvent('auth:login-success', {
    message: `Welcome back, ${session.user.fullName || session.user.email}!`,
    user: { id: session.user.id, fullName: session.user.fullName, email: session.user.email },
  });
  res.json({ success: true, user: session.user, accessToken: session.accessToken });
};

const sendOAuthSession = async (req, res, provider) => {
  const session = provider === 'apple'
    ? await authService.loginWithApple(req.body)
    : await authService.loginWithGoogle(req.body);

  res.cookie('accessToken', session.accessToken, authCookieOptions);
  triggerPusherEvent('auth:login-success', {
    message: `Welcome back, ${session.user.fullName || session.user.email}!`,
    provider,
    user: { id: session.user.id, fullName: session.user.fullName, email: session.user.email },
  });
  res.json({ success: true, user: session.user, accessToken: session.accessToken });
};

export const googleLogin = async (req, res) => sendOAuthSession(req, res, 'google');
export const googleCallback = async (req, res) => sendOAuthSession(req, res, 'google');
export const appleLogin = async (req, res) => sendOAuthSession(req, res, 'apple');
export const appleCallback = async (req, res) => sendOAuthSession(req, res, 'apple');

export const googleAdminLogin = async (req, res) => {
  const session = await authService.loginWithGoogleAdmin(req.body);
  res.cookie('accessToken', session.accessToken, authCookieOptions);
  triggerPusherEvent('auth:login-success', {
    message: `Admin login successful: ${session.user.fullName || session.user.email}`,
    provider: 'google',
    user: { id: session.user.id, fullName: session.user.fullName, email: session.user.email },
  });
  res.json({ success: true, user: session.user, accessToken: session.accessToken });
};

export const googleVendorLogin = async (req, res) => {
  const session = await authService.loginWithGoogleVendor(req.body);
  res.cookie('accessToken', session.accessToken, authCookieOptions);
  triggerPusherEvent('auth:login-success', {
    message: `Vendor login successful: ${session.vendor?.name || session.user.fullName}`,
    provider: 'google',
    user: { id: session.user.id, fullName: session.user.fullName, email: session.user.email },
  });
  res.json({ success: true, user: session.user, vendor: session.vendor, accessToken: session.accessToken });
};

export const logout = async (_req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }).json({ success: true });
};

export const profile = async (req, res) => {
  res.json(await authService.getProfile(req.user.id));
};

export const session = async (req, res) => {
  res.json({ success: true, ...(await authService.getSession(req.user.id)) });
};

export const updateProfile = async (req, res) => {
  res.json(await authService.updateProfile(req.user.id, req.body));
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  res.json(await authService.changePassword(req.user.id, currentPassword, newPassword));
};

export const vendorLogin = async (req, res) => {
  const session = await authService.vendorLogin(req.body);
  res.cookie('accessToken', session.accessToken, authCookieOptions);
  triggerPusherEvent('auth:login-success', {
    message: `Vendor login successful: ${session.vendor?.name || session.user.fullName}`,
    user: { id: session.user.id, fullName: session.user.fullName, email: session.user.email },
  });
  res.json(session);
};
