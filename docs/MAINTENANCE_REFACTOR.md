# 🔧 ISSUE TRACKER — Maintenance Module Refactor (old_apps → VAMOS FMS)

> **Terakhir diperbarui:** 2026-09-08 00:45 WIB\n> **Status Implementasi:** ✅ 100% Selesai (Semua 26 Isu Terverifikasi & Closed)  
> **Target:** Merefaktor `old_apps/Maintenance` (GAS SmartServ monolith) menjadi modul Vue 3 + GAS di VAMOS FMS  
> **Strategi:** Strangler Fig — ganti module per domain tanpa mengganggu production lama

---

## 🔍 Analisis Kondisi Lama (old_apps/Maintenance)

### Identitas Sistem Lama

| Properti | Nilai |
|:---|:---|
| **Nama App** | SmartServ (ePML AIS JOMO) |
| **Backend** | `webcore.js` (332 baris) + `macro.js` (854 baris) |
| **Frontend** | `index.html` (86 KB!), 10 `app_*.html` terpisah, plus `style.html` (68 KB!) |
| **Auth** | Custom login/password dengan enkripsi AES via library `cCryptoGS` (NPK/passkey) |
| **Dependency Eksternal** | `cCryptoGS` library (AES), Bootstrap 5, jQuery, DataTables, html2pdf.js, SweetAlert2 |
| **DB** | Google Sheets multi-sheet: `users`, `usercontrol`, `harsat`, `laporan`, `rab`, `no_rab`, `no_spk`, `vehicles`, `resume`, `reference` |
| **Spreadsheet ID** | Hardcoded: `1RWmQc_V-VlVxD8bV6WAJM2mzeXzq42yizzCc502DI3I` |
| **Folder IDs** | Hardcoded: `folderIMG`, `folderPDF` di baris 3-4 `webcore.js` |

### Temuan Kritis dari Code Review

| Area | Masalah | Risiko |
|:---|:---|:---|
| **Kunci Enkripsi** | `let ᗩrisՈurᗰahendra = "U2FsdGVkX1+v..."` hardcoded di baris 1 `webcore.js` — ini **AES key** | 🔥 Critical Security |
| **Auth Lama** | Login berbasis username/passkey custom (bukan Google Identity) via `akses_getpass`/CryptoJS di frontend | Tidak terintegrasi VAMOS auth |
| **`doGet` Mode-based Router** | Satu `doGet` menangani semua: akses auth, halaman HTML, dan file blob — tidak ada separation | Tidak scalable |
| **`doPost` Routing** | Route manual via `payload.mode` + `payload.post` string matching — tidak type-safe | Rawan typo bug |
| **Spreadsheet ID hardcoded** | `spreadsheetId` di global scope `webcore.js` baris 2 | Tidak portabel |
| **Folder ID hardcoded** | `folderIMG`, `folderPDF` di baris 3-4 | Tidak portabel |
| **Frontend 86 KB monolith** | `index.html` 86.570 bytes single file dengan seluruh app JS inline | Tidak maintainable |
| **Auth di localStorage** | Passkey, uid, dan sesi user disimpan di `localStorage` dan dicek via timestamp `user` | Mudah di-manipulasi |
| **`updateLaporan` bug** | Status `status_perbaikan` dihitung otomatis tapi langsung di-`null` di baris 381 (`item.status_perbaikan = null`) | 🐛 Existing bug! |
| **`saveSPKDetailToSheet` bug** | `values['status_spk'] = null` — ini set property pada Array object, tidak mengisi cell | 🐛 Existing bug! |
| **`saveRAB` duplicate** | Dua fungsi `saveRAB` dan `saveRABDetailToSheet` hampir identik | Technical debt |
| **UID RAB** | `uid_rab = Date.now() + index` — non-deterministic, collision-prone saat batch | Data integrity risk |
| **`getPage` bug** | Fungsi `getPage(name)` mengakses `filename` (undefined) bukan parameter `name` | 🐛 Bug, never works |
| **Access ANYONE_ANONYMOUS** | `appsscript.json` `access: ANYONE_ANONYMOUS` — siapapun bisa akses tanpa Google login | Security gap |
| **Library cCryptoGS** | Bergantung pada library GAS pihak ketiga untuk enkripsi AES — tidak ada di ekosistem VAMOS | External dependency |
| **`getNoRABList`** | Menggunakan `SpreadsheetApp.getActiveSpreadsheet()` bukan `openById(spreadsheetId)` — berbeda dari fungsi lain | Inkonsistensi |

### Domain Model yang Diidentifikasi

```
SmartServ memiliki 6 domain utama:

1. AUTH         → Login/user management (akses_*, usercontrol, users)
2. LAPORAN      → Laporan kerusakan kendaraan (CRUD + status machine)
3. HARSAT       → Harga satuan/master item biaya (CRUD)
4. RAB          → Rencana Anggaran Biaya per laporan
5. SPK          → Surat Perintah Kerja (referensi dari RAB)
6. VEHICLES     → Master data kendaraan operasional
```

---

## 🎯 Strategi Refactor: 7 Fase Sequential

Urutan dikerjakan berdasarkan **dependency chain** dan **security risk**:

```
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7
(Secret) (Schema) (Auth)   (Core)   (Dokumen) (UI)     (QA)
```

---

## 🚩 Fase 1 — Secret Remediation (PALING URGENT)

> **Tujuan:** Pindahkan semua hardcoded secrets dan IDs sebelum apapun dikerjakan.  
> **Dependency:** Tidak ada. Dikerjakan sebelum semua fase lain.

---

### [MTN-001] Pindahkan AES Key ke Script Properties

**Objective**  
`let ᗩrisՈurᗰahendra = "U2FsdGVkX1+vWwcA..."` di baris 1 `webcore.js` adalah **kunci enkripsi AES** yang dipakai untuk mengenkripsi username, password, dan nama user di seluruh sistem. Ini hardcoded di source code dan harus segera dipindahkan.

**Metadata**  
- **Tracker ID:** MTN-001  
- **Priority:** P0 🔥 CRITICAL SECURITY  
- **Area:** Maintenance / Security  
- **Dependencies:** None  
- **Status:** Closed  

**Acceptance Criteria**  
- Variabel `ᗩrisՈurᗰahendra` dihapus dari seluruh source code.  
- Key disimpan di `PropertiesService.getScriptProperties().getProperty('AES_ENCRYPTION_KEY')`.  
- Fungsi `encryptString()` dan `decryptString()` membaca key dari Script Properties.  
- Tidak ada secret tersisa di file `.js`, `.html`, atau git history yang akan di-push.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-002] Pindahkan Spreadsheet ID dan Folder ID ke Script Properties

**Objective**  
`spreadsheetId`, `folderIMG`, dan `folderPDF` hardcoded di `webcore.js` baris 2-4. Semua harus dipindahkan ke Script Properties agar deployable ke environment berbeda.

**Metadata**  
- **Tracker ID:** MTN-002  
- **Priority:** P0  
- **Area:** Maintenance / Config  
- **Dependencies:** None  
- **Status:** Closed  

**Acceptance Criteria**  
- Script Properties yang dibutuhkan: `MAINTENANCE_SS_ID`, `MAINTENANCE_FOLDER_IMG`, `MAINTENANCE_FOLDER_PDF`.  
- Seluruh file `macro.js` dan `webcore.js` membaca ID dari Script Properties, bukan hardcoded.  
- Inkonsistensi `getActiveSpreadsheet()` vs `openById()` diseragamkan ke `openById`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 2 — Data Schema & Bug Fixes

> **Tujuan:** Dokumentasikan skema semua sheet dan perbaiki bug yang diidentifikasi sebelum refactor logika.

---

### [MTN-003] Audit & Dokumentasi Schema Semua Sheet Maintenance

**Objective**  
Dokumentasikan struktur semua sheet: `users`, `usercontrol`, `harsat`, `laporan`, `rab`, `no_rab`, `no_spk`, `vehicles`, `resume`, `reference` ke dalam `docs/MAINTENANCE_SCHEMA.md`.

**Metadata**  
- **Tracker ID:** MTN-003  
- **Priority:** P1  
- **Area:** Maintenance / Data  
- **Dependencies:** MTN-001, MTN-002  
- **Status:** Closed  

**Acceptance Criteria**  
- Setiap sheet terdokumentasi: kolom, tipe, mandatory/optional, dan relasi ke sheet lain.  
- Field `deleted` (soft-delete) terdokumentasi dengan format timestamp ISO.  
- Relasi antar entitas: `laporan → rab (via uid_laporan)`, `rab → no_rab (via no_rab)`, `no_rab → no_spk (via no_spk)`.  
- Dokumen menjadi satu-satunya referensi selama refactor.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-004] Perbaiki Bug Kritis di `updateLaporan` dan `saveSPKDetailToSheet`

**Objective**  
Dua bug kritis yang ditemukan saat code review:  
1. `updateLaporan` (baris 381): `item.status_perbaikan = null` — logika status terhitung tapi langsung di-null-kan.  
2. `saveSPKDetailToSheet` (baris 819): `values['status_spk'] = null` — set property pada Array, bukan mengisi cell.

**Metadata**  
- **Tracker ID:** MTN-004  
- **Priority:** P0 🐛 BUG  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-003  
- **Status:** Closed  

**Acceptance Criteria**  
- `updateLaporan`: status machine (`Open → Process → Close`) berfungsi benar tanpa di-override `null`.  
- `saveSPKDetailToSheet`: `status_spk` terisi dengan benar ke cell sheet, bukan ke property Array.  
- Unit test untuk kedua fungsi tersebut lulus.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-005] Design Maintenance Pinia Store Schema

**Objective**  
Rancang skema state VAMOS FMS untuk module Maintenance menggunakan Pinia, mencerminkan semua 6 domain: Auth, Laporan, Harsat, RAB, SPK, Vehicles.

**Metadata**  
- **Tracker ID:** MTN-005  
- **Priority:** P1  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-003  
- **Status:** Closed  

**Acceptance Criteria**  
- `useMaintenanceStore.js` dibuat dengan state per domain: `laporan[]`, `harsat[]`, `rab[]`, `noRabList[]`, `noSpkList[]`, `vehicles[]`.  
- Store menggunakan `useAuthStore` VAMOS (bukan local auth lama).  
- State `statusLaporan: 'Open' | 'Process' | 'Close'` terdefinisi sebagai enum.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 3 — Authentication & Access Control

> **Tujuan:** Ganti sistem auth custom (AES username/password di localStorage) dengan VAMOS auth token.  
> **Dependency:** Fase 1, 2 selesai + SEC-001 (VAMOS auth) sudah ada.

---

### [MTN-006] Ganti Custom Auth dengan VAMOS Google Identity Auth

**Objective**  
Sistem auth lama menggunakan username/passkey custom yang dienkripsi AES, disimpan di `localStorage`, dan diverifikasi manual lewat `akses_getpass`. Ganti seluruhnya dengan Google Identity handshake VAMOS FMS.

**Metadata**  
- **Tracker ID:** MTN-006  
- **Priority:** P1  
- **Area:** Maintenance / Auth  
- **Dependencies:** MTN-001, SEC-001  
- **Status:** Closed  

**Acceptance Criteria**  
- Tidak ada lagi custom login form atau passkey management.  
- Akses module Maintenance dikendalikan via `authStore` VAMOS dengan role-based: `Teknisi`, `Supervisor`, `Manager`, `Admin`.  
- Mapping role lama (`menuadmin`, `menuinsp`, `menuplks`, dst.) ke role VAMOS terdokumentasi.  
- `appsscript.json` `access` diubah dari `ANYONE_ANONYMOUS` ke `ANYONE` (Google login required).  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-007] Migrate User Management ke VAMOS USER_ROLES

**Objective**  
Sheet `users` dan `usercontrol` menyimpan data user Maintenance dengan password terenkripsi. Migrate user data ke `USER_ROLES` VAMOS dengan enkripsi sesuai `POL.ISMS.001.md`.

**Metadata**  
- **Tracker ID:** MTN-007  
- **Priority:** P2  
- **Area:** Maintenance / Auth  
- **Dependencies:** MTN-006  
- **Status:** Closed  

**Acceptance Criteria**  
- Data user dari `usercontrol` dimigrasikan ke `USER_ROLES` VAMOS dengan field: `user_id`, `email`, `fullname`, `role`, `is_active`.  
- Mapping menu permission lama (`menuinsp`, `menuplks`, dll.) ke `ROLE_PERMISSIONS` VAMOS.  
- Script migrasi one-time tersedia dan terdokumentasi.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 4 — Core Business API (GAS Backend Refactor)

> **Tujuan:** Pisahkan semua logika bisnis dari `macro.js` monolith menjadi RPC actions via VAMOS `apiDispatcher`.  
> **Dependency:** Fase 3 selesai + BE-001 (apiDispatcher) sudah ada.

---

### [MTN-008] Laporan CRUD & Status Machine sebagai RPC Actions

**Objective**  
Port `getLaporan`, `addLaporan`, `updateLaporan`, `deleteLaporan` ke actions `maintenance.laporan.*` di VAMOS. Implementasi ulang status machine yang saat ini broken (`Open → Process → Close`) dengan benar.

**Metadata**  
- **Tracker ID:** MTN-008  
- **Priority:** P1  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-004, MTN-006, BE-001  
- **Status:** Closed  

**Acceptance Criteria**  
- Actions: `maintenance.laporan.list`, `maintenance.laporan.create`, `maintenance.laporan.update`, `maintenance.laporan.delete`.  
- Status machine `status_perbaikan` berfungsi benar: `Open` → `Process` (saat `rencana_perbaikan` dan `tanggal_perbaikan` terisi) → `Close` (saat semua referensi dokumen terisi).  
- `addLaporan` menggunakan UID dengan format `L{timestamp}` yang idempotent (tidak lagi mencari baris kosong — gunakan append).  
- Filter `getLaporan(prompt)` dipertahankan.  
- Soft-delete via `deleted` timestamp.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-009] Harsat (Harga Satuan) CRUD sebagai RPC Actions

**Objective**  
Port `getHarsat`, `addHarsat`, `updateHarsat`, `deleteHarsat` ke actions `maintenance.harsat.*` di VAMOS. Ini adalah master data item biaya yang menjadi sumber dropdown saat membuat RAB.

**Metadata**  
- **Tracker ID:** MTN-009  
- **Priority:** P2  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-008  
- **Status:** Closed  

**Acceptance Criteria**  
- Actions: `maintenance.harsat.list`, `maintenance.harsat.create`, `maintenance.harsat.update`, `maintenance.harsat.delete`.  
- Field yang tersedia: `uid`, `nama_item`, `satuan`, `harga`, `kategori`, `keterangan`, `deleted`.  
- Soft-delete via timestamp.  
- Pencarian by `nama_item` (untuk autocomplete di form RAB).  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-010] Vehicles (Master Kendaraan) CRUD sebagai RPC Actions

**Objective**  
Port `getVehicles` ke actions `maintenance.vehicles.*` di VAMOS. Kendaraan adalah entitas master yang direferensi oleh laporan, RAB, dan SPK.

**Metadata**  
- **Tracker ID:** MTN-010  
- **Priority:** P2  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-008  
- **Status:** Closed  

**Acceptance Criteria**  
- Actions: `maintenance.vehicles.list`, `maintenance.vehicles.create`, `maintenance.vehicles.update`, `maintenance.vehicles.delete`.  
- Field: `uid`, `plat_kr`, `jenis`, `merek`, `tahun`, `no_rangka`, `no_mesin`, `deleted`.  
- Soft-delete via timestamp.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-011] RAB (Rencana Anggaran Biaya) sebagai RPC Actions

**Objective**  
Konsolidasikan `saveRAB`, `saveRABDetailToSheet` (dua fungsi hampir identik!), `getRABLaporan`, `getRABByNoRAB`, dan `getNoRABList` ke dalam actions `maintenance.rab.*` yang konsisten. Perbaiki juga UID generation RAB yang collision-prone (`Date.now() + index`).

**Metadata**  
- **Tracker ID:** MTN-011  
- **Priority:** P1  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-008, MTN-009, MTN-010  
- **Status:** Closed  

**Acceptance Criteria**  
- Actions: `maintenance.rab.list`, `maintenance.rab.listByLaporan`, `maintenance.rab.create`, `maintenance.rab.update`, `maintenance.rab.delete`.  
- UID RAB menggunakan format `RAB-{ULID}` yang dijamin unik dan idempotent.  
- Satu fungsi `saveRAB` tunggal menggantikan dua fungsi lama yang redundant.  
- Field: `uid_rab`, `uid_laporan`, `no_rab`, `tanggal_rab`, item list, `plat_kr`, `status_rab`, `deleted`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-012] SPK (Surat Perintah Kerja) sebagai RPC Actions

**Objective**  
Port `getSPKRab`, `getNoSPKList`, `saveSPKDetailToSheet`, `deleteSPKByNo`, `getInfoSPK`, `updateResumeDasarDokumen` ke actions `maintenance.spk.*`. Perbaiki bug `values['status_spk'] = null`.

**Metadata**  
- **Tracker ID:** MTN-012  
- **Priority:** P1  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-011  
- **Status:** Closed  

**Acceptance Criteria**  
- Actions: `maintenance.spk.list`, `maintenance.spk.listFromRAB`, `maintenance.spk.create`, `maintenance.spk.delete`, `maintenance.spk.getInfo`, `maintenance.spk.updateDasarDokumen`.  
- Bug `values['status_spk'] = null` diperbaiki; status terisi dengan nilai yang benar.  
- Status machine SPK: `Open → Active → Closed`.  
- Relasi `no_rab → no_spk` divalidasi.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-013] Resume & Summary Data sebagai RPC Actions

**Objective**  
Port `getResumeData`, `updateResumeDasarDokumen` ke actions `maintenance.resume.*`. Fungsi ini membaca rekap dari sheet `resume` (berisi statistik laporan, rab, spk, ba).

**Metadata**  
- **Tracker ID:** MTN-013  
- **Priority:** P2  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-012  
- **Status:** Closed  

**Acceptance Criteria**  
- Action `maintenance.resume.get` mengembalikan summary: total laporan (open/process/close), total RAB, total SPK.  
- Summary dihitung dari raw data sheet, bukan hardcoded dari `resume` sheet (yang bisa stale).  
- `getInfoSPK` (data dasar dokumen SPK) diintegrasikan sebagai bagian dari `maintenance.spk.getInfo`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 5 — Document Upload & PDF

> **Tujuan:** Refactor upload dokumen (gambar, PDF) ke dalam pola VAMOS yang konsisten.

---

### [MTN-014] Unified Document Upload Action

**Objective**  
Port `uploadBase64ImageToDrive` dan `uploadPdfAndSetReference` ke dalam action `maintenance.document.upload` yang terpusat. Saat ini dua fungsi berbeda mengelola upload ke folder yang sama (hardcoded).

**Metadata**  
- **Tracker ID:** MTN-014  
- **Priority:** P1  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-002, MTN-012  
- **Status:** Closed  

**Acceptance Criteria**  
- Action `maintenance.document.upload` menerima: `{ base64, fileName, type: 'image'|'pdf', targetSheet, targetUid, targetHeader }`.  
- Folder ID dibaca dari Script Properties (`MAINTENANCE_FOLDER_IMG`, `MAINTENANCE_FOLDER_PDF`).  
- File otomatis di-set `ANYONE_WITH_LINK VIEW` setelah upload.  
- Link file dicatat ke sheet `reference` dengan audit trail (timestamp, user).  
- Rollback: jika write ke `reference` gagal, file Drive di-trash.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-015] PDF Generation dari Template Sheet

**Objective**  
Identifikasi dan port fungsi pembuatan PDF dokumen (RAB, SPK, BA) yang ada di `app_rab.html` dan `app_spk.html` (menggunakan html2pdf.js di client) ke server-side GAS `convertSheetToPDF` pattern yang konsisten dengan VAMOS.

**Metadata**  
- **Tracker ID:** MTN-015  
- **Priority:** P2  
- **Area:** Maintenance / Backend  
- **Dependencies:** MTN-014  
- **Status:** Closed  

**Acceptance Criteria**  
- PDF RAB dan SPK di-generate server-side via GAS (bukan html2pdf.js client-side).  
- Template PDF menggunakan Google Sheets template sheet (konsisten dengan pola Booking).  
- Link PDF disimpan di kolom `ref_rab`, `ref_spk`, `ref_ba` pada sheet terkait.  
- Folder tujuan dari Script Properties.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 6 — Frontend Vue 3 Maintenance Module

> **Tujuan:** Buat UI Maintenance module di VAMOS FMS SPA menggantikan 10 file `app_*.html` + `index.html` monolith.  
> **Dependency:** Fase 3-5 selesai + FE-002 (View Components) sudah ada.

---

### [MTN-016] MaintenanceDashboardView.vue — Landing & Summary

**Objective**  
Buat halaman dashboard Maintenance menggantikan `app_main.html` dan `app_welcome.html`. Tampilkan ringkasan: jumlah laporan (per status), RAB pending, SPK aktif, dan kendaraan.

**Metadata**  
- **Tracker ID:** MTN-016  
- **Priority:** P1  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-013, FE-002  
- **Status:** Closed  

**Acceptance Criteria**  
- Card summary: Total Laporan (Open/Process/Close), RAB Pending, SPK Aktif.  
- Shortcut navigasi ke menu utama.  
- Data diambil dari `maintenance.resume.get`.  
- Role-based visibility: hanya Supervisor/Manager yang lihat semua, Teknisi hanya lihat laporannya.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-017] LaporanView.vue — CRUD Laporan Kerusakan + Status Tracking

**Objective**  
Buat halaman manajemen laporan kerusakan menggantikan `app_laporan.html` (44 KB!). Tampilkan daftar laporan dengan filter, status badge, dan form edit.

**Metadata**  
- **Tracker ID:** MTN-017  
- **Priority:** P1  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-008, MTN-016  
- **Status:** Closed  

**Acceptance Criteria**  
- Tabel laporan dengan filter: status (`Open`/`Process`/`Close`), plat kendaraan, tanggal.  
- Form tambah laporan: plat kendaraan (dropdown dari vehicles), deskripsi kerusakan, upload foto kondisi.  
- Form edit laporan: rencana perbaikan, tanggal perbaikan, upload foto hasil, referensi RAB/SPK/BA.  
- Status badge otomatis berubah sesuai kelengkapan data.  
- Klik laporan → buka detail dengan timeline status.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-018] RABView.vue — Rencana Anggaran Biaya Editor

**Objective**  
Buat halaman editor RAB menggantikan `app_rab.html` (38 KB!). User memilih laporan open, lalu membuat detail item RAB dengan referensi dari `harsat`.

**Metadata**  
- **Tracker ID:** MTN-018  
- **Priority:** P1  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-011, MTN-017  
- **Status:** Closed  

**Acceptance Criteria**  
- List laporan open yang belum memiliki RAB (dari `maintenance.rab.listByLaporan`).  
- Form RAB: nomor RAB (auto-generate), tanggal, tabel item (nama, qty, satuan, harga, total).  
- Autocomplete item dari `harsat` dengan populate harga otomatis.  
- Total RAB dihitung otomatis.  
- Generate dan upload PDF RAB via action `maintenance.document.upload`.  
- Status RAB: `Open → Active → Closed`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-019] SPKView.vue — Surat Perintah Kerja

**Objective**  
Buat halaman manajemen SPK menggantikan `app_spk.html` (35 KB!). SPK dibuat berdasarkan RAB yang sudah disetujui.

**Metadata**  
- **Tracker ID:** MTN-019  
- **Priority:** P1  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-012, MTN-018  
- **Status:** Closed  

**Acceptance Criteria**  
- List RAB yang siap dibuatkan SPK (status RAB = `Open`).  
- Form SPK: nomor SPK (auto-generate), tanggal, referensi RAB, keterangan.  
- Data dasar dokumen SPK (nama rekanan, tanggal perjanjian) bisa diatur.  
- Generate dan upload PDF SPK.  
- Status SPK: `Open → Active → Closed`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-020] HarsatView.vue — Master Data Harga Satuan

**Objective**  
Buat halaman CRUD harga satuan (master item biaya) menggantikan `app_harsat.html` (7 KB).

**Metadata**  
- **Tracker ID:** MTN-020  
- **Priority:** P2  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-009, FE-002  
- **Status:** Closed  

**Acceptance Criteria**  
- Tabel list harsat dengan search/filter.  
- Form tambah/edit: nama item, satuan, harga, kategori, keterangan.  
- Soft-delete dengan konfirmasi.  
- Hanya Admin/Supervisor yang bisa edit.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-021] VehiclesView.vue — Master Data Kendaraan

**Objective**  
Buat halaman CRUD kendaraan operasional menggantikan dropdown data lama.

**Metadata**  
- **Tracker ID:** MTN-021  
- **Priority:** P2  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-010, FE-002  
- **Status:** Closed  

**Acceptance Criteria**  
- Tabel list kendaraan: plat, jenis, merek, tahun, no. rangka.  
- Form tambah/edit/delete (soft-delete).  
- Integrasi dengan LaporanView sebagai dropdown pilihan plat kendaraan.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-022] ProfileView.vue — User Profile & Settings

**Objective**  
Port `app_profile.html` (7 KB) — halaman edit profil user. Di VAMOS FMS, ini cukup menampilkan data dari Google Workspace identity + role.

**Metadata**  
- **Tracker ID:** MTN-022  
- **Priority:** P3  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-006  
- **Status:** Closed  

**Acceptance Criteria**  
- Tampilkan: nama, email, role, last login.  
- Tidak ada lagi custom passkey/password management.  
- Konsisten dengan profile page modul lain di VAMOS.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-023] UserManagerView.vue — Admin Panel User

**Objective**  
Port `app_usermanager.html` (10 KB) — halaman admin manajemen user dengan role/permission, ke VAMOS admin panel yang terpusat.

**Metadata**  
- **Tracker ID:** MTN-023  
- **Priority:** P2  
- **Area:** Maintenance / Frontend  
- **Dependencies:** MTN-007  
- **Status:** Closed  

**Acceptance Criteria**  
- Hanya SuperAdmin yang dapat mengakses.  
- Tabel user dengan role assignment.  
- Aktivasi/deaktivasi user (is_active toggle).  
- Konsisten dengan user manager modul lain di VAMOS.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Fase 7 — Audit, Testing & Cutover

---

### [MTN-024] Automated Test Suite untuk Maintenance Module

**Objective**  
Port dan implementasikan automated test untuk semua RPC actions Maintenance, termasuk reproduksi dan verifikasi perbaikan kedua bug yang ditemukan (MTN-004).

**Metadata**  
- **Tracker ID:** MTN-024  
- **Priority:** P1  
- **Area:** Maintenance / Testing  
- **Dependencies:** MTN-008 – MTN-013  
- **Status:** Closed  

**Acceptance Criteria**  
- Test CRUD untuk: laporan, harsat, vehicles, rab, spk.  
- Test status machine laporan: transisi valid dan invalid.  
- Test status machine RAB: transisi valid.  
- Test upload dokumen: sukses, gagal Drive, gagal write reference (rollback).  
- Semua test lulus di `test_runner.gs` VAMOS.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-025] Smoke Test E2E Maintenance Flow

**Objective**  
Lakukan pengujian end-to-end seluruh alur Maintenance: Laporan masuk → RAB dibuat → SPK diterbitkan → Laporan Close.

**Metadata**  
- **Tracker ID:** MTN-025  
- **Priority:** P1  
- **Area:** Maintenance / Testing  
- **Dependencies:** MTN-016 – MTN-023, MTN-024  
- **Status:** Closed  

**Acceptance Criteria**  
- Buat laporan baru → status `Open`.  
- Isi rencana perbaikan → status `Process`.  
- Buat RAB dari laporan → upload PDF RAB → status RAB `Open`.  
- Buat SPK dari RAB → upload PDF SPK → status SPK `Open`.  
- Isi semua referensi dokumen di laporan → status laporan `Close`.  
- Upload foto perbaikan → link tersimpan di Drive.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MTN-026] Data Migration Script & Production Cutover

**Objective**  
Buat script migrasi data dari spreadsheet lama ke struktur VAMOS, lakukan cutover, dan arsipkan `old_apps/Maintenance`.

**Metadata**  
- **Tracker ID:** MTN-026  
- **Priority:** P1  
- **Area:** Maintenance / Deployment  
- **Dependencies:** MTN-025  
- **Status:** Closed  

**Acceptance Criteria**  
- Migration script memindahkan: `usercontrol` → `USER_ROLES`, `laporan` → VAMOS sheet, `harsat` → VAMOS sheet, `vehicles` → VAMOS sheet.  
- Data `rab`, `no_rab`, `no_spk` yang aktif dimigrasikan atau dibridge.  
- URL production lama diarahkan ke VAMOS FMS.  
- `old_apps/Maintenance/README.md` diupdate dengan status `DEPRECATED`.  
- Monitoring error 7 hari pasca cutover.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 📊 Summary

| Fase | Issues | Priority Focus | Kompleksitas |
|:---|:---|:---|:---|
| **Fase 1 — Secret Remediation** | MTN-001, 002 | P0 Critical Security | Rendah — move to ScriptProperties |
| **Fase 2 — Schema & Bug Fixes** | MTN-003, 004, 005 | P0 Bug + P1 Schema | Rendah-Menengah |
| **Fase 3 — Auth Migration** | MTN-006, 007 | P1 Auth | Menengah — ganti auth sistem |
| **Fase 4 — Core API** | MTN-008 ~ 013 | P1/P2 Business Logic | Tinggi — 6 domain dari monolith |
| **Fase 5 — Document & PDF** | MTN-014, 015 | P1/P2 Upload | Menengah |
| **Fase 6 — Frontend Vue 3** | MTN-016 ~ 023 | P1/P2/P3 UI | Tinggi — 10 HTML → 8 Vue |
| **Fase 7 — QA & Cutover** | MTN-024, 025, 026 | P1 Quality Gate | Menengah |

| Metrik | Nilai |
|:---|:---|
| Total Issues Maintenance | 26 |
| P0 Critical | 3 (MTN-001 AES Key, MTN-002 IDs, MTN-004 Bug) |
| P1 High | 14 |
| P2 Medium | 7 |
| P3 Low | 2 |

---

## 🏗️ Dependency Map

```
MTN-001 (AES Key)  ← PALING URGENT dikerjakan pertama
MTN-002 (IDs)      ← Paralel dengan MTN-001
    └── MTN-003 (Schema)
            └── MTN-004 (Bug Fixes) ← P0 Bug!
            └── MTN-005 (Pinia Store)

MTN-001 + MTN-003
    └── MTN-006 (Auth → VAMOS)
            └── MTN-007 (User Migration)

MTN-004 + MTN-006 + BE-001
    └── MTN-008 (Laporan CRUD)
    └── MTN-009 (Harsat CRUD) ← paralel
    └── MTN-010 (Vehicles CRUD) ← paralel
            └── MTN-011 (RAB)
                    └── MTN-012 (SPK)
                            └── MTN-013 (Resume)

MTN-002 + MTN-012
    └── MTN-014 (Document Upload)
            └── MTN-015 (PDF Generation)

MTN-008~015 + FE-002
    ├── MTN-016 (Dashboard)
    ├── MTN-017 (Laporan View)
    ├── MTN-018 (RAB View)
    ├── MTN-019 (SPK View)
    ├── MTN-020 (Harsat View) ← paralel
    ├── MTN-021 (Vehicles View) ← paralel
    ├── MTN-022 (Profile) ← paralel
    └── MTN-023 (User Manager) ← paralel

MTN-016~023
    └── MTN-024 (Tests)
            └── MTN-025 (E2E Smoke Test)
                    └── MTN-026 (Migration & Cutover)
```

---

## ⚡ Quick Wins — Urutan 3 Langkah Pertama

1. **MTN-001** (30 menit): Hapus AES key hardcoded → pindah ke Script Properties → security risk hilang
2. **MTN-002** (15 menit): Pindahkan Spreadsheet ID + Folder IDs → Script Properties
3. **MTN-004** (1 jam): Perbaiki dua bug kritis di `updateLaporan` dan `saveSPKDetailToSheet` → sistem lama langsung lebih stabil
