const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config.cjs');
const userRepository = require('../repositories/userRepository.cjs');
const { unauthorized } = require('../utils/httpError.cjs');

// Hash tiruan agar waktu respons tetap mirip saat username tidak ada
// (mengurangi risiko user enumeration lewat timing).
const DUMMY_HASH = bcrypt.hashSync('dummy-password', config.bcryptRounds);

async function login(username, password) {
  const user = userRepository.findByUsername(username);
  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

  // Pesan sengaja sama untuk "username salah" dan "password salah".
  if (!user || !passwordOk) throw unauthorized('Username atau password salah');

  const accessToken = jwt.sign({ role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
  });

  return {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: config.jwtExpiresIn,
    user: { id: user.id, username: user.username, nama: user.nama, role: user.role },
  };
}

module.exports = { login };
