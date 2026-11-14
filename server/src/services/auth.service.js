import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { generateSecret, verifyTotp } from '../utils/totp.js';

const REFRESH_COOKIE = 'theruux_refresh';
const SALT_ROUNDS = 12;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpires },
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), typ: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpires },
  );

export const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    // Cross-site (Vercel → Render) requires SameSite=None + Secure
    sameSite: env.cookieSecure ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? 'none' : 'lax',
    path: '/api/auth',
  });
};

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'customer',
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  const { sendWelcome } = await import('./email.service.js');
  sendWelcome({ name: user.name, email: user.email }).catch((err) =>
    console.error('[auth] welcome email failed:', err.message),
  );

  return { user: user.toSafeJSON(), accessToken, refreshToken };
};

const issueSession = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  return { user: user.toSafeJSON(), accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+totpSecret');
  if (!user || user.status !== 'active') {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.role === 'admin' && user.totpEnabled) {
    const mfaToken = jwt.sign(
      { sub: user._id.toString(), typ: 'mfa' },
      env.jwtAccessSecret,
      { expiresIn: '5m' },
    );
    return { mfaRequired: true, mfaToken };
  }

  return issueSession(user);
};

export const completeMfaLogin = async ({ mfaToken, code }) => {
  let payload;
  try {
    payload = jwt.verify(mfaToken, env.jwtAccessSecret);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticator step expired. Sign in again.');
  }
  if (payload?.typ !== 'mfa' || !payload.sub) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticator step expired. Sign in again.');
  }

  const user = await User.findById(payload.sub).select('+totpSecret');
  if (!user || user.status !== 'active' || user.role !== 'admin' || !user.totpEnabled) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authenticator step expired. Sign in again.');
  }
  if (!verifyTotp(user.totpSecret, code)) {
    throw new AppError(401, 'INVALID_CODE', 'Authenticator code is wrong');
  }

  return issueSession(user);
};

export const beginAdminMfa = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'admin') {
    throw new AppError(403, 'FORBIDDEN', 'Admin only');
  }
  const secret = generateSecret();
  user.totpTempSecret = secret;
  await user.save();
  const label = encodeURIComponent(user.email);
  return {
    secret,
    otpauthUrl: `otpauth://totp/TheRuux:${label}?secret=${secret}&issuer=TheRuux&algorithm=SHA1&digits=6&period=30`,
  };
};

export const confirmAdminMfa = async (userId, code) => {
  const user = await User.findById(userId).select('+totpTempSecret');
  if (!user?.totpTempSecret || !verifyTotp(user.totpTempSecret, code)) {
    throw new AppError(400, 'INVALID_CODE', 'That code did not match. Use the current code from your authenticator.');
  }
  user.totpSecret = user.totpTempSecret;
  user.totpTempSecret = null;
  user.totpEnabled = true;
  await user.save();
  return user.toSafeJSON();
};

export const disableAdminMfa = async (userId, { password, code }) => {
  const user = await User.findById(userId).select('+totpSecret +passwordHash');
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Sign in again');
  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk || !verifyTotp(user.totpSecret, code)) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Password or authenticator code is wrong');
  }
  user.totpEnabled = false;
  user.totpSecret = null;
  user.totpTempSecret = null;
  await user.save();
  return user.toSafeJSON();
};

export const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError(401, 'UNAUTHORIZED', 'Refresh token missing');
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') {
    throw new AppError(401, 'UNAUTHORIZED', 'User unavailable');
  }

  if (!user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Refresh token revoked');
  }

  const accessToken = signAccessToken(user);
  const nextRefresh = signRefreshToken(user);
  user.refreshTokenHash = hashToken(nextRefresh);
  await user.save();

  return { user: user.toSafeJSON(), accessToken, refreshToken: nextRefresh };
};

export const logoutUser = async (userId, res) => {
  if (userId) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }
  clearRefreshCookie(res);
};

export { REFRESH_COOKIE };
