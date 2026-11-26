require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 16) {
  throw new Error('JWT_SECRET wajib diisi (minimal 16 karakter). Salin .env.example menjadi .env.');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
};
