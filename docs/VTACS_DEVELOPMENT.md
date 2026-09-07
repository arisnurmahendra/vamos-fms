# 💸 VTACS_DEVELOPMENT (Voucher Tracking System)

> **Proyek:** VAMOS FMS - V-TACS
> **Tujuan:** Pelacakan pemakaian voucher BBM per kendaraan dan rekonsiliasi otomatis tagihan.

Dokumen ini memecah spesifikasi PRD `old_apps/V-TACS/PRODUCT_REQUIREMENTS.md` menjadi fase teknis yang dapat dieksekusi.

---

## 🚩 Fase 1 — Arsitektur Data & Keamanan (Backend)

Menghindari manipulasi atau klaim voucher ganda di lapangan.

### [VTC-001] Setup Sheet Master Voucher, POM & Transaksi
- **Objective:** Membuat Google Sheets penyimpanan data operasional VTACS.
- **Priority:** P1 | **Area:** Backend Data
- **Acceptance Criteria:**
  - Tab `VTC_Master_Voucher` (ID, Status Pakai, Nominal).
  - Tab `VTC_Master_POM` (ID, Nama POM, Saldo).
  - Tab `VTC_Transaksi_BBM` (Record pemakaian BBM harian).

### [VTC-002] RPC Action Anti-Conflict & Validasi Unique Key
- **Objective:** Membuat backend endpoint `vtacs.voucher.claim` dengan perlindungan _double-spending_.
- **Priority:** P1 | **Area:** Backend API / Security
- **Acceptance Criteria:**
  - Cek ketersediaan Voucher berdasarkan ID.
  - Terapkan mekanisme _service lock_ (hanya 1 request per Nomor Voucher di waktu yang sama).
  - Jika sukses, update status voucher menjadi terpakai & kurangi saldo POM.

---

## 🚩 Fase 2 — Offline Mechanism & Caching (Frontend)

Karena POM bensin sering tidak memiliki sinyal, aplikasi wajib memiliki kapabilitas luring.

### [VTC-003] Setup Pinia & Master Data Caching
- **Objective:** Buat `useVtacsStore.js` dan _fetch_ daftar POM & Kendaraan di latar belakang.
- **Priority:** P1 | **Area:** Frontend
- **Acceptance Criteria:**
  - Penggunaan `localForage` (IndexedDB) untuk menyimpan data POM dan Nopol.
  - Terapkan `versioning check` (jika versi hash data GS tidak berubah, gunakan cache).

### [VTC-004] Antrian Transaksi Offline BBM
- **Objective:** Jika offline, simpan data pelaporan BBM ke tabel IndexedDB lokal.
- **Priority:** P1 | **Area:** Frontend
- **Acceptance Criteria:**
  - Data tidak hilang meskipun tab peramban ditutup.
  - Background worker otomatis menyinkronkan (sync) antrian ketika `navigator.onLine` mendeteksi jaringan.

---

## 🚩 Fase 3 — UI Pelaporan Lapangan

Tampilan aplikasi untuk supir/pengguna operasional di lapangan.

### [VTC-005] UI Form Permintaan Voucher
- **Objective:** Halaman bagi *user* untuk me-request voucher sebelum ke POM.
- **Priority:** P2 | **Area:** UI/UX
- **Acceptance Criteria:**
  - Input jumlah nominal dan pilihan POM tujuan.
  - Output: Mendapatkan Nomor Voucher *Virtual*.

### [VTC-006] UI Form Pelaporan Pemakaian BBM
- **Objective:** Halaman bukti pengisian di POM bensin.
- **Priority:** P1 | **Area:** UI/UX
- **Acceptance Criteria:**
  - Form: Nomor Voucher (Primary Key), Tgl Pembelian, ODO KM, Nopol, POM, Jenis BBM, Jumlah Liter.
  - Fitur _Debounce_ pada pencarian Nomor Voucher.
  - Fitur pengambilan foto struk fisik (via akses Kamera).

---

## 🚩 Fase 4 — Dasbor Rekonsiliasi Finansial (RBAC)

Pemisahan pandangan antara General Affairs (Internal) dan Pihak POM (Eksternal).

### [VTC-007] Dasbor Rekonsiliasi General Affairs (GA)
- **Objective:** Buat UI `VTACSDashboardGA.vue`.
- **Priority:** P1 | **Area:** Frontend
- **Acceptance Criteria:**
  - Ringkasan sisa saldo masing-masing POM.
  - Pemakaian BBM per unit kendaraan (identifikasi unit boros BBM).

### [VTC-008] Dasbor Vendor POM & Tagihan
- **Objective:** Buat UI khusus untuk pihak Vendor POM eksternal melihat *invoice*.
- **Priority:** P2 | **Area:** Frontend
- **Acceptance Criteria:**
  - Vendor hanya bisa melihat transaksi yang dilakukan di stasiun mereka (Akses terisolasi).
  - Tampilan rekap: voucher terpakai, literasi, nominal total.
  - Fitur export ke PDF/Excel untuk pencairan dana dari GA.
