# 💸 VTACS_DEVELOPMENT (Voucher Tracking System)

> **Proyek:** VAMOS FMS - V-TACS
> **Tujuan:** Pelacakan pemakaian voucher BBM per kendaraan dan rekonsiliasi otomatis tagihan.

Dokumen ini memecah spesifikasi PRD `old_apps/V-TACS/PRODUCT_REQUIREMENTS.md` menjadi fase teknis yang dapat dieksekusi.

---

## 🚩 Fase 1 — Arsitektur Data & Keamanan (Backend) (Status: Closed)

Menghindari manipulasi atau klaim voucher ganda di lapangan.

### [VTC-001] Setup Sheet Master Voucher, POM & Transaksi
- **Objective:** Membuat Google Sheets penyimpanan data operasional VTACS.
- **Priority:** P1 | **Area:** Backend Data | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Tab `VTACS_Master_Voucher` (ID, Status Pakai, Nominal, Kuota, POM Tujuan, Expired).
  - [x] Tab `VTACS_Master_POM` (ID, Nama POM, Saldo Alokasi, Terpakai, Status).
  - [x] Tab `VTACS_Transaksi_BBM` (Record pemakaian BBM harian).
- **Notes:**
  - Diimplementasikan pada `gas/VTACS.gs` (`initVTACSSheets`).
  - Skema tabel terstandarisasi dengan proteksi baris header dan auto-initialization.
  - GitHub Issue #93 ditutup.

### [VTC-002] RPC Action Anti-Conflict & Validasi Unique Key
- **Objective:** Membuat backend endpoint `vtacs.voucher.redeem` dengan perlindungan _double-spending_.
- **Priority:** P1 | **Area:** Backend API / Security | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Cek ketersediaan Voucher berdasarkan ID unik.
  - [x] Terapkan mekanisme _service lock_ atomic (15 detik lock timeout) untuk mencegah race condition.
  - [x] Jika sukses, update status voucher menjadi `REDEEMED`, kurangi saldo deposit POM, dan catat audit log.
- **Notes:**
  - Diimplementasikan pada `gas/VTACS.gs` (`handleVTACSRedeem`), `gas/Code.gs`, dan `gas/Security.gs`.
  - Mengembalikan HTTP 409 Conflict jika voucher sudah pernah dicairkan.
  - GitHub Issue #94 ditutup.

---

## 🚩 Fase 2 — Offline Mechanism & Caching (Frontend) (Status: Closed)

Karena POM bensin sering tidak memiliki sinyal, aplikasi wajib memiliki kapabilitas luring.

### [VTC-003] Setup Pinia & Master Data Caching
- **Objective:** Buat `useVtacsStore.js` dan _fetch_ daftar POM & Kendaraan di latar belakang.
- **Priority:** P1 | **Area:** Frontend | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Penggunaan `localForage` (IndexedDB) untuk menyimpan data POM dan Voucher master.
  - [x] Caching offline otomatis di `src/stores/vtacsStore.js` (`fetchMasterData`).
- **Notes:**
  - Terintegrasi dengan `src/services/storageService.js` untuk persistensi data offline.
  - GitHub Issue #95 ditutup.

### [VTC-004] Antrian Transaksi Offline BBM
- **Objective:** Jika offline, simpan data pelaporan BBM ke tabel IndexedDB lokal.
- **Priority:** P1 | **Area:** Frontend | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Data tidak hilang meskipun tab peramban ditutup (`storageService.enqueueOfflineTask('VTACS', ...)`).
  - [x] Background worker / listener menyinkronkan (sync) antrean ketika online (`vtacsStore.syncOfflineQueue`).
- **Notes:**
  - Menyediakan fallback offline teruji dan optimistic update pada store lokal.
  - GitHub Issue #96 ditutup.

---

## 🚩 Fase 3 — UI Pelaporan Lapangan (Status: Closed)

Tampilan aplikasi untuk supir/pengguna operasional di lapangan.

### [VTC-005] UI Form Permintaan Voucher
- **Objective:** Halaman bagi *user* untuk me-request voucher sebelum ke POM.
- **Priority:** P2 | **Area:** UI/UX | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Input jumlah nominal, kuota liter, nopol kendaraan, dan pilihan POM tujuan.
  - [x] Output: Mendapatkan Nomor Voucher *Virtual* dengan slip voucher digital dan fitur salin kode.
- **Notes:**
  - Diimplementasikan pada Tab "Request Voucher (VTC-005)" di `src/views/VTACSView.vue`.
  - GitHub Issue #97 ditutup.

### [VTC-006] UI Form Pelaporan Pemakaian BBM
- **Objective:** Halaman bukti pengisian di POM bensin.
- **Priority:** P1 | **Area:** UI/UX | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Form: Nomor Voucher (Primary Key), Tgl Pembelian, ODO KM, Nopol, POM, Jenis BBM, Jumlah Liter.
  - [x] Fitur _Debounce_ (400ms) pada pencarian dan verifikasi Nomor Voucher.
  - [x] Fitur pengambilan / upload foto struk fisik (via akses Kamera atau file upload).
- **Notes:**
  - Diimplementasikan pada Tab "Lapor Pemakaian BBM (VTC-006)" di `src/views/VTACSView.vue`.
  - GitHub Issue #98 ditutup.

---

## 🚩 Fase 4 — Dasbor Rekonsiliasi Finansial (RBAC) (Status: Closed)

Pemisahan pandangan antara General Affairs (Internal) dan Pihak POM (Eksternal).

### [VTC-007] Dasbor Rekonsiliasi General Affairs (GA)
- **Objective:** Buat UI dasbor rekonsiliasi internal GA.
- **Priority:** P1 | **Area:** Frontend | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Ringkasan sisa saldo masing-masing POM (saldo deposit, terpakai, sisa deposit).
  - [x] Pemakaian BBM per unit kendaraan dengan rincian transaksi lengkap.
  - [x] Ekspor laporan rekonsiliasi ke CSV.
- **Notes:**
  - Diimplementasikan pada Tab "Dasbor Rekonsiliasi GA (VTC-007)" di `src/views/VTACSView.vue`.
  - GitHub Issue #99 ditutup.

### [VTC-008] Dasbor Vendor POM & Tagihan
- **Objective:** Buat UI khusus untuk pihak Vendor POM eksternal melihat *invoice*.
- **Priority:** P2 | **Area:** Frontend | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Vendor hanya bisa melihat transaksi yang dilakukan di stasiun mereka (Akses terisolasi per SPBU).
  - [x] Tampilan rekap: voucher terpakai, total literasi, total nominal tagihan.
  - [x] Fitur export faktur invoice tagihan resmi ke CSV.
- **Notes:**
  - Diimplementasikan pada Tab "Portal Vendor POM (VTC-008)" di `src/views/VTACSView.vue`.
  - GitHub Issue #100 ditutup.
