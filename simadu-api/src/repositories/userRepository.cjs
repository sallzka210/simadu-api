const bcrypt = require('bcryptjs');
const config = require('../config.cjs');

// Data uji awal: 1 administrator + 2 mahasiswa. Password disimpan sebagai HASH.
// (Password plaintext untuk pengujian ada di README.md.)
const users = [
  { id: 1, username: 'admin', nama: 'Administrator SIMADU', role: 'admin', mahasiswaId: null, passwordHash: bcrypt.hashSync('Admin#12345', config.bcryptRounds) },
  { id: 2, username: 'mhs001', nama: 'Budi Santoso', role: 'mahasiswa', mahasiswaId: 'MHS001', passwordHash: bcrypt.hashSync('Mahasiswa#001', config.bcryptRounds) },
  { id: 3, username: 'mhs002', nama: 'Siti Aminah', role: 'mahasiswa', mahasiswaId: 'MHS002', passwordHash: bcrypt.hashSync('Mahasiswa#002', config.bcryptRounds) },
];

module.exports = {
  findByUsername: (username) => users.find((u) => u.username === username) || null,
  findById: (id) => users.find((u) => u.id === id) || null,
};
