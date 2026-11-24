# Execution Roadmap — TixFlow

> Kerjakan satu fase secara berurutan. Pastikan setiap fase teruji sebelum lanjut ke fase berikutnya.

## Fase 1: Infrastruktur Database & Prisma Setup
- [ ] Buat `docker-compose.yml` di root untuk menjalankan service `postgres` (PostgreSQL 16).
- [ ] Inisialisasi proyek `backend` (Node.js + TypeScript + Prisma).
- [ ] Tulis `backend/prisma/schema.prisma` sesuai `docs/ARCHITECTURE.md` (termasuk constraint `remaining_quota >= 0`).
- [ ] Jalankan migrasi database (`npx prisma migrate dev`).
- [ ] Buat `backend/prisma/seed.ts` berisi 1 akun `PANITIA`, 1 akun `PARTICIPANT`, dan 1 event contoh dengan kuota terbatas.

## Fase 2: Core Backend API, RBAC & Swagger Docs
- [ ] Setup server Express + TypeScript dengan `helmet`, `cors`, `cookie-parser`, dan `express-rate-limit`.
- [ ] Buat middleware validasi `validateRequest(zodSchema)` dan middleware auth `authenticate` + `authorizeRole(...)`.
- [ ] Implementasikan endpoint `/api/auth/*` dan `/api/events/*`.
- [ ] Pasang Swagger UI di `/api/docs` yang mendokumentasikan seluruh skema request/response.

## Fase 3: Transactional Booking, Check-in & Concurrency Test
- [ ] Implementasikan `POST /api/tickets/book` dengan `prisma.$transaction` + `SELECT ... FOR UPDATE`.
- [ ] Implementasikan `GET /api/tickets/my` dan `POST /api/tickets/checkin`.
- [ ] Buat skrip uji otomatis `backend/scripts/test-concurrency.ts` yang mengirim 10 request booking paralel ke tier berkuota 1.
- [ ] Verifikasi hasil uji: tepat 1 tiket tercipta (`201`), 9 gagal (`409`), dan `remaining_quota` bernilai `0` (tidak minus).

## Fase 4: Frontend Next.js (Participant & Panitia UI)
- [ ] Inisialisasi `frontend` (Next.js App Router + TypeScript + Tailwind CSS).
- [ ] Bangun halaman `/login` dan `/register` yang terhubung ke API.
- [ ] Bangun halaman `/` (Katalog Event) dan `/events/[id]` (Detail & tombol Book Ticket).
- [ ] Bangun halaman `/my-tickets` dengan tampilan kartu digital & render QR Code (`ticket_code`).
- [ ] Bangun halaman `/admin/dashboard` (kelola event/kuota) dan `/admin/scan` (QR Scanner kamera + input manual).

## Fase 5: Full Dockerization & Portfolio Polish
- [ ] Buat `backend/Dockerfile` dan `frontend/Dockerfile`.
- [ ] Lengkapi `docker-compose.yml` agar `postgres`, `backend`, dan `frontend` berjalan dengan satu perintah `docker compose up --build`.
- [ ] Perbarui `README.md` dengan diagram arsitektur Mermaid, cara instalasi Docker, dan hasil log *concurrency test*.