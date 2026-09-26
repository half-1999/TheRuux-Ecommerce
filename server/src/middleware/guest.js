import crypto from 'crypto';
import { asyncHandler } from '../utils/errors.js';

const GUEST_COOKIE = 'theruux_guest';

export const resolveGuest = asyncHandler(async (req, res, next) => {
  const headerToken = req.get('X-Guest-Token');
  let token = headerToken || req.cookies?.[GUEST_COOKIE];

  if (!token) {
    token = crypto.randomUUID();
    res.cookie(GUEST_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  req.guestToken = token;
  next();
});

export { GUEST_COOKIE };
