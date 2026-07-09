# Design: Sistem Manajemen & Rekap Laporan PDF (5W Laporan)

**Date:** 2026-07-09
**Status:** Approved
**Source PRD:** `prd.md`

## 1. Overview

Aplikasi web internal untuk mengumpulkan, mengarsipkan, dan merekapitulasi
laporan masalah (format PDF 5W) berdasarkan line produksi dan mesin. Tim
mengunggah data lapangan via form, mencarinya lewat filter, dan mengunduhnya
sebagai satu dokumen PDF gabungan (cover berisi data form + PDF 5W asli).

Tidak ada sistem login pada tahap ini — aplikasi diakses langsung oleh siapa
saja yang punya akses ke link internal.

## 2. Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript, fullstack (Route
  Handlers untuk API, tidak ada backend terpisah).
- **Database:** PostgreSQL, di-host di Neon (cloud, serverless).
- **ORM:** Prisma — type-safety end-to-end dan migration terkelola.
- **File storage:** Lokal di `public/uploads/`, path direferensikan dari
  kolom `filePath` di DB. Nama file di-random (uuid) saat disimpan untuk
  menghindari collision dan path traversal dari nama file asli.
- **UI:** Tailwind CSS + Shadcn UI (table, select, date picker, dialog,
  input, textarea, button, toast/sonner).
- **PDF generation:** `@react-pdf/renderer` untuk membangun halaman cover
  (styled, formal) dari data form → buffer PDF di server. Digabung dengan
  `pdf-lib` (append halaman-halaman dari PDF 5W asli setelah cover) menjadi
  satu file PDF hasil akhir untuk diunduh.
- **Validasi:** Zod sebagai single source of truth di server, react-hook-form
  + Zod resolver di client untuk pesan validasi instan.

## 3. Data Model (Prisma schema)

```prisma
model Report {
  id        String   @id @default(cuid())
  date      DateTime
  line      Line
  machine   String
  problem   String
  fileName  String   // nama asli file yang diupload (untuk ditampilkan)
  filePath  String   // path relatif di public/uploads
  fileSize  Int
  createdAt DateTime @default(now())
}

enum Line {
  MEL_POUR_ANALYS
  MOULD_RCS
  CORE_MAKING
  FINISHING
  MAINTENANCE
  DIE_PRESS
}
```

Tidak ada tabel user/auth pada tahap ini.

## 4. Halaman & Alur

### a. `/` — Form Input

- Card putih bersih berisi form: Date Picker (default hari ini), Select Line
  (6 opsi tetap dari enum `Line`), Input Nama Mesin, Textarea Problem, File
  Input (`.pdf` only, validasi client + server, maksimal 10MB).
- Submit → `POST /api/reports` (multipart/form-data) → server memvalidasi,
  menyimpan file ke `public/uploads/<uuid>.pdf`, insert row ke DB → toast
  sukses → form direset.
- Error validasi (file bukan PDF, > 10MB, field kosong) ditampilkan inline
  per-field tanpa reload halaman (client-side validation dulu, server-side
  sebagai safety net).

### b. `/rekap` — Dashboard & Table

- Filter bar di atas tabel: text search Problem (debounced), Select Line
  (termasuk opsi "Semua Line"), text search Nama Mesin. Semua filter
  mengubah query params URL (`?line=...&q=...&machine=...&page=...`) dan
  fetch ulang data tanpa full page reload (client component + fetch ke
  `GET /api/reports`).
- Tabel (Shadcn Table): kolom Tanggal, Line, Nama Mesin, Problem (truncated
  dengan tooltip untuk teks penuh), Aksi (Lihat = buka PDF asli di tab baru,
  Download = trigger merge + download).
- Pagination 20 baris per halaman, tombol prev/next + info "Halaman X dari
  Y".

### c. Download / Export

- Klik "Download" pada baris → `GET /api/reports/:id/download` → server
  mengambil data report, merender cover PDF dengan `@react-pdf/renderer`
  (berisi header formal: judul, Tanggal, Line, Nama Mesin, Problem), membaca
  file 5W asli dari `public/uploads`, menggabungkan dengan `pdf-lib` (cover
  jadi halaman 1, diikuti seluruh halaman PDF asli), lalu stream hasil
  sebagai response dengan header
  `Content-Disposition: attachment; filename="Laporan-<line>-<tanggal>.pdf"`.
- File hasil gabungan tidak disimpan/di-cache di server — dibuat ulang tiap
  request agar selalu sinkron dengan data terbaru.

## 5. Error Handling & Validasi

- **Upload:** client-side cek ekstensi `.pdf` dan ukuran sebelum submit;
  server-side re-validasi MIME type dari magic bytes (bukan hanya ekstensi
  nama file) dan ukuran (limit 10MB) — reject dengan pesan jelas jika tidak
  sesuai.
- **Field wajib:** Date, Line, Nama Mesin, Problem, File — semua wajib
  diisi, divalidasi via Zod schema yang sama di client dan server.
- **Download saat file hilang:** jika `filePath` di DB tidak ditemukan di
  disk (edge case, misal terhapus manual), API mengembalikan 404 dengan
  pesan yang ditampilkan sebagai toast error di tabel, bukan crash.
- **DB/network error:** ditangkap di Route Handler, response JSON
  `{ error: string }` dengan status code sesuai, ditampilkan sebagai toast
  di UI.

## 6. Testing

- Testing manual melalui verifikasi end-to-end setelah implementasi: submit
  form dengan PDF valid → cek muncul di tabel → filter by Line/Problem/Mesin
  → download → buka hasil PDF, pastikan cover + PDF asli tergabung dengan
  benar dan urutan halaman sesuai.
- Tidak ada automated test suite di scope awal ini (tidak diminta PRD,
  project baru dimulai) — bisa ditambahkan di fase berikutnya jika
  dibutuhkan.

## 7. Out of Scope (tahap ini)

- Autentikasi/login user.
- Cloud file storage (Supabase Storage / S3) — pakai lokal `public/uploads/`
  dulu.
- Bulk export multi-row menjadi satu dokumen (hanya per-row download sesuai
  PRD).
- Edit/delete report yang sudah masuk (tidak disebutkan di PRD).
