# System Architecture & Engineering Rules — TixFlow

> **ATURAN KERAS UNTUK AI AGENT:** File ini adalah *single source of truth*. Dilarang mengganti *tech stack*, melewati validasi input, atau membuat *mock data* palsu sebagai pengganti query database.

## 1. Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, `qrcode.react`, `html5-qrcode`.
- **Backend:** Node.js, Express, TypeScript, Zod (validasi skema), Swagger UI (`swagger-ui-express`).
- **Database & ORM:** PostgreSQL 16 + Prisma ORM.
- **Security & Auth:** `bcrypt` (password hashing), `jsonwebtoken` (HTTP-Only Cookie), `helmet`, `express-rate-limit`.
- **Infrastructure:** Docker & Docker Compose (`db`, `backend`, `frontend`).

## 2. Database Schema (PostgreSQL)
1. **`users`**
   - `id`: UUID (PK)
   - `name`: String
   - `email`: String (Unique)
   - `password_hash`: String
   - `role`: Enum (`PARTICIPANT`, `PANITIA`)
   - `created_at`: DateTime
2. **`events`**
   - `id`: UUID (PK)
   - `title`: String
   - `description`: Text
   - `event_date`: DateTime
   - `location`: String
   - `created_by`: UUID (FK -> `users.id`)
3. **`ticket_tiers`**
   - `id`: UUID (PK)
   - `event_id`: UUID (FK -> `events.id`)
   - `name`: String
   - `price`: Int
   - `total_quota`: Int
   - `remaining_quota`: Int (`CHECK (remaining_quota >= 0)`)
4. **`tickets`**
   - `id`: UUID (PK)
   - `ticket_code`: String (Unique, UUID v4 — payload QR Code)
   - `user_id`: UUID (FK -> `users.id`)
   - `tier_id`: UUID (FK -> `ticket_tiers.id`)
   - `status`: Enum (`VALID`, `USED`, `CANCELLED`)
   - `checked_in_at`: DateTime (Nullable)
   - `created_at`: DateTime

## 3. Security & Concurrency Rules
1. **Anti-SQL Injection:** Seluruh akses database wajib melalui Prisma ORM atau *parameterized query* (`$queryRaw` dengan template literal Prisma). Dilarang keras memakai `$queryRawUnsafe`.
2. **Input Validation:** Setiap `req.body` dan `req.params` wajib divalidasi dengan skema **Zod** melalui *middleware* sebelum menyentuh logika bisnis.
3. **Concurrency Control (Booking):**
   - Wajib menggunakan `prisma.$transaction`.
   - Di dalam transaksi, kunci baris `ticket_tiers` menggunakan `SELECT id, remaining_quota FROM ticket_tiers WHERE id = $1 FOR UPDATE`.
   - Jika `remaining_quota <= 0`, lempar error untuk memicu rollback (`409 Conflict`).
   - Kurangi `remaining_quota` sebesar 1 dan buat record baru di tabel `tickets`.
4. **Atomic Check-in:**
   - Gunakan operasi atomik `updateMany` dengan kondisi `where: { ticket_code, status: 'VALID' }`. Jika `count === 0`, kembalikan status `409 Conflict`.

## 4. REST API Contract
- `POST /api/auth/register` — Registrasi akun baru (`PARTICIPANT` default).
- `POST /api/auth/login` — Login & set HTTP-Only JWT cookie.
- `POST /api/auth/logout` — Hapus cookie sesi.
- `GET /api/auth/me` — Ambil profil user aktif.
- `GET /api/events` — Daftar seluruh event & tier tiket (Public).
- `GET /api/events/:id` — Detail event (Public).
- `POST /api/events` — Buat event baru (`PANITIA` only).
- `POST /api/events/:id/tiers` — Tambah kategori tiket (`PANITIA` only).
- `POST /api/tickets/book` — Booking tiket dengan row locking (`PARTICIPANT` only).
- `GET /api/tickets/my` — Daftar tiket milik user (`PARTICIPANT` only).
- `POST /api/tickets/checkin` — Validasi QR Code tiket (`PANITIA` only).
- `GET /api/docs` — Dokumentasi interaktif Swagger UI.