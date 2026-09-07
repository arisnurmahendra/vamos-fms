# VAMOS (Vehicle Administration, Maintenance, and Operations System) 🚙⚙️

**VAMOS** adalah sistem *Enterprise Fleet Management* berkinerja tinggi yang dibangun di atas infrastruktur **Google Apps Script (GAS) dan Vue 3 SPA**. Sistem ini dirancang untuk mendigitalkan dan mengkonsolidasikan seluruh siklus operasional kendaraan perusahaan ke dalam satu platform terpusat tanpa *page reload*.

### 📦 4 Modul Inti Terintegrasi (The Core Modules)
Sistem ini merupakan penggabungan (merger) dari 4 subsistem operasional:
1. **Vehicle Booking (Peminjaman KR):** Sistem alokasi dan reservasi kendaraan operasional.
2. **Maintenance Tracker:** Manajemen siklus hidup kendaraan, riwayat perbaikan, dan jadwal servis berkala.
3. **Daily P2H (Pemeriksaan & Perawatan Harian):** *Checklist* digital harian untuk standar keselamatan dan kelayakan jalan armada.
4. **V-TACS (Voucher Tracking & Consolidation System):** Modul finansial untuk pelacakan pemakaian voucher BBM per kendaraan dan rekonsiliasi tagihan otomatis antara pihak GS dan Vendor POM.

### 🛠️ Sorotan Arsitektur (Architecture Highlights)
- **Zero-Latency Routing:** Perpindahan antar 4 modul terjadi instan dalam 0ms menggunakan Vue Router.
- **Offline-First & Caching:** Diperkuat dengan `localForage` (IndexedDB) untuk menghemat kuota Google API.
- **Enterprise Security:** *Role-Based Access Control* (RBAC) berbasis Google Auth, enkripsi `CryptoJS`, dan *Immutable Audit Trail*.
- **Vite Singlefile Build:** Seluruh sistem di-*compile* menjadi satu file `index.html` murni untuk di-deploy via `clasp`.
