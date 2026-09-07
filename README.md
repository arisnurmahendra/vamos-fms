# VAMOS (Vehicle Administration, Maintenance, and Operations System) 🚙⚙️

[![Vue 3](https://img.shields.io/badge/Vue-3.5.42-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-Backend-4285F4?logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

**VAMOS** adalah sistem *Enterprise Fleet Management* modern berkinerja tinggi yang dibangun di atas integrasi **Google Apps Script (GAS) dan Vue 3 Single Page Application (SPA)**. Sistem ini dirancang untuk mendigitalkan, mengotomasi, dan mengkonsolidasikan seluruh siklus operasional kendaraan perusahaan ke dalam satu portal terpusat berlatensi rendah tanpa *page reload*.

---

## 📦 4 Modul Inti Terintegrasi (Core Modules)

Sistem VAMOS mengkonsolidasikan 4 sistem operasional armada ke dalam satu arsitektur terpadu:

```
                  ┌─────────────────────────────────────────┐
                  │             VAMOS FMS PORTAL            │
                  │        (Vue 3 SPA + Vue Router)         │
                  └────────────────────┬────────────────────┘
                                       │
         ┌──────────────────┬──────────┴──────────┬──────────────────┐
         ▼                  ▼                     ▼                  ▼
┌─────────────────┐┌─────────────────┐┌─────────────────┐┌─────────────────┐
│ VEHICLE BOOKING ││   MAINTENANCE   ││    DAILY P2H    ││     V-TACS      │
│   (Peminjaman)  ││   (SmartServ)   ││   (Checklist)   ││  (BBM Voucher)  │
└─────────────────┘└─────────────────┘└─────────────────┘└─────────────────┘
```

1. **Vehicle Booking (Peminjaman KR):**
   - Reservasi armada operasional & non-operasional dengan validasi bentrok jadwal (*conflict detection*).
   - Workflow bertingkat multi-role (*User → AM → GS1 → ADM1 → GS2 → ADM2*).
   - Antrean pesan WhatsApp otomatis (*WA Outbox Queue*) via penyedia Fonnte.
   - Digital signature approval dan auto-generate formulir serah terima PDF ke Google Drive.
2. **Maintenance Tracker (SmartServ):**
   - Pelacak siklus hidup servis kendaraan (*preventive & corrective maintenance*).
   - Monitoring riwayat perbaikan, breakdown, estimasi biaya, dan pergantian suku cadang.
   - Validasi data terenkripsi AES-256 untuk proteksi integritas transaksi bengkel rekanan.
3. **Daily P2H (Pemeriksaan & Perawatan Harian):**
   - Form inspeksi kelayakan jalan digital sebelum kendaraan digunakan (*fit-to-work vehicle check*).
   - Pemeriksaan komprehensif 5 area observasi: Mesin, Interior/Kabin, Eksterior/Body, Bagian Bawah (*Chassis/Underbody*), dan Dokumen/Perlengkapan.
   - Dukungan *smart cache* (localStorage) untuk input berulang yang cepat.
4. **V-TACS (Voucher Tracking & Consolidation System):**
   - Pencatatan dan monitoring kuota voucher BBM per kendaraan dan per departemen.
   - Dukungan arsitektur *Offline-First* menggunakan IndexedDB untuk pemindaian voucher di area minim sinyal.
   - Dashboard rekonsiliasi dan konsolidasi tagihan tagihan *real-time* antara General Affairs (GA) dan Vendor SPBU.

---

## 🛠️ Sorotan Arsitektur & Teknologi

- **Zero-Latency Navigation:** Perpindahan antar modul terjadi secara instan (0ms) di sisi klien memanfaatkan Vue Router 4 tanpa overhead re-render halaman server GAS.
- **Singlefile Bundler:** Menggunakan `vite-plugin-singlefile` untuk mengompilasi seluruh file JavaScript, CSS, HTML template, dan SVG assets menjadi satu berkas `deploy/index.html` yang kompatibel dengan batasan `HtmlService` Google Apps Script.
- **Offline-First & Smart Caching:** Memanfaatkan `localForage` (IndexedDB) dan `localStorage` untuk caching master data (daftar nopol, profil driver) serta antrean offline untuk meminimalkan konsumsi kuota Google Apps Script API.
- **RPC API Dispatcher:** Seluruh pertukaran data frontend-backend melewati satu pintu gerbang `apiDispatcher` di `Code.gs` dengan validasi parameter, struktur response standar `{ success, data, error }`, dan penanganan error terpusat.
- **Enterprise Security & ISMS:** Mengikuti standar keamanan ketat `POL.ISMS.001.md`:
  - Token sesi berbasis GAS user auth & role-based access control (RBAC).
  - Enkripsi AES-256 via `CryptoJS` untuk payload transaksi sensitif.
  - Zero Hardcoded Secret: Token API, Webhook, Sheet ID, dan Folder ID disimpan aman dalam `ScriptProperties`.
  - Immutable Audit Trail untuk mencatat seluruh aksi mutasi data (*Insert/Update/Delete*).

---

## 🗂️ Struktur Direktori Repositori

```text
vamos-fms/
├── .agents/                 # AI Agent rules & configurations
├── deploy/                  # Output build produksi (index.html siap deploy)
├── docs/                    # Dokumentasi lengkap & Issue Trackers
│   ├── ISSUE_TRACKER.md     # Master issue tracker (Milestone INF, BE, FE, SEC, MOD, OPS)
│   ├── issue-tracker.json   # Versi JSON master tracker
│   ├── BOOKING_REFACTOR.md  # Roadmap refaktor modul Booking
│   ├── MAINTENANCE_REFACTOR.md # Roadmap refaktor modul Maintenance
│   ├── MAINTENANCE_REFACTOR.json
│   ├── P2H_DEVELOPMENT.md   # Roadmap pengembangan modul P2H
│   ├── P2H_DEVELOPMENT.json
│   ├── VTACS_DEVELOPMENT.md # Roadmap pengembangan modul V-TACS
│   ├── VTACS_DEVELOPMENT.json
│   ├── POL.ISMS.001.md      # Kebijakan & standard keamanan informasi
│   ├── architecture.md      # Arsitektur sistem Dual-App SPA
│   ├── api-reference.md     # Panduan RPC Dispatcher & protokol API
│   ├── frontend-guide.md    # Panduan standar frontend Vue 3 & Pinia
│   └── security-guide.md    # Panduan keamanan, RBAC, dan sanitasi
├── gas/                     # Backend Google Apps Script (GAS)
│   ├── Code.gs              # doGet & Core RPC API Dispatcher
│   ├── .claspignore         # Konfigurasi filter push Clasp
│   └── appsscript.json      # Manifest konfigurasi Apps Script
├── old_apps/                # Legacy applications (Booking, Maintenance, P2HView, V-TACS)
├── src/                     # Frontend Vue 3 SPA
│   ├── router/              # Konfigurasi rute Vue Router
│   ├── stores/              # Pinia state stores (auth, booking, p2h, vtacs, maintenance)
│   ├── views/               # View page components
│   ├── components/          # Reusable UI components
│   ├── App.vue              # Root Vue Component
│   ├── main.js              # Entrypoint aplikasi
│   └── style.css            # Desain sistem & styling CSS
├── .clasp.json              # Konfigurasi Clasp CLI (scriptId GAS)
├── .gitignore               # Git ignore rules (node_modules, deploy, secrets)
├── package.json             # Manifest dependensi & scripts npm
├── vite.config.js           # Konfigurasi bundler Vite + Singlefile
└── README.md                # Dokumentasi utama proyek
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat Sistem
- **Node.js:** Versi 18.0.0 atau lebih baru.
- **NPM:** Versi 9.0.0 atau lebih baru.
- **Google Clasp:** CLI Google Apps Script (`npm install -g @google/clasp`).
- Browser modern yang mendukung ES2020+ dan IndexedDB.

### 2. Instalasi Dependensi
```bash
# Clone repository
git clone https://github.com/arisnurmahendra/vamos-fms.git
cd vamos-fms

# Install node dependencies
npm install
```

### 3. Menjalankan Server Pengembangan Lokal (Dev Mode)
Mode pengembangan menjalankan Vite dev server dengan mock data / demo environment:
```bash
npm run dev
```
Aplikasi dapat diakses melalui browser pada `http://localhost:5173/`.

### 4. Menjalankan Kompilasi Build
```bash
# Build untuk demonstrasi / preview lokal
npm run build:demo

# Build bundle produksi tunggal (output: deploy/index.html)
npm run build:prod
```

### 5. Melakukan Sinkronisasi ke Google Apps Script (Deploy)
Pastikan Anda sudah login ke Google Apps Script CLI dan `.clasp.json` sudah berisi `scriptId` target:
```bash
# Login ke akun Google Anda (hanya sekali)
clasp login

# Push kode backend dan HTML deploy ke Google Apps Script
npm run push
# atau
clasp push
```

---

## 🔐 Konfigurasi Google Script Properties

Sebelum menjalankan sistem di lingkungan produksi, tambahkan properti rahasia pada **Project Settings > Script Properties** di Google Apps Script editor:

| Nama Property | Deskripsi | Wajib |
| :--- | :--- | :---: |
| `AES_ENCRYPTION_KEY` | Kunci enkripsi 256-bit untuk pengamanan transaksi | ✅ Ya |
| `FONNTE_TOKEN` | Token API gateway WhatsApp Fonnte untuk notifikasi approval | ✅ Ya |
| `MAIN_SPREADSHEET_ID`| ID Google Spreadsheet utama untuk penyimpanan database | ✅ Ya |
| `PDF_FOLDER_ID` | ID Google Drive Folder penampung arsip PDF serah terima | ✅ Ya |
| `SIGNATURE_FOLDER_ID`| ID Google Drive Folder penampung gambar tanda tangan digital | ✅ Ya |
| `WA_APPROVAL_SECRET` | Salt string untuk verifikasi HMAC approval token link WA | ✅ Ya |

> ⚠️ **Peringatan Keamanan:** Jangan pernah menuliskan kunci atau token rahasia secara langsung di dalam kode program (*hardcoded*). Patuhi selalu kebijakan [docs/POL.ISMS.001.md](docs/POL.ISMS.001.md).

---

## 📚 Peta Dokumentasi & Tracker Pengerjaan

Untuk melihat detail teknis implementasi, roadmap per modul, dan status pengerjaan issue:

- 📑 [Dokumentasi Lengkap (docs/README.md)](docs/README.md)
- 🎯 [Master Issue Tracker (docs/ISSUE_TRACKER.md)](docs/ISSUE_TRACKER.md)
- 🚙 [Roadmap Refaktor Booking (docs/BOOKING_REFACTOR.md)](docs/BOOKING_REFACTOR.md)
- ⚙️ [Roadmap Refaktor Maintenance (docs/MAINTENANCE_REFACTOR.md)](docs/MAINTENANCE_REFACTOR.md)
- 📋 [Roadmap Pengembangan P2H (docs/P2H_DEVELOPMENT.md)](docs/P2H_DEVELOPMENT.md)
- 🏷️ [Roadmap Pengembangan V-TACS (docs/VTACS_DEVELOPMENT.md)](docs/VTACS_DEVELOPMENT.md)
- 🏛️ [Arsitektur Sistem (docs/architecture.md)](docs/architecture.md)
- 🔌 [Spesifikasi API & Dispatcher (docs/api-reference.md)](docs/api-reference.md)
- 🎨 [Standar & Konvensi Frontend (docs/frontend-guide.md)](docs/frontend-guide.md)
- 🛡️ [Panduan Keamanan Sistem (docs/security-guide.md)](docs/security-guide.md)

---

## 👥 Tim & Kontribusi

Sistem ini dikembangkan dan dikelola oleh Tim Pengembang VAMOS FMS. Seluruh perubahan wajib melalui review dan memenuhi *Definition of Done* (DoD) pada [docs/ISSUE_TRACKER.md](docs/ISSUE_TRACKER.md) sebelum digabungkan ke cabang `main`.
