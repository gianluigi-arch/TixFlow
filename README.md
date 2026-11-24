# TixFlow — Concurrent Campus Event Ticketing & QR Access System

Sistem manajemen *ticketing* event kampus berbasis arsitektur *full-stack* yang dirancang untuk menangani **rebutan kuota tiket secara konkuren (anti-overselling)** dan **validasi akses gerbang menggunakan QR Code**.

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Zod, Swagger/OpenAPI
- **Database:** PostgreSQL 16, Prisma ORM
- **Security & DevOps:** JWT (HTTP-Only Cookies), RBAC, Row-Level Locking (`FOR UPDATE`), Docker Compose

## System Architecture
```mermaid
flowchart LR
    Client[Next.js Frontend] -->|REST API + JWT Cookie| API[Express API + Zod Validation]
    API -->|Prisma Transaction + Row Lock| DB[(PostgreSQL 16)]
    API -->|/api/docs| Swagger[Swagger UI]