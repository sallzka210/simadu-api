// Pengujian otomatis (node:test). Server dijalankan pada port acak, data seed dimulai dari awal.
process.env.JWT_SECRET = 'rahasia-khusus-pengujian-1234567890';
process.env.BCRYPT_ROUNDS = '4';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../app.cjs');

let server;
let base;
const tokens = {};

async function call(method, path, { token, body, raw, headers } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const login = (username, password) => call('POST', '/api/auth/login', { body: { username, password } });
const valid = { judul: 'Proyektor ruang B3 mati', kategori: 'Fasilitas', deskripsi: 'Proyektor di ruang B3 tidak menyala sejak Senin.' };

before(async () => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

describe('Skenario UTS (12 skenario wajib)', () => {
  it('1. Login kredensial benar -> 200, token diterima', async () => {
    const r = await login('mhs001', 'Mahasiswa#001');
    assert.equal(r.status, 200);
    assert.ok(r.body.data.accessToken);
    tokens.mhs1 = r.body.data.accessToken;
    tokens.mhs2 = (await login('mhs002', 'Mahasiswa#002')).body.data.accessToken;
    tokens.admin = (await login('admin', 'Admin#12345')).body.data.accessToken;
    assert.notEqual(tokens.mhs1, tokens.mhs2); // token tidak sama untuk semua pengguna
  });

  it('2. Login password salah -> 401', async () => {
    const r = await login('mhs001', 'salah');
    assert.equal(r.status, 401);
    assert.equal(r.body.success, false);
  });

  it('3. Endpoint terlindungi tanpa token -> 401', async () => {
    assert.equal((await call('GET', '/api/pengaduan')).status, 401);
  });

  it('4. Token tidak valid -> 401 (juga token kedaluwarsa & alg=none)', async () => {
    assert.equal((await call('GET', '/api/pengaduan', { token: 'abc.def.ghi' })).status, 401);
    const expired = jwt.sign({ role: 'mahasiswa', sub: '2', exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET);
    const r = await call('GET', '/api/pengaduan', { token: expired });
    assert.equal(r.status, 401);
    assert.match(r.body.error.message, /kedaluwarsa/);
    const none = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url') + '.' + Buffer.from('{"sub":"1","role":"admin"}').toString('base64url') + '.';
    assert.equal((await call('GET', '/api/pengaduan', { token: none })).status, 401);
  });

  it('5. Mahasiswa membuat pengaduan valid -> 201, pemilik dari token', async () => {
    const r = await call('POST', '/api/pengaduan', { token: tokens.mhs1, body: valid });
    assert.equal(r.status, 201);
    assert.equal(r.body.data.mahasiswaId, 'MHS001');
    assert.equal(r.body.data.status, 'diajukan');
    assert.ok(Number.isInteger(r.body.data.id));
    tokens.newId = r.body.data.id;
  });

  it('6. Mahasiswa membaca pengaduan sendiri -> 200', async () => {
    const r = await call('GET', `/api/pengaduan/${tokens.newId}`, { token: tokens.mhs1 });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.mahasiswaId, 'MHS001');
  });

  it('7. Mahasiswa membaca pengaduan orang lain -> 403', async () => {
    assert.equal((await call('GET', '/api/pengaduan/2', { token: tokens.mhs1 })).status, 403);
  });

  it('8. Mahasiswa mengubah status -> 403', async () => {
    const r = await call('PATCH', '/api/pengaduan/1/status', { token: tokens.mhs1, body: { status: 'selesai' } });
    assert.equal(r.status, 403);
    assert.equal((await call('GET', '/api/pengaduan/1', { token: tokens.mhs1 })).body.data.status, 'diajukan');
  });

  it('9. Admin melihat seluruh pengaduan -> 200', async () => {
    const r = await call('GET', '/api/pengaduan', { token: tokens.admin });
    assert.equal(r.status, 200);
    const owners = new Set(r.body.data.map((p) => p.mahasiswaId));
    assert.ok(owners.has('MHS001') && owners.has('MHS002'));
  });

  it('10. Admin memperbarui status -> 200', async () => {
    const r = await call('PATCH', '/api/pengaduan/2/status', { token: tokens.admin, body: { status: 'diproses' } });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.status, 'diproses');
    assert.equal(r.body.data.mahasiswaId, 'MHS002'); // pemilik tidak berubah
  });

  it('11. Membuat pengaduan dengan field wajib kosong -> 400', async () => {
    const r = await call('POST', '/api/pengaduan', { token: tokens.mhs1, body: { judul: '', kategori: 'TI' } });
    assert.equal(r.status, 400);
    assert.ok(r.body.error.details.length >= 2);
  });

  it('12. ID tidak ditemukan -> 404', async () => {
    assert.equal((await call('GET', '/api/pengaduan/9999', { token: tokens.admin })).status, 404);
  });
});

describe('Pengujian keamanan tambahan', () => {
  it('Mahasiswa hanya melihat pengaduan miliknya', async () => {
    const r = await call('GET', '/api/pengaduan', { token: tokens.mhs2 });
    assert.equal(r.status, 200);
    assert.ok(r.body.data.every((p) => p.mahasiswaId === 'MHS002'));
  });

  it('Client tidak boleh menentukan id / mahasiswaId / status -> 400', async () => {
    const r = await call('POST', '/api/pengaduan', { token: tokens.mhs1, body: { ...valid, id: 99, mahasiswaId: 'MHS002', status: 'selesai' } });
    assert.equal(r.status, 400);
    const fields = r.body.error.details.map((d) => d.field).sort();
    assert.deepEqual(fields, ['id', 'mahasiswaId', 'status']);
  });

  it('Admin tidak boleh membuat pengaduan -> 403', async () => {
    assert.equal((await call('POST', '/api/pengaduan', { token: tokens.admin, body: valid })).status, 403);
  });

  it('Input ditolak tidak mengubah data (before == after)', async () => {
    const before = (await call('GET', `/api/pengaduan/${tokens.newId}`, { token: tokens.mhs1 })).body.data;
    const bad = await call('PUT', `/api/pengaduan/${tokens.newId}`, { token: tokens.mhs1, body: { judul: 'x', kategori: 'Salah', deskripsi: '' } });
    assert.equal(bad.status, 400);
    const after = (await call('GET', `/api/pengaduan/${tokens.newId}`, { token: tokens.mhs1 })).body.data;
    assert.deepEqual(after, before);
  });

  it('Mahasiswa mengubah pengaduan sendiri (status diajukan) -> 200', async () => {
    const r = await call('PUT', `/api/pengaduan/${tokens.newId}`, { token: tokens.mhs1, body: { ...valid, judul: 'Proyektor B3 sudah diperiksa' } });
    assert.equal(r.status, 200);
    assert.equal(r.body.data.judul, 'Proyektor B3 sudah diperiksa');
  });

  it('Mengubah pengaduan milik orang lain -> 403', async () => {
    assert.equal((await call('PUT', '/api/pengaduan/1', { token: tokens.mhs2, body: valid })).status, 403);
  });

  it('Mengubah / menghapus pengaduan yang sudah diproses -> 403', async () => {
    assert.equal((await call('PUT', '/api/pengaduan/3', { token: tokens.mhs1, body: valid })).status, 403);
    assert.equal((await call('DELETE', '/api/pengaduan/3', { token: tokens.mhs1 })).status, 403);
  });

  it('Menghapus pengaduan orang lain -> 403 dan data tetap ada', async () => {
    assert.equal((await call('DELETE', '/api/pengaduan/1', { token: tokens.mhs2 })).status, 403);
    assert.equal((await call('GET', '/api/pengaduan/1', { token: tokens.admin })).status, 200);
  });

  it('Admin tidak boleh menghapus -> 403', async () => {
    assert.equal((await call('DELETE', '/api/pengaduan/1', { token: tokens.admin })).status, 403);
  });

  it('Mahasiswa menghapus pengaduan sendiri -> 200, lalu 404', async () => {
    assert.equal((await call('DELETE', `/api/pengaduan/${tokens.newId}`, { token: tokens.mhs1 })).status, 200);
    assert.equal((await call('GET', `/api/pengaduan/${tokens.newId}`, { token: tokens.mhs1 })).status, 404);
  });

  it('Status tidak valid -> 400, id bukan angka -> 400', async () => {
    assert.equal((await call('PATCH', '/api/pengaduan/1/status', { token: tokens.admin, body: { status: 'batal' } })).status, 400);
    assert.equal((await call('GET', '/api/pengaduan/abc', { token: tokens.admin })).status, 400);
  });

  it('JSON rusak -> 400 tanpa membocorkan detail', async () => {
    const r = await call('POST', '/api/pengaduan', { token: tokens.mhs1, raw: '{judul:' });
    assert.equal(r.status, 400);
    assert.equal(r.body.error.message, 'Format JSON tidak valid');
  });

  it('Endpoint tidak dikenal -> 404 berformat JSON', async () => {
    const r = await call('GET', '/api/tidak-ada', {});
    assert.equal(r.status, 404);
    assert.equal(r.body.success, false);
  });
});
