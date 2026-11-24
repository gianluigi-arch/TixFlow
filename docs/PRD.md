# Product Requirements Document (PRD) — TixFlow

## 1. Overview
**TixFlow** adalah sistem manajemen *ticketing* event kampus berbasis web dengan kontrol konkurensi kuota tiket dan validasi *check-in* QR Code secara *real-time*.

## 2. Target Roles & User Flow
1. **PARTICIPANT (Mahasiswa / Peserta)**
   - Register & Login ke sistem.
   - Melihat katalog event dan sisa kuota tiket per kategori (*tier*).
   - Melakukan *booking* tiket (sistem mengunci kuota secara atomik dan menerbitkan tiket ber-UUID).
   - Membuka halaman **My Tickets** untuk menampilkan QR Code tiket.
2. **PANITIA (Event Organizer / Admin)**
   - Login dengan hak akses `PANITIA`.
   - Membuat event baru dan mengatur kategori tiket beserta batas kuotanya.
   - Memantau daftar peserta dan status tiket.
   - Membuka **Check-in Scanner** untuk memindai QR Code peserta (mengubah status tiket dari `VALID` menjadi `USED`).

## 3. Strict MVP Scope (v1) vs. Backlog (v2)
### MVP (v1 — Wajib Selesai)
- Autentikasi JWT dengan RBAC (`PARTICIPANT` vs `PANITIA`).
- CRUD Event & Ticket Tiers (khusus `PANITIA`).
- Transactional Ticket Booking (anti-*overselling* saat *race condition*).
- Penerbitan tiket unik (UUID v4) + render QR Code di frontend.
- Endpoint & UI Scanner untuk validasi *check-in* tiket (anti-duplikasi scan).
- Containerization penuh via Docker Compose.

### Backlog (v2 — Dilarang Dikerjakan di v1)
- Integrasi *payment gateway* pihak ketiga (Midtrans/Xendit).
- Notifikasi tiket via Email / WhatsApp API.
- Transfer atau *refund* tiket antar-pengguna.

## 4. Edge Cases Wajib Ditangani
- **Overselling:** Sisa kuota 1 dipesan oleh 10 *request* bersamaan $\rightarrow$ hanya 1 transaksi berhasil (`201 Created`), 9 lainnya ditolak (`409 Conflict`).
- **Double Check-in:** QR tiket yang sama dipindai dua kali $\rightarrow$ scan pertama sukses (`200 OK`), scan kedua ditolak (`409 Conflict: Ticket already used`).
- **Unauthorized Access:** User `PARTICIPANT` memanggil endpoint admin $\rightarrow$ ditolak (`403 Forbidden`).