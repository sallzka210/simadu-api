// Penyimpanan array dalam memori. Semua fungsi mengembalikan SALINAN objek
// agar lapisan lain tidak bisa mengubah data tanpa melewati repository.
const data = [
  { id: 1, mahasiswaId: 'MHS001', judul: 'AC ruang kelas B2 rusak', kategori: 'Fasilitas', deskripsi: 'AC di ruang B2 tidak dingin sejak dua minggu terakhir.', status: 'diajukan', createdAt: '2026-11-02T08:15:00.000Z' },
  { id: 2, mahasiswaId: 'MHS002', judul: 'Nilai UTS belum muncul di SIAKAD', kategori: 'Akademik', deskripsi: 'Nilai UTS mata kuliah Basis Data belum tampil di SIAKAD.', status: 'diajukan', createdAt: '2026-11-03T09:30:00.000Z' },
  { id: 3, mahasiswaId: 'MHS001', judul: 'WiFi perpustakaan sering putus', kategori: 'TI', deskripsi: 'Koneksi WiFi di lantai 2 perpustakaan putus-nyambung setiap jam.', status: 'diproses', createdAt: '2026-11-04T10:00:00.000Z' },
];
let nextId = 4;

const clone = (o) => ({ ...o });

function applyFilter(list, { status, kategori } = {}) {
  return list.filter((p) => (!status || p.status === status) && (!kategori || p.kategori === kategori));
}

module.exports = {
  findAll: (filter) => applyFilter(data, filter).map(clone),
  findByOwner: (mahasiswaId, filter) => applyFilter(data.filter((p) => p.mahasiswaId === mahasiswaId), filter).map(clone),
  findById: (id) => {
    const found = data.find((p) => p.id === id);
    return found ? clone(found) : null;
  },
  create: ({ mahasiswaId, judul, kategori, deskripsi }) => {
    const item = { id: nextId++, mahasiswaId, judul, kategori, deskripsi, status: 'diajukan', createdAt: new Date().toISOString() };
    data.push(item);
    return clone(item);
  },
  update: (id, { judul, kategori, deskripsi }) => {
    const item = data.find((p) => p.id === id);
    Object.assign(item, { judul, kategori, deskripsi });
    return clone(item);
  },
  updateStatus: (id, status) => {
    const item = data.find((p) => p.id === id);
    item.status = status;
    return clone(item);
  },
  remove: (id) => {
    const idx = data.findIndex((p) => p.id === id);
    data.splice(idx, 1);
  },
};
