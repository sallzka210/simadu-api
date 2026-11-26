const jwt = require('jsonwebtoken');
const config = require('../config.cjs');
const userRepository = require('../repositories/userRepository.cjs');
const { unauthorized, forbidden } = require('../utils/httpError.cjs');

// AUTENTIKASI: "siapa kamu?" -> 401 bila token tidak ada / tidak valid / kedaluwarsa.
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) throw unauthorized('Token autentikasi tidak ditemukan');

  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw unauthorized('Format Authorization harus: Bearer <token>');
  }

  let payload;
  try {
    // Algoritma dikunci ke HS256 agar tidak bisa diganti oleh penyerang (mis. alg=none).
    payload = jwt.verify(parts[1], config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    throw unauthorized(err.name === 'TokenExpiredError' ? 'Token telah kedaluwarsa' : 'Token tidak valid');
  }

  const user = userRepository.findById(Number(payload.sub));
  if (!user) throw unauthorized('Token tidak valid');

  // Role & identitas diambil dari data server, bukan dipercaya dari klaim token semata.
  req.user = { id: user.id, username: user.username, role: user.role, mahasiswaId: user.mahasiswaId };
  next();
}

// OTORISASI (berbasis role): "bolehkah kamu?" -> 403 bila role tidak diizinkan.
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw forbidden('Role Anda tidak diizinkan melakukan operasi ini');
    }
    next();
  };
}

module.exports = { authenticate, authorize };
