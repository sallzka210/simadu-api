# SIMADU API

REST API **Sistem Layanan Informasi dan Pengaduan Mahasiswa** — UTS Web Service Engineering 2026.
Dibangun dengan Node.js, Express 5, JWT (Bearer Token), bcrypt, dan OpenAPI/Swagger UI.

## Prasyarat
- Node.js **20 atau lebih baru** (`node -v`)
- npm (bawaan Node.js)
- Postman / HTTP Client (opsional, untuk pengujian manual)

## Instalasi
```bash
git clone <url-repository>
cd simadu-api
npm install
```

## Konfigurasi
Salin `.env.example` menjadi `.env`, lalu isi nilainya.

| Variabel | Wajib | Keterangan |
|---|---|---|
| `JWT_SECRET` | Ya | Kunci penandatangan token, minimal 16 karakter. Server menolak start bila kosong. |
| `JWT_EXPIRES_IN` | Tidak | Masa berlaku token, default `15m`. |
| `PORT` | Tidak | Default `3000`. |
| `BCRYPT_ROUNDS` | Tidak | Default `10`. |

Membuat secret acak:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Menjalankan
```bash
npm start        # produksi/demonstrasi
npm run dev      # auto-restart saat file berubah
npm test         # pengujian otomatis (node:test)
```
- API: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`
- Berkas OpenAPI: `docs/openapi.json`

## Akun uji (data seed)
| Username | Password | Role | mahasiswaId |
|---|---|---|---|
| `admin` | `Admin#12345` | admin | - |
| `mhs001` | `Mahasiswa#001` | mahasiswa | MHS001 |
| `mhs002` | `Mahasiswa#002` | mahasiswa | MHS002 |

Password disimpan sebagai hash bcrypt (lihat `src/repositories/userRepository.cjs`). Data pengaduan awal: id 1 (MHS001, `diajukan`), id 2 (MHS002, `diajukan`), id 3 (MHS001, `diproses`). Data disimpan di memori, sehingga kembali ke kondisi awal setiap server di-restart.

## Kontrak endpoint
| Metode | Endpoint | Fungsi | Akses | Sukses | Gagal |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | Login, mendapat token | Publik | 200 | 400, 401 |
| GET | `/api/pengaduan` | Daftar pengaduan (mahasiswa: miliknya; admin: semua). Filter opsional `?status=&kategori=` | Login | 200 | 400, 401 |
| GET | `/api/pengaduan/:id` | Detail pengaduan | Pemilik / admin | 200 | 400, 401, 403, 404 |
| POST | `/api/pengaduan` | Membuat pengaduan | Mahasiswa | 201 | 400, 401, 403 |
| PUT | `/api/pengaduan/:id` | Mengubah judul, kategori, deskripsi | Pemilik, status `diajukan` | 200 | 400, 401, 403, 404 |
| PATCH | `/api/pengaduan/:id/status` | Mengubah status | Admin | 200 | 400, 401, 403, 404 |
| DELETE | `/api/pengaduan/:id` | Menghapus pengaduan | Pemilik, status `diajukan` | 200 | 400, 401, 403, 404 |

Kesalahan tak terduga selalu menghasilkan **500** dengan pesan generik.

### Contoh JSON
Login:
```json
// POST /api/auth/login
{ "username": "mhs001", "password": "Mahasiswa#001" }
// 200
{ "success": true, "message": "Login berhasil",
  "data": { "accessToken": "eyJ...", "tokenType": "Bearer", "expiresIn": "15m",
            "user": { "id": 2, "username": "mhs001", "nama": "Budi Santoso", "role": "mahasiswa" } } }
```
Membuat pengaduan (header `Authorization: Bearer <token>`):
```json
// POST /api/pengaduan
{ "judul": "Proyektor ruang B3 mati", "kategori": "Fasilitas", "deskripsi": "Proyektor di ruang B3 tidak menyala sejak Senin." }
// 201
{ "success": true, "message": "Pengaduan berhasil dibuat",
  "data": { "id": 4, "mahasiswaId": "MHS001", "judul": "Proyektor ruang B3 mati", "kategori": "Fasilitas",
            "deskripsi": "Proyektor di ruang B3 tidak menyala sejak Senin.", "status": "diajukan",
            "createdAt": "2026-11-24T02:10:00.000Z" } }
```
Mengubah status (admin): `PATCH /api/pengaduan/4/status` dengan body `{ "status": "diproses" }`.

### Format respons kesalahan (konsisten)
```json
{ "success": false,
  "error": { "code": "BAD_REQUEST", "message": "Validasi gagal",
             "details": [ { "field": "judul", "message": "Field wajib diisi" } ] } }
```

| Status | Arti di API ini |
|---|---|
| 400 | Input tidak valid: field kosong/salah tipe, field tidak diperbolehkan (`id`, `mahasiswaId`, `status`, dll. pada POST/PUT), JSON rusak, id bukan angka |
| 401 | Token tidak ada, format salah, tidak valid, atau kedaluwarsa; login gagal |
| 403 | Sudah login tetapi tidak berhak: role salah, bukan pemilik, atau pengaduan sudah tidak berstatus `diajukan` |
| 404 | Pengaduan atau endpoint tidak ditemukan |
| 500 | Kesalahan server (detail hanya di log server) |

## Autentikasi
1. `POST /api/auth/login` mengembalikan JWT (HS256) berisi `sub` (id pengguna), `role`, dan `exp`.
2. Kirim di setiap permintaan: `Authorization: Bearer <accessToken>`.
3. Server memverifikasi tanda tangan, algoritma (hanya HS256), dan masa berlaku, lalu memuat ulang pengguna dari penyimpanan. Token berbeda untuk tiap pengguna dan kedaluwarsa sesuai `JWT_EXPIRES_IN`.
4. Di Swagger UI: klik **Authorize**, tempel token (tanpa kata `Bearer`).

## Matriks hak akses
| Operasi | Mahasiswa | Admin |
|---|---|---|
| Melihat pengaduan sendiri | ✓ | ✓ |
| Melihat semua pengaduan | × | ✓ |
| Membuat pengaduan | ✓ | × |
| Mengubah pengaduan sendiri (status `diajukan`) | ✓ | × |
| Menghapus pengaduan sendiri (status `diajukan`) | ✓ | × |
| Mengubah status pengaduan | × | ✓ |

Admin tidak dapat mengubah identitas pemilik karena `mahasiswaId` tidak dapat diubah lewat endpoint mana pun.

## Struktur proyek & pembagian tanggung jawab
```
simadu-api/
├── app.cjs                      # Merakit Express: middleware global, route, Swagger, error handler
├── server.cjs                   # Menjalankan server (listen)
├── docs/openapi.json            # Kontrak OpenAPI 3.0
├── tests/simadu.test.cjs        # Pengujian otomatis (12 skenario UTS + skenario keamanan tambahan)
└── src/
    ├── routes/                  # Memetakan URL + metode HTTP ke rantai middleware dan controller
    ├── middleware/              # auth (autentikasi & otorisasi role), validate (validasi input), errorHandler
    ├── controllers/             # Lapisan HTTP: membaca req.validated/req.user, memilih status & bentuk respons
    ├── services/                # Aturan bisnis: kepemilikan, status "diajukan", identitas pemilik dari token, login/JWT
    ├── repositories/            # Akses data (array dalam memori); satu-satunya yang menyentuh data
    └── utils/httpError.cjs      # Kelas error dengan status HTTP
```
Alur permintaan: **Route → authenticate → authorize(role) → validasi → Controller → Service → Repository**. Error apa pun dilempar sebagai `HttpError` dan ditangkap `errorHandler`, yang menyusun respons seragam tanpa membocorkan detail internal.

## Pengujian
`npm test` menjalankan semua skenario (12 skenario wajib UTS, termasuk token kedaluwarsa, token `alg=none`, bukti bahwa input ditolak tidak mengubah data, serta pengujian kepemilikan). Untuk pengujian manual, gunakan Swagger UI atau Postman dengan akun uji di atas dan catat respons aktualnya ke laporan.

## Catatan untuk produksi
Gunakan HTTPS/TLS, simpan data di database, simpan `JWT_SECRET` di secret manager, tambahkan rate limiting pada login, header keamanan (helmet), pengaturan CORS, refresh token/pencabutan token, audit log tanpa token/password, dan pengujian otomatis di CI.
