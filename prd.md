Product Requirement Document (PRD)
Proyek: Sistem Manajemen & Rekap Laporan PDF (5W Laporan)

Status: Draft

Tech Stack Utama: Next.js (App Router), Tailwind CSS (untuk desain clean & white), TypeScript (opsional tapi disarankan).

1. Ringkasan Produk (Product Overview)
Aplikasi ini adalah platform berbasis web internal (formal) yang berfungsi untuk mengumpulkan, mengarsipkan, dan merekapitulasi dokumen laporan masalah (Format PDF 5W) berdasarkan lini produksi (line) dan mesin tertentu. Tujuannya adalah memudahkan tim untuk mengunggah data lapangan dan mencarinya kembali melalui sistem filter yang efisien serta mengunduhnya dalam satu kesatuan dokumen.

2. Fitur Utama (Core Features)
A. Modul Form Input (Formulir Pengumpulan)
Halaman ini berfungsi sebagai pintu masuk data (data entry). Desain dibuat minimalis dengan latar belakang putih bersih.

Komponen Form:

Date Picker (Tanggal): Memilih tanggal kejadian/laporan. Default otomatis ke hari ini.

Line (Dropdown Select): Pilihan lini produksi terbatas pada:

Mel-Pour-Analys

Mould-RCS

Core Making

Finishing

Maintenance

Die Press

Nama Mesin (Text Input): Kolom input manual untuk nama/kode mesin.

Problem (Text Area / Input): Deskripsi singkat masalah yang terjadi.

Upload File 5W (File Input): * Validasi: Hanya menerima format .pdf.

Batasan Ukuran: Maksimal 5MB-10MB (bisa disesuaikan).

B. Modul Rekap Data (Dashboard & Table)
Halaman utama atau halaman admin untuk melihat seluruh data yang telah masuk.

Komponen:

Tabel Data: Menampilkan kolom Tanggal, Line, Nama Mesin, Problem, dan aksi (Lihat/Download).

Sistem Filter: Filter interaktif yang langsung menyaring data di tabel tanpa reload halaman penuh (memanfaatkan fitur Next.js):

Filter berdasarkan Nama Problem (Pencarian teks/keyword).

Filter berdasarkan Nama Line (Dropdown).

Filter berdasarkan Nama Mesin (Pencarian teks atau otomatis dari data yang ada).

C. Modul Download & Export Data
Fitur untuk mengunduh laporan secara formal.

Mekanisme:

Saat tombol "Download" ditekan pada baris tabel, sistem akan menghasilkan satu file terintegrasi.

Metode Implementasi: Karena Anda ingin data formulir (Keterangan) dan file PDF menjadi satu file, solusinya adalah membuat halaman export PDF baru menggunakan library seperti react-pdf atau pdf-lib di Next.js.

Sistem akan mengambil teks dari form (Tanggal, Line, dll.), menaruhnya di halaman pertama sebagai Cover/Header, kemudian menggabungkannya (merge) dengan file PDF 5W yang diunggah oleh user.

3. Desain & UX (User Experience)
Tema Warna: Clean, minimalist, corporate look.

Background: Putih bersih (#FFFFFF) dengan aksen abu-abu sangat muda (#F9FAFB atau #F3F4F6) untuk membedakan area kartu (card) atau baris tabel.

Tipografi: Menggunakan font profesional dan formal seperti Inter, Roboto, atau Geist (font bawaan Next.js terbaru).

Komponen: Menggunakan framework UI seperti Shadcn UI atau Chakra UI yang dikombinasikan dengan Tailwind CSS untuk mempercepat pembangunan komponen yang bersih dan rapi.

4. Arsitektur Teknis (Next.js Stack Proposal)
Untuk memastikan aplikasi berjalan optimal, berikut adalah rekomendasi struktur teknisnya:

Frontend & Backend: Next.js (Fullstack). Menggunakan API Routes (/api/upload dan /api/download) untuk menangani file PDF.

Penyimpanan File (Storage): PDF yang diunggah perlu disimpan di tempat yang aman (misalnya: Folder lokal public/uploads untuk tahap awal, atau Cloud Storage seperti AWS S3 / Supabase Storage jika ingin production-ready).

Database: PostgreSQL, MySQL, atau SQLite untuk menyimpan teks form (Tanggal, Line, Nama Mesin, Problem, dan path/link ke file PDF).

PDF Library: pdf-lib (Node.js) untuk menggabungkan teks keterangan form ke dalam file PDF yang diunduh.

5. Rencana Tahapan Kerja (Milestones)
Fase 1: Setup Project Next.js & Desain UI Kamus (Form & Tabel Kosong).

Fase 2: Pembuatan Database & Integrasi Form API (Upload PDF & Simpan Teks).

Fase 3: Pembuatan Halaman Rekap & Fungsi Filter Data.

Fase 4: Pengembangan Fitur Merge & Download PDF (Menggabungkan info form + PDF asli).

Fase 5: Testing & Finishing Desain.

