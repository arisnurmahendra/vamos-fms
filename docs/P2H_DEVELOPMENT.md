# 🚀 P2H_DEVELOPMENT (Daily P2H Tracker)

> **Proyek:** VAMOS FMS - P2HView (Pemeriksaan & Perawatan Harian)
> **Tujuan:** Checklist digital harian standar keselamatan dan kelayakan jalan armada.

Dokumen ini memecah spesifikasi PRD `old_apps/P2HView/PRODUCT_REQUIREMENTS.md` menjadi fase teknis dan tiket pekerjaan yang bisa langsung dieksekusi oleh Agen atau Developer.

---

## 🚩 Fase 1 — Backend & Database Schema (GAS) (Status: Closed)

Fokus utama adalah menyiapkan tempat penyimpanan data dan jalur komunikasi API/RPC dari Vue ke Google Apps Script.

### [P2H-001] Pembuatan Schema Sheet Master & Laporan P2H
- **Objective:** Membuat Google Sheets (atau tab baru di DB VAMOS) untuk `P2H_Laporan` dan `P2H_Kendaraan`.
- **Priority:** P1 | **Area:** Backend Data | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Header kolom P2H disiapkan (Observator, Tanggal, Nopol, 5 Area Observasi, dsb).
  - [x] Integrasi dengan master data VAMOS (Subkon, Kendaraan).
- **Notes:**
  - Implemented in `gas/P2H.gs` (GitHub Issue #85 closed).
  - Skema tabel `P2H_Laporan` (15 kolom standar) dan `P2H_Kendaraan` diinisialisasi otomatis via `initP2HSheets()`.
  - Verifikasi: Unit test lulus 100%.

### [P2H-002] Pembuatan RPC Actions `p2h.kendaraan.submit`
- **Objective:** Membuat _endpoint_ backend `modeKendaraan` untuk menerima data payload.
- **Priority:** P1 | **Area:** Backend API | **Status:** Closed
- **Acceptance Criteria:**
  - [x] Menerima JSON *payload* form P2H.
  - [x] Melakukan validasi *server-side* (ID Kendaraan tidak kosong, dsb).
  - [x] Mengembalikan UID laporan yang berhasil disimpan.
- **Notes:**
  - Implemented in `gas/P2H.gs` dan `gas/Code.gs` (GitHub Issue #86 closed).
  - Validasi server-side, evaluasi otomatis 35 item checklist (`FIT` / `UNFIT`), atomic lock UID generation (`P2H-YYYYMMDD-XXXX`), dan pencatatan audit log mutasi.
  - Verifikasi: Unit test sandbox lulus 100%.

---

## 🚩 Fase 2 — Frontend Foundation & State Management

Menyiapkan *state management* agar aplikasi bisa bekerja secara luring (*offline-first*).

### [P2H-003] Setup Pinia Store & LocalStorage Caching
- **Objective:** Buat `useP2HStore.js` untuk manajemen data P2H.
- **Priority:** P1 | **Area:** Frontend
- **Acceptance Criteria:**
  - Profil kendaraan terakhir (Nopol, Subkon, Merk, Jenis) disimpan di `localStorage` setelah *submit* agar muncul kembali di pembukaan form berikutnya.
  - Master dropdown di-*cache* saat aplikasi pertama kali dimuat.

### [P2H-004] Mekanisme Sinkronisasi IndexedDB (Offline-First)
- **Objective:** Menyimpan antrian submit form P2H di IndexedDB / LocalForage jika tidak ada koneksi internet.
- **Priority:** P1 | **Area:** Frontend
- **Acceptance Criteria:**
  - Jika `navigator.onLine` false, payload disimpan ke antrian lokal dengan *timestamp*.
  - _Background worker_ / listener akan mengirim data (sync) ketika sinyal kembali.

---

## 🚩 Fase 3 — UI Checklist Form & Validasi

Membangun tampilan form menggantikan `app_checklist_kendaraan.html`.

### [P2H-005] Pengembangan Komponen P2H Form
- **Objective:** Buat `P2HFormView.vue` yang berisi header info dan komponen 5 kategori observasi (Luar, Dalam, Listrik, Udara, Servis).
- **Priority:** P1 | **Area:** UI/UX
- **Acceptance Criteria:**
  - UI Mobile-Responsive dan *finger-friendly* (tombol "Baik" / "T.Baik" mudah ditekan).
  - Memiliki fitur "Reset" form.

### [P2H-006] Validasi Frontend & Perlindungan Throttling
- **Objective:** Mencegah form di-_submit_ dengan data kosong atau di-klik berulang kali.
- **Priority:** P2 | **Area:** UI/UX
- **Acceptance Criteria:**
  - Validasi *client-side* ketat untuk semua *radio button* observasi.
  - *Throttling / disable* tombol Submit saat proses *loading* ke GAS.
  - Menggunakan *SweetAlert2* untuk feedback sukses/gagal.

---

## 🚩 Fase 4 — Dasbor Validasi & Pemantauan (RBAC)

Fitur khusus untuk pengawas dan pihak GA.

### [P2H-007] Dasbor General Affairs (GA) P2H
- **Objective:** Buat `P2HDashboardGA.vue` untuk memantau metrik keselamatan.
- **Priority:** P2 | **Area:** Frontend
- **Acceptance Criteria:**
  - Tampilan grafik/tabel jumlah kendaraan layak vs tidak layak hari ini.

### [P2H-008] Antarmuka Validasi Supervisor (Follow-Up NOK)
- **Objective:** Buat UI khusus Supervisor untuk me-review temuan "NOK" (T.Baik).
- **Priority:** P2 | **Area:** Frontend
- **Acceptance Criteria:**
  - List kendaraan yang mendapat label "T.Baik".
  - Tombol aksi untuk mengubah status menjadi "Dalam Perbaikan" atau "Clear".
