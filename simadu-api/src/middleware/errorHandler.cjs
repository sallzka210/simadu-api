const { HttpError } = require('../utils/httpError.cjs');

function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' } });
}

// Error handler terpusat. Detail internal hanya ditulis ke log server
// (tanpa header Authorization / token / password), tidak dikirim ke client.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    const error = { code: err.code, message: err.message };
    if (err.details) error.details = err.details;
    return res.status(err.status).json({ success: false, error });
  }

  // Kesalahan dari body parser: JSON rusak, body terlalu besar, dsb.
  if (typeof err.type === 'string' && err.type.startsWith('entity.')) {
    const message = err.type === 'entity.parse.failed' ? 'Format JSON tidak valid' : 'Body permintaan tidak dapat diproses';
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message } });
  }

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Terjadi kesalahan pada server' } });
}

module.exports = { notFound, errorHandler };
