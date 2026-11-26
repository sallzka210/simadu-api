const { badRequest } = require('../utils/httpError.cjs');

const KATEGORI = ['Fasilitas', 'Akademik', 'TI'];
const STATUS = ['diajukan', 'diproses', 'selesai'];

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// rules: { field: { min, max } | { enum: [...] } }. Hasil bersih ditaruh di req.validated.
function parseObject(source, rules, { required }) {
  if (!isPlainObject(source)) {
    throw badRequest('Body harus berupa objek JSON dengan header Content-Type: application/json');
  }

  const errors = [];
  const clean = {};

  for (const key of Object.keys(source)) {
    if (!Object.hasOwn(rules, key)) errors.push({ field: key, message: 'Field tidak diperbolehkan' });
  }

  for (const [field, rule] of Object.entries(rules)) {
    const value = source[field];
    if (value === undefined || value === null) {
      if (required) errors.push({ field, message: 'Field wajib diisi' });
      continue;
    }
    if (typeof value !== 'string') {
      errors.push({ field, message: 'Harus berupa string' });
      continue;
    }
    const text = value.trim();
    if (!text) {
      errors.push({ field, message: 'Tidak boleh kosong' });
    } else if (rule.enum) {
      if (rule.enum.includes(text)) clean[field] = text;
      else errors.push({ field, message: `Harus salah satu dari: ${rule.enum.join(', ')}` });
    } else if (text.length < rule.min || text.length > rule.max) {
      errors.push({ field, message: `Panjang harus ${rule.min}-${rule.max} karakter` });
    } else {
      clean[field] = text;
    }
  }

  if (errors.length) throw badRequest('Validasi gagal', errors);
  return clean;
}

const PENGADUAN_RULES = {
  judul: { min: 5, max: 100 },
  kategori: { enum: KATEGORI },
  deskripsi: { min: 10, max: 2000 },
};

module.exports = {
  validateLogin(req, res, next) {
    req.validated = parseObject(req.body, { username: { min: 1, max: 50 }, password: { min: 1, max: 100 } }, { required: true });
    next();
  },
  validateCreate(req, res, next) {
    req.validated = parseObject(req.body, PENGADUAN_RULES, { required: true });
    next();
  },
  // PUT = penggantian penuh: ketiga field wajib ada.
  validateUpdate(req, res, next) {
    req.validated = parseObject(req.body, PENGADUAN_RULES, { required: true });
    next();
  },
  validateStatus(req, res, next) {
    req.validated = parseObject(req.body, { status: { enum: STATUS } }, { required: true });
    next();
  },
  validateListQuery(req, res, next) {
    req.validated = parseObject(req.query, { status: { enum: STATUS }, kategori: { enum: KATEGORI } }, { required: false });
    next();
  },
  validateId(req, res, next) {
    if (!/^[1-9]\d{0,9}$/.test(req.params.id)) {
      throw badRequest('Parameter id harus berupa bilangan bulat positif');
    }
    next();
  },
};
