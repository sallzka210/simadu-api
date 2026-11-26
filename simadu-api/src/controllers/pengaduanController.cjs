const service = require('../services/pengaduanService.cjs');

exports.list = (req, res) => {
  const data = service.list(req.user, req.validated);
  res.json({ success: true, data });
};

exports.getById = (req, res) => {
  res.json({ success: true, data: service.getById(req.user, Number(req.params.id)) });
};

exports.create = (req, res) => {
  const data = service.create(req.user, req.validated);
  res.status(201).location(`/api/pengaduan/${data.id}`).json({ success: true, message: 'Pengaduan berhasil dibuat', data });
};

exports.update = (req, res) => {
  const data = service.update(req.user, Number(req.params.id), req.validated);
  res.json({ success: true, message: 'Pengaduan berhasil diubah', data });
};

exports.updateStatus = (req, res) => {
  const data = service.updateStatus(Number(req.params.id), req.validated.status);
  res.json({ success: true, message: 'Status pengaduan berhasil diperbarui', data });
};

exports.remove = (req, res) => {
  service.remove(req.user, Number(req.params.id));
  res.json({ success: true, message: 'Pengaduan berhasil dihapus' });
};
