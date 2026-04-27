const jwt = require('jsonwebtoken');

const generateToken = (res, id) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '15m', // Short-lived
  });

  const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
    expiresIn: '7d', // Long-lived
  });

  // Set Refresh Token in HttpOnly Secure Cookie
  res.cookie('jwt_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return accessToken;
};

module.exports = generateToken;
