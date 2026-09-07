# 📚 VAMOS FMS — Pusat Dokumentasi Teknis

Selamat datang di pusat dokumentasi teknis **VAMOS** (*Vehicle Administration, Maintenance, and Operations System*). Halaman ini berfungsi sebagai indeks lengkap untuk seluruh dokumen arsitektur, panduan teknis, standar keamanan, dan roadmap pengerjaan modul.

---

## 📖 Daftar Isi Dokumentasi

### 1. Dokumen Tata Kelola & Arsitektur Inti

| Dokumen | Lokasi | Deskripsi |
| :--- | :--- | :--- |
| **Project Overview** | [README.md](../README.md) | Gambaran umum, quick start, dan konfigurasi lingkungan |
| **Master Plan** | [MASTER_IMPLEMENTATION_PLAN.md](../MASTER_IMPLEMENTATION_PLAN.md) | Arsitektur lengkap dan cetak biru Dual-App Single-Instance SPA |
| **Agent Operational Rules** | [AGENT.md](../AGENT.md) | Aturan, batasan, dan protokol kerja AI Coding Agent |
| **Agent Real-time State** | [AGENT_STATE.md](../AGENT_STATE.md) | Status progress terkini, status file, dan checklist pengerjaan |
| **Security & ISMS Policy** | [POL.ISMS.001.md](./POL.ISMS.001.md) | Kebijakan wajib keamanan informasi, proteksi data, dan zero-leak |

---

### 2. Panduan & Referensi Teknis (Technical Guides)

| Dokumen | File | Topik Utama |
| :--- | :--- | :--- |
| **Arsitektur Sistem** | [architecture.md](./architecture.md) | Diagram relasi Vue 3 SPA + GAS, data flow, dan batasan Google Apps Script |
| **API Reference** | [api-reference.md](./api-reference.md) | Spesifikasi RPC Action Dispatcher, payload format, error codes, dan mock bridge |
| **Panduan Frontend** | [frontend-guide.md](./frontend-guide.md) | Konvensi Vue 3 Composition API, Pinia store schema, localForage offline caching |
| **Panduan Keamanan** | [security-guide.md](./security-guide.md) | Handshake sesi GAS, RBAC matrix, enkripsi AES-256 CryptoJS, audit logging |

---

### 3. Roadmaps & Issue Trackers (Pengerjaan Modul)

Setiap modul memiliki roadmap teknis mendalam dan pelacak tiket (tersedia dalam format Markdown dan JSON untuk sinkronisasi otomatis):

| Modul | Tracker Markdown | Tracker JSON | Cakupan Teknis |
| :--- | :--- | :--- | :--- |
| **Master System** | [ISSUE_TRACKER.md](./ISSUE_TRACKER.md) | [issue-tracker.json](./issue-tracker.json) | Fondasi sistem (Milestone INF, BE, FE, SEC, MOD, OPS) |
| **Vehicle Booking** | [BOOKING_REFACTOR.md](./BOOKING_REFACTOR.md) | [BOOKING_REFACTOR.json](./BOOKING_REFACTOR.json) | Refaktor alokasi peminjaman, Fonnte WA outbox, & PDF generator |
| **Maintenance** | [MAINTENANCE_REFACTOR.md](./MAINTENANCE_REFACTOR.md) | [MAINTENANCE_REFACTOR.json](./MAINTENANCE_REFACTOR.json) | Refaktor SmartServ, remediasi kunci AES, riwayat servis |
| **Daily P2H** | [P2H_DEVELOPMENT.md](./P2H_DEVELOPMENT.md) | [P2H_DEVELOPMENT.json](./P2H_DEVELOPMENT.json) | Pengembangan checklist inspeksi 5 area & caching localStorage |
| **V-TACS** | [VTACS_DEVELOPMENT.md](./VTACS_DEVELOPMENT.md) | [VTACS_DEVELOPMENT.json](./VTACS_DEVELOPMENT.json) | Pengembangan voucher BBM offline-first (IndexedDB) & konsolidasi |

---

> 📌 **Standar Kualitas (Definition of Done):**  
> Setiap tiket pengerjaan yang diselesaikan wajib mematuhi kriteria kelayakan pada [Section 8 — Definition of Done di ISSUE_TRACKER.md](./ISSUE_TRACKER.md#section-8--definition-of-done-dod) serta kebijakan kepatuhan [POL.ISMS.001.md](./POL.ISMS.001.md).
