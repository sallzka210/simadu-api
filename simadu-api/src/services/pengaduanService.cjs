const repo = require('../repositories/pengaduanRepository.cjs');
const { forbidden, notFound } = require('../utils/httpError.cjs');

const STATUS_AWAL = 'diajukan';

function findOrFail(id) {
  const pengaduan = repo.findById(id);
  if (!pengaduan) throw notFound('Pengaduan tidak ditemukan');
  return pengaduan;
}

function assertOwner(user, pengaduan) {
  if (pengaduan.mahasiswaId !== user.mahasiswaId) {
    throw forbidden('Anda tidak berhak mengakses pengaduan ini');
  }
}

function assertEditable(pengaduan) {
  if (pengaduan.status !== STATUS_AWAL) {
    throw forbidden(`Pengaduan hanya dapat diubah atau dihapus selama berstatus "${STATUS_AWAL}"`);
  }
}

module.exports = {
  list(user, filter) {
    return user.role === 'admin' ? repo.findAll(filter) : repo.findByOwner(user.mahasiswaId, filter);
  },

  getById(user, id) {
    const pengaduan = findOrFail(id);
    if (user.role !== 'admin') assertOwner(user, pengaduan);
    return pengaduan;
  },

  // Identitas pemilik SELALU berasal dari token, bukan dari body.
  create(user, { judul, kategori, deskripsi }) {
    return repo.create({ mahasiswaId: user.mahasiswaId, judul, kategori, deskripsi });
  },

  update(user, id, data) {
    const pengaduan = findOrFail(id);
    assertOwner(user, pengaduan);
    assertEditable(pengaduan);
    return repo.update(id, data);
  },

  updateStatus(id, status) {
    findOrFail(id);
    return repo.updateStatus(id, status);
  },

  remove(user, id) {
    const pengaduan = findOrFail(id);
    assertOwner(user, pengaduan);
    assertEditable(pengaduan);
    repo.remove(id);
  },
};
