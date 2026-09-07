# 🔄 ISSUE TRACKER — Booking Module Refactor (old_apps → VAMOS FMS)

> **Terakhir diperbarui:** 2026-09-07 15:20 WIB  
> **Target:** Merefaktor `old_apps/Booking` (GAS monolith) menjadi modul Vue 3 + GAS di VAMOS FMS  
> **Strategi:** Strangler Fig — pindahkan fitur satu per satu tanpa mengganggu production lama

---

## 🔍 Analisis Kondisi Lama (old_apps/Booking)

### Temuan Kritis dari Code Review

| Area | Masalah | Risiko |
|:---|:---|:---|
| **Arsitektur** | Monolith 3.097 baris dalam 1 file `Code.js` | Maintainability sangat rendah |
| **Backend** | Tidak ada dispatcher/router; semua fungsi global langsung di-call frontend | Tidak ada access control layer |
| **Auth** | Email-based whitelist di `datadb!AU:AV`; tidak ada token sesi | Mudah di-bypass jika sheet dibuka |
| **Data** | Kolom hardcoded via `COL` object + raw column index angka tersebar di kode | Rawan regression jika kolom bergeser |
| **PDF Generation** | Copy-paste sheet template setiap approve; 5 fungsi hampir identik (`uid_diterima`, `uid_terima`, `uid_terima_GS1`, `uid_terima_GS2`, `uid_terima_ADM`) | Sangat sulit maintain |
| **WA Token** | `fonnteWA = 'd4R9EN...'` hardcoded di `FronteWA.js` (bukan di Script Properties) | **Security risk** |
| **State** | Tidak ada frontend state management; setiap navigasi full reload page via `google.script.run` | Slow UX |
| **Frontend** | Multi-file HTML (16 form terpisah); tidak ada component reuse | Sulit scale |
| **Approval Flow** | Logic approval tersebar di 5+ fungsi berbeda; tidak ada state machine | Bug-prone |
| **Error Handling** | Banyak fungsi tanpa try-catch; WA error diam-diam di-swallow | Data loss risk |
| **Testing** | Test langsung di spreadsheet; tidak ada automated test | Manual saja |

---

## 🎯 Strategi Refactor: 6 Fase Sequential

Urutan dikerjakan berdasarkan **dependency chain** dan **risiko deployment**:

```
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6
(Data)   (Auth)   (Core)   (Approval) (Notif)  (UI)
```

---

## 🚩 Fase 1 — Data Layer & Schema Canonicalization

> **Tujuan:** Buat Data Contract yang bersih sebelum menyentuh logika apapun.  
> **Dependency:** Tidak ada. Ini yang dikerjakan pertama.

---

### [BKG-001] Audit & Canonicalize COL Schema Contract

**Objective**  
Verifikasi dan dokumentasikan ulang seluruh mapping kolom `COL` di `Code.js` ke dalam skema canonical yang akan menjadi ground truth di VAMOS FMS. Saat ini `COL` sudah ada tapi ada raw column index angka tersebar (misalnya `i + 2, 16` di `uid_terima_GS2`).

**Metadata**  
- **Tracker ID:** BKG-001  
- **Priority:** P0  
- **Area:** Booking / Data  
- **Dependencies:** None  
- **Status:** Open  

**Acceptance Criteria**  
- Semua kolom `datadb!J:AK` terdokumentasi lengkap dalam `docs/BOOKING_SCHEMA.md` dengan nama field, kolom, tipe data, dan validasi.  
- Seluruh magic number raw column index di `Code.js` diidentifikasi dan ditandai sebagai technical debt.  
- Dokumen menjadi satu-satunya referensi skema selama refactor.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-002] Design Booking Pinia Store Schema

**Objective**  
Rancang skema state VAMOS FMS untuk modul Booking menggunakan Pinia, mencerminkan semua entitas dari `datadb`: User, Kendaraan (Nopol), Form Peminjaman, dan status approval flow.

**Metadata**  
- **Tracker ID:** BKG-002  
- **Priority:** P1  
- **Area:** Booking / Frontend  
- **Dependencies:** BKG-001  
- **Status:** Open  

**Acceptance Criteria**  
- `useBookingStore.js` dibuat di `src/stores/` dengan state: `bookings[]`, `nopolList[]`, `userList[]`, `currentForm`, `approvalStatus`.  
- Tipe setiap field didefinisikan dengan JSDoc comment.  
- Store bersih dari GAS-specific code.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-003] Migrate WA Token ke Script Properties

**Objective**  
Token Fonnte WA saat ini hardcoded di `FronteWA.js` baris 7: `const fonnteWA = 'd4R9ENLdGHwTgMqq6fkZ'`. Ini harus dipindahkan ke `PropertiesService.getScriptProperties()` sebelum refactor apapun dilanjutkan.

**Metadata**  
- **Tracker ID:** BKG-003  
- **Priority:** P0 🔥 SECURITY  
- **Area:** Booking / Security  
- **Dependencies:** None  
- **Status:** Open  

**Acceptance Criteria**  
- Token tidak boleh ada di source code manapun.  
- `FronteWA.js` membaca token via `PropertiesService.getScriptProperties().getProperty('FONNTE_TOKEN')`.  
- Dokumentasi cara set Script Property ditambahkan di `docs/OPERATIONS.md`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 2 — Authentication & Access Control Refactor

> **Tujuan:** Ganti sistem auth lama (email whitelist di sheet) dengan sistem token GAS terintegrasi ke auth VAMOS FMS.  
> **Dependency:** Fase 1 selesai. SEC-001 (Main VAMOS Auth Handshake) sudah ada.

---

### [BKG-004] Replace Email-Whitelist Auth dengan VAMOS Auth Token

**Objective**  
`doGet()` lama membaca email akses dari `datadb!AU:AV` dan mencocokkan dengan `Session.getActiveUser()`. Ganti menjadi flow autentikasi handshake VAMOS FMS yang konsisten (token sesi + role dari `USER_ROLES`).

**Metadata**  
- **Tracker ID:** BKG-004  
- **Priority:** P1  
- **Area:** Booking / Auth  
- **Dependencies:** BKG-001, SEC-001  
- **Status:** Open  

**Acceptance Criteria**  
- Modul Booking di VAMOS FMS menggunakan `authStore` yang sama dengan modul lain.  
- Role yang diizinkan untuk Booking: `SM`, `GS1`, `GS2`, `ADM1`, `ADM2`, `User`.  
- Akses tanpa role valid langsung dialihkan ke `AccessDenied.vue`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-005] Implement WA Approval Token via SHA-256 (Port ke VAMOS)

**Objective**  
Port fungsi `generateApprovalToken` dan `verifyApprovalToken` dari `Code.js` ke modul GAS VAMOS FMS. Token sudah menggunakan SHA-256 dengan secret di Script Properties — ini sudah cukup baik, hanya perlu diintegrasikan.

**Metadata**  
- **Tracker ID:** BKG-005  
- **Priority:** P1  
- **Area:** Booking / Auth  
- **Dependencies:** BKG-003, BKG-004  
- **Status:** Open  

**Acceptance Criteria**  
- `generateApprovalToken(uid, role, action)` dan `verifyApprovalToken(uid, role, action, token)` diport ke `booking.gs` di VAMOS GAS module.  
- Secret `WA_APPROVAL_SECRET` tersimpan di Script Properties.  
- Link approval WA tetap berfungsi dari luar (tanpa login webapp).  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 3 — Core Booking API (GAS Backend Refactor)

> **Tujuan:** Pisahkan semua logika bisnis dari `Code.js` monolith menjadi RPC functions yang dipanggil via VAMOS `apiDispatcher`.  
> **Dependency:** Fase 2 selesai + BE-001 (apiDispatcher) sudah ada.

---

### [BKG-006] Extract & Port `Buat_Permintaan_User` sebagai RPC Action

**Objective**  
Ekstrak `Buat_Permintaan_User(...)` (fungsi submit utama, ~150 baris) dan semua helper dependency-nya (`checkNopolAvailability`, `getLastDataRow`, `uploadImageKeluar`, dll.) ke dalam action `booking.submit` di VAMOS API dispatcher.

**Metadata**  
- **Tracker ID:** BKG-006  
- **Priority:** P1  
- **Area:** Booking / Backend  
- **Dependencies:** BKG-001, BKG-004, BE-001  
- **Status:** Open  

**Acceptance Criteria**  
- Action `booking.submit` menerima payload `{ nopol, user, tgl_pinjam, jam_pinjam, tgl_kembali, jam_kembali, keperluan, tujuan, jenis, img_keluar_base64 }`.  
- Response code: `OK`, `EMPTY_FIELD`, `USER_NOT_FOUND`, `NOPOL_BUSY`, `DUPLICATE`, `UPLOAD_ERROR`, `SAVE_ERROR` (sesuai kontrak lama).  
- Menggunakan `LockService` untuk atomic UID generation.  
- Semua magic number raw column index diganti dengan `COL.*` konstanta.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-007] Refactor Nopol CRUD sebagai RPC Actions

**Objective**  
Port `getListNopol`, `submitData_Nopol`, `updateNopol`, `deleteNopol`, dan `checkDuplicateNopol` ke actions `booking.nopol.*` yang dapat dipanggil oleh admin melalui VAMOS frontend.

**Metadata**  
- **Tracker ID:** BKG-007  
- **Priority:** P2  
- **Area:** Booking / Backend  
- **Dependencies:** BKG-006  
- **Status:** Open  

**Acceptance Criteria**  
- Actions: `booking.nopol.list`, `booking.nopol.create`, `booking.nopol.update`, `booking.nopol.delete`.  
- Normalisasi nopol (uppercase, strip whitespace) dipertahankan.  
- Duplikat nopol (case-insensitive) ditolak dengan error `DUPLICATE_NOPOL`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-008] Refactor User (Peminjam) CRUD sebagai RPC Actions

**Objective**  
Port `getNames`, `saveSignature`, `gantiSignature`, `buildUserCache`, dan `getUserRole` ke actions `booking.user.*` di VAMOS.

**Metadata**  
- **Tracker ID:** BKG-008  
- **Priority:** P2  
- **Area:** Booking / Backend  
- **Dependencies:** BKG-006  
- **Status:** Open  

**Acceptance Criteria**  
- Actions: `booking.user.list`, `booking.user.create` (dengan upload signature base64), `booking.user.updateSignature`.  
- Signature base64 disimpan di Drive via `DriveApp`, URL tersimpan di sheet.  
- Tidak ada file Drive ID hardcoded di source; gunakan Script Properties `SIGNATURE_FOLDER_ID`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-009] Refactor Atasan WA CRUD sebagai RPC Actions

**Objective**  
Port `getListAtasanWA`, `submitData_AtasanWA`, `updateAtasanWA`, `deleteAtasanWA` ke actions `booking.atasan.*` di VAMOS.

**Metadata**  
- **Tracker ID:** BKG-009  
- **Priority:** P2  
- **Area:** Booking / Backend  
- **Dependencies:** BKG-006  
- **Status:** Open  

**Acceptance Criteria**  
- Actions: `booking.atasan.list`, `booking.atasan.create`, `booking.atasan.update`, `booking.atasan.delete`.  
- Normalisasi nomor WA (strip kode negara, strip leading 0) dipertahankan.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-010] Refactor List Booking & Filter Data sebagai RPC Actions

**Objective**  
Port `getDataFromSheet(tanggal_awal, tanggal_akhir)` dan `getDataFromSheet_GS(mode, ...)` ke actions `booking.list` dan `booking.list.byRole`. Konsolidasikan dua fungsi yang hampir identik menjadi satu dengan parameter `role`.

**Metadata**  
- **Tracker ID:** BKG-010  
- **Priority:** P1  
- **Area:** Booking / Backend  
- **Dependencies:** BKG-006  
- **Status:** Open  

**Acceptance Criteria**  
- Satu action `booking.list` dengan parameter `{ role, tanggal_awal, tanggal_akhir }`.  
- Role `SM` mengembalikan semua pending approval AM.  
- Role `GS1/GS2/ADM1/ADM2` mengembalikan record sesuai approval stage masing-masing.  
- Date range filtering tetap berfungsi.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 4 — Approval Workflow Refactor (State Machine)

> **Tujuan:** Ubah 5 fungsi approval yang hampir identik dan tersebar menjadi satu state machine terpusat.  
> **Dependency:** Fase 3 selesai.

---

### [BKG-011] Design Approval State Machine

**Objective**  
Buat desain state machine untuk approval flow Booking. Saat ini ada 5 stage: `PENDING → SM_APPROVED → GS1_APPROVED → ADM1_APPROVED → GS2_APPROVED → ADM2_APPROVED (selesai)` atau `REJECTED` di setiap stage. Semua logika PDF re-generate tersebar di tiap fungsi.

**Metadata**  
- **Tracker ID:** BKG-011  
- **Priority:** P1  
- **Area:** Booking / Backend  
- **Dependencies:** BKG-010  
- **Status:** Open  

**Acceptance Criteria**  
- Dokumen `docs/BOOKING_APPROVAL_FLOW.md` menggambarkan state machine lengkap.  
- Definisi stage: `DRAFT`, `PENDING_AM`, `PENDING_GS1`, `PENDING_ADM1`, `PENDING_GS2`, `PENDING_ADM2`, `COMPLETED`, `REJECTED`.  
- Setiap transisi mendefinisikan: siapa yang boleh trigger, field apa yang diupdate, event WA apa yang dikirim.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-012] Implement Unified Approval RPC Action

**Objective**  
Ganti 5 fungsi terpisah (`uid_diterima`, `uid_terima`, `uid_terima_GS1`, `uid_terima_GS2`, `uid_terima_ADM`) dengan satu action `booking.approval.process` yang mengeksekusi transisi state berdasarkan role dan action.

**Metadata**  
- **Tracker ID:** BKG-012  
- **Priority:** P1  
- **Area:** Booking / Backend  
- **Dependencies:** BKG-011, BKG-005  
- **Status:** Open  

**Acceptance Criteria**  
- Satu action `booking.approval.process` menerima `{ uid, role, action: 'approve'|'reject', data? }`.  
- Transisi state divalidasi; reject transition yang tidak valid (mis. ADM2 approve sebelum GS2).  
- Setelah approve: trigger PDF generation dan WA notification otomatis.  
- Setelah reject: tandai REJECTED dan hentikan chain.  
- Authorization: role tidak boleh approve stage milik role lain.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-013] Refactor PDF Generation — Single Configurable Generator

**Objective**  
Saat ini ada 5+ fungsi PDF yang hampir identik dengan copy-paste besar (`uid_diterima`, `uid_terima_GS1`, `uid_terima_GS2`, `uid_terima_ADM`, `regenerate_pdf`). Buat satu fungsi `generateBookingPDF(uid, stage)` yang menerima stage dan mengisi template secara konfigurasi.

**Metadata**  
- **Tracker ID:** BKG-013  
- **Priority:** P2  
- **Area:** Booking / Backend  
- **Dependencies:** BKG-012  
- **Status:** Open  

**Acceptance Criteria**  
- Satu fungsi `generateBookingPDF(uid, stage)` menggantikan seluruh fungsi PDF lama.  
- Folder ID PDF di Script Properties `PDF_FOLDER_ID` (bukan hardcoded).  
- Spreadsheet ID template PDF di Script Properties `PDF_TEMPLATE_SS_ID` (bukan hardcoded).  
- Signer name/NDK tidak hardcoded; dibaca dari data row atau config.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 5 — WhatsApp Notification Refactor

> **Tujuan:** Integrasikan sistem WA Queue `FronteWA.js` ke dalam arsitektur VAMOS `WA_Outbox`.  
> **Dependency:** BKG-012 selesai + JOB-001 (WA Queue di VAMOS) sudah ada.

---

### [BKG-014] Port FronteWA Queue ke VAMOS WA_Outbox

**Objective**  
`FronteWA.js` sudah memiliki queue (`WA_Queue` sheet) yang baik. Port `enqueueWA`, `processWAQueue`, `getPendingWA`, `updateWAStatus` ke dalam sistem `WA_Outbox` VAMOS yang terpusat.

**Metadata**  
- **Tracker ID:** BKG-014  
- **Priority:** P2  
- **Area:** Booking / Backend / WA  
- **Dependencies:** BKG-012, JOB-001  
- **Status:** Open  

**Acceptance Criteria**  
- Semua WA notification Booking masuk ke sheet `WA_Outbox` yang sama dengan modul lain.  
- Kolom tambahan `module` (nilai: `BOOKING`) ditambahkan untuk tracing.  
- `processWAQueue()` terpusat menangani semua modul.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-015] Port WA Message Builder Functions

**Objective**  
Port `buildWANotifGS1`, `buildWANotifADM1`, `buildWANotifGS2`, `buildWANotifADM2` ke dalam format template VAMOS yang konsisten.

**Metadata**  
- **Tracker ID:** BKG-015  
- **Priority:** P3  
- **Area:** Booking / Backend / WA  
- **Dependencies:** BKG-014  
- **Status:** Open  

**Acceptance Criteria**  
- Pesan WA menggunakan template yang dapat dikonfigurasi (bukan hardcoded string).  
- Link approval di pesan menggunakan URL Web App dari Script Properties.  
- Nama dan NDK approver dibaca dinamis dari data (tidak ada hardcoded name seperti `'Haries Istyawan'`).  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 6 — Frontend Vue 3 Booking Module

> **Tujuan:** Buat UI Booking module di VAMOS FMS SPA menggantikan 16 file HTML lama.  
> **Dependency:** Fase 3, 4, 5 selesai + FE-002 (View Components) sudah ada.

---

### [BKG-016] BookingView.vue — Form Submit Peminjaman

**Objective**  
Buat halaman Vue untuk form pengajuan peminjaman kendaraan. Menggantikan `form.html` (~28 KB HTML spaghetti).

**Metadata**  
- **Tracker ID:** BKG-016  
- **Priority:** P1  
- **Area:** Booking / Frontend  
- **Dependencies:** BKG-006, BKG-007, BKG-008, FE-002  
- **Status:** Open  

**Acceptance Criteria**  
- Form field: Nama Peminjam (dropdown dari userList), Nopol (dropdown dari nopolList), Tanggal Pinjam, Jam, Tanggal Kembali, Jam, Keperluan, Tujuan, Jenis (Operasional/Non-Operasional).  
- Upload foto kondisi kendaraan keluar (base64 via input file).  
- Validasi client-side sebelum submit.  
- Response code ditampilkan sebagai toast notifikasi (OK, NOPOL_BUSY, DUPLICATE, dll.).  
- `isSubmitting` flag mencegah double submit.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-017] BookingListView.vue — Daftar Permintaan & Status

**Objective**  
Buat halaman daftar peminjaman dengan filter tanggal dan status. Menggantikan `form_listpermintaan.html` + `DataTable.html`.

**Metadata**  
- **Tracker ID:** BKG-017  
- **Priority:** P1  
- **Area:** Booking / Frontend  
- **Dependencies:** BKG-010, BKG-016  
- **Status:** Open  

**Acceptance Criteria**  
- Tabel menampilkan: UID, Peminjam, Nopol, Tanggal Pinjam, Status Approval (badge berwarna).  
- Filter berdasarkan tanggal dan status.  
- Klik row membuka detail peminjaman.  
- Role-based visibility: SM hanya lihat yang perlu approval AM, GS1 lihat yang perlu GS1, dst.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-018] BookingApprovalView.vue — Halaman Approval per Role

**Objective**  
Buat halaman approval yang role-aware. Menggantikan `form_apppeminjaman.html`, `form_appkeluar.html`, `form_appmasuk.html`, `form_appkeluar_adm.html`, `form_appmasuk_adm.html` (5 file terpisah!).

**Metadata**  
- **Tracker ID:** BKG-018  
- **Priority:** P1  
- **Area:** Booking / Frontend  
- **Dependencies:** BKG-012, BKG-017  
- **Status:** Open  

**Acceptance Criteria**  
- Satu view dengan tampilan adaptif berdasarkan role pengguna aktif.  
- SM: tampilkan tombol Setuju/Tolak untuk pending AM.  
- GS1: tampilkan form pemeriksaan kendaraan keluar + marks kendaraan.  
- ADM1: tampilkan konfirmasi penyerahan kendaraan.  
- GS2: tampilkan form pemeriksaan kendaraan masuk + foto + marks.  
- ADM2: tampilkan konfirmasi penerimaan kendaraan.  
- Setiap approval menampilkan preview PDF setelah berhasil.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-019] WAApprovalPage.vue — Landing Page Approve via Link WA

**Objective**  
Buat halaman standalone yang bisa diakses dari link WA (tanpa login webapp). Menggantikan `form_approve_wa.html`.

**Metadata**  
- **Tracker ID:** BKG-019  
- **Priority:** P1  
- **Area:** Booking / Frontend  
- **Dependencies:** BKG-005, BKG-012  
- **Status:** Open  

**Acceptance Criteria**  
- URL: `?page=approve_wa&uid=...&role=...&action=...&token=...`.  
- Tampilkan detail peminjaman (nama, nopol, tanggal, keperluan).  
- Tombol Setuju / Tolak — konfirmasi sebelum aksi.  
- Respon sukses/gagal ditampilkan dengan UI yang ramah (bukan raw error).  
- Jika sudah diproses, tampilkan status "Sudah Diproses".  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-020] AdminBookingPanel.vue — CRUD Nopol, User & Atasan WA

**Objective**  
Konsolidasikan `form_adduser.html`, `form_addnopol.html`, `form_addatasan.html`, `form_user.html`, `form_nopol.html` (5 admin form terpisah!) menjadi satu admin panel dengan tab.

**Metadata**  
- **Tracker ID:** BKG-020  
- **Priority:** P2  
- **Area:** Booking / Frontend  
- **Dependencies:** BKG-007, BKG-008, BKG-009, FE-002  
- **Status:** Open  

**Acceptance Criteria**  
- Panel dengan 3 tab: **Kendaraan (Nopol)**, **Pengguna**, **Atasan WA**.  
- Setiap tab: tabel list + form tambah + edit inline + hapus dengan konfirmasi.  
- Upload signature user via canvas input.  
- Akses panel dibatasi untuk role Admin/SM.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 7 — Audit, Testing & Cutover

> **Tujuan:** Pastikan semua kontrak lama terpenuhi, lalu cutover production.

---

### [BKG-021] Port & Automate Unit Tests

**Objective**  
Port `testCode.js` (76 KB test manual) dan `runNopolTests()` dari `Code.js` ke automated test suite VAMOS. Tambahkan test untuk approval state machine.

**Metadata**  
- **Tracker ID:** BKG-021  
- **Priority:** P1  
- **Area:** Booking / Testing  
- **Dependencies:** BKG-012, BKG-013  
- **Status:** Open  

**Acceptance Criteria**  
- Test untuk semua response code submit: `OK`, `EMPTY_FIELD`, `USER_NOT_FOUND`, `NOPOL_BUSY`, `DUPLICATE`.  
- Test untuk approval state transitions: valid dan invalid.  
- Test untuk WA token: generate, verify, expired/invalid.  
- Test untuk PDF generation dipanggil pada stage yang benar.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-022] Smoke Test End-to-End Booking Flow

**Objective**  
Lakukan pengujian end-to-end seluruh alur Booking di VAMOS FMS sebelum cutover production.

**Metadata**  
- **Tracker ID:** BKG-022  
- **Priority:** P1  
- **Area:** Booking / Testing  
- **Dependencies:** BKG-016 - BKG-020, BKG-021  
- **Status:** Open  

**Acceptance Criteria**  
- Submit `Operasional` → otomatis approve SM → PDF dibuat → GS1 approve → ADM1 approve → selesai.  
- Submit `Non Operasional` → WA ke atasan → approval via link WA → lanjut ke GS1 → dst.  
- Test duplikat submit dengan kombinasi yang sama → `DUPLICATE`.  
- Test nopol busy pada periode overlap → `NOPOL_BUSY`.  
- Test partial row → submit ulang → row dilengkapi (bukan duplikat).  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [BKG-023] Production Cutover & Deprecate old_apps/Booking

**Objective**  
Setelah semua smoke test lulus, lakukan cutover: arahkan URL production ke VAMOS FMS dan tandai `old_apps/Booking` sebagai deprecated/archived.

**Metadata**  
- **Tracker ID:** BKG-023  
- **Priority:** P1  
- **Area:** Booking / Deployment  
- **Dependencies:** BKG-022  
- **Status:** Open  

**Acceptance Criteria**  
- Spreadsheet `datadb` dimigrasi atau dibridge ke skema baru jika diperlukan.  
- URL lama diarahkan ke VAMOS FMS Web App.  
- `old_apps/Booking/README.md` diupdate dengan status DEPRECATED.  
- Monitoring error selama 7 hari pasca cutover.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 📊 Summary

| Fase | Issues | Priority Focus | Estimasi Kompleksitas |
|:---|:---|:---|:---|
| **Fase 1 — Data Layer** | BKG-001, 002, 003 | P0 Security + P1 Schema | Rendah — dokumentasi & secret |
| **Fase 2 — Auth** | BKG-004, 005 | P1 Auth | Menengah — integrasi token |
| **Fase 3 — Core API** | BKG-006 ~ 010 | P1 Core Logic | Tinggi — extract dari monolith |
| **Fase 4 — Approval** | BKG-011 ~ 013 | P1 State Machine | Tinggi — 5 fungsi → 1 |
| **Fase 5 — WA Notif** | BKG-014, 015 | P2 Notification | Menengah — port queue |
| **Fase 6 — Frontend** | BKG-016 ~ 020 | P1/P2 UI | Tinggi — 16 HTML → 5 Vue |
| **Fase 7 — QA & Cutover** | BKG-021 ~ 023 | P1 Quality Gate | Menengah — testing |

| Metrik | Nilai |
|:---|:---|
| Total Issues Booking | 23 |
| P0 Critical | 2 (BKG-001 Security Token, BKG-003 WA Token) |
| P1 High | 13 |
| P2 Medium | 7 |
| P3 Low | 1 |

---

## 🏗️ Dependency Map

```
BKG-001 (Schema)
    └── BKG-002 (Pinia Store)
    └── BKG-004 (Auth)
BKG-003 (WA Token Security) ← PALING URGENT dikerjakan pertama
    └── BKG-005 (Approval Token)

BKG-006 (Core Submit)
    ├── BKG-007 (Nopol CRUD)
    ├── BKG-008 (User CRUD)
    ├── BKG-009 (Atasan WA CRUD)
    └── BKG-010 (List & Filter)
            └── BKG-011 (State Machine Design)
                    └── BKG-012 (Unified Approval RPC)
                            └── BKG-013 (PDF Generator)
                            └── BKG-014 (WA Queue Port)
                                    └── BKG-015 (WA Messages)

BKG-016 + BKG-017 + BKG-018 + BKG-019 + BKG-020 (Frontend — parallel)
    └── BKG-021 (Tests)
            └── BKG-022 (E2E Smoke Test)
                    └── BKG-023 (Cutover)
```
