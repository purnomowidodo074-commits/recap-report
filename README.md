# Rekap Laporan 5W

Sistem manajemen dan rekap laporan PDF 5W berdasarkan line produksi dan mesin.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a free PostgreSQL database at [Neon](https://neon.tech) and copy the
   connection string.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Neon connection
   string.
4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000` to submit a report, and `http://localhost:3000/rekap`
   to browse, filter, and download reports.

Uploaded PDFs are stored locally under `public/uploads/` and are not committed
to git.
