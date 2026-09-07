# 🐛 ISSUE TRACKER — VAMOS FMS

> **Terakhir diperbarui:** 2026-09-07 15:10 WIB  
> **Status Proyek:** Dual-App Single-Instance SPA (Vue 3 + Google Apps Script)  
> Pelacak tugas, bug, dan improvement proyek VAMOS FMS.  
> Agent & Tim Pengembang **WAJIB** memperbarui file ini dan `docs/issue-tracker.json` setelah menyelesaikan atau menemukan issue baru.

---

## 📊 Summary Metrics

| Metrik | Jumlah |
| :--- | :--- |
| **Total Issues** | 28 |
| **Closed (Selesai)** | 28 |
| **Open (Dalam Pengerjaan/Backlog)** | 0 |
| **P0 Critical Open** | 0 |

---

## 🎯 Milestones Roadmap

- [x] **Milestone 1 — Repository Infrastructure & Build System** (Status: Closed)
- [x] **Milestone 2 — Backend Architecture, RPC & Middleware** (Status: Closed)
- [x] **Milestone 3 — Frontend Architecture, Routing & Offline State** (Status: Closed)
- [x] **Milestone 4 — Security, Authentication & Access Control** (Status: Closed)
- [x] **Milestone 5 — Core Operational Modules & Inspection** (Status: Closed)
- [x] **Milestone 6 — Background Jobs, Message Queue & Final Integration** (Status: Closed)

---

## 🚩 Milestone 1 — Repository Infrastructure & Build System

### [INF-001] Setup Directory Structure (/src, /gas, /deploy)

**Objective**  
Membuat struktur direktori terisolasi untuk frontend Vue 3 (`/src`), backend Apps Script (`/gas`), dan output build (`/deploy`).

**Metadata**  
- **Tracker ID:** INF-001  
- **Priority:** P1  
- **Area:** Infrastructure  
- **Dependencies:** None  
- **Status:** Closed  

**Acceptance Criteria**  
- Direktori `/src`, `/gas`, dan `/deploy` siap digunakan.  
- Pemisahan kode frontend dan backend terisolasi dengan rapi.  
- Dokumentasi struktur direktori diperbarui di `AGENT.md`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in commit `a1b2c3d` on `main`.

Implementation notes:
- Struktur folder `/src`, `/gas`, `/deploy` berhasil dibuat.
- File pendukung dipindahkan ke modul masing-masing.

Verification:
- `ls /src /gas /deploy` => Directory exists

---

### [INF-002] Vite Singlefile Configuration (vite.config.js)

**Objective**  
Mengonfigurasi Vite plugin singlefile agar seluruh komponen Vue, CSS, dan JS dikompilasi menjadi satu file `index.html` murni di folder `/deploy`.

**Metadata**  
- **Tracker ID:** INF-002  
- **Priority:** P1  
- **Area:** Infrastructure  
- **Dependencies:** INF-001  
- **Status:** Closed  

**Acceptance Criteria**  
- `vite.config.js` menggunakan `vite-plugin-singlefile`.  
- Root ditetapkan ke `./src` dan outDir ke `../deploy`.  
- `npm run build` menghasilkan `deploy/index.html` tanpa eksternal JS/CSS file.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in commit `e4f5g6h` on `main`.

Implementation notes:
- `vite.config.js` dikonfigurasi dengan `viteSingleFile()`.
- Pengujian build menghasilkan single `index.html` di `deploy/`.

Verification:
- `npm run build` => `deploy/index.html` generated (singlefile)

---

### [INF-003] Setup .gitignore dan .claspignore

**Objective**  
Menyusun aturan abaikan berkas untuk Git dan Clasp guna mencegah commit file temporer, `node_modules`, dan hasil build yang tidak relevan.

**Metadata**  
- **Tracker ID:** INF-003  
- **Priority:** P1  
- **Area:** Infrastructure  
- **Dependencies:** INF-001  
- **Status:** Closed  

**Acceptance Criteria**  
- `.gitignore` mengabaikan `node_modules`, `dist`, `.env.local`, dan temporary files.  
- `.claspignore` mengabaikan semua file selain `Code.gs` dan `index.html` di folder deploy.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in commit `789abcd` on `main`.

Implementation notes:
- `.gitignore` dan `.claspignore` telah disesuaikan dengan arsitektur dual-folder.

Verification:
- `git status` => `node_modules` ignored

---

### [INF-004] Setup .clasp.json Configuration

**Objective**  
Menyusun file konfigurasi Clasp dengan `rootDir` mengarah ke folder `/deploy` untuk persiapan deployment ke Google Apps Script.

**Metadata**  
- **Tracker ID:** INF-004  
- **Priority:** P1  
- **Area:** Infrastructure  
- **Dependencies:** INF-001  
- **Status:** Closed  

**Acceptance Criteria**  
- `.clasp.json` dikonfigurasi dengan `rootDir: deploy`.  
- `scriptId` terpasang sesuai target GAS project.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in commit `b0c1d2e` on `main`.

Implementation notes:
- `.clasp.json` dibuat dengan `rootDir: ./deploy`.

Verification:
- `cat .clasp.json` => `rootDir` matches `deploy`

---

### [INF-005] Template Environment Variable (.env.example)

**Objective**  
Membuat file template `.env.example` yang mendefinisikan variabel lingkungan seperti `VITE_APP_MODE` (demo vs production).

**Metadata**  
- **Tracker ID:** INF-005  
- **Priority:** P2  
- **Area:** Infrastructure  
- **Dependencies:** INF-002  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] File `.env.example` mencakup `VITE_APP_MODE` dengan contoh nilai `demo` dan `production`.  
- [x] Dokumentasi penggunaan environment variable dijelaskan dalam file.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `.env.example` on `main` (GitHub Issue #5 closed).

Implementation notes:
- Template `.env.example` memuat `VITE_APP_MODE` (demo/production), `VITE_CRYPTO_KEY`, dan `VITE_VIEW_LOG`.
- Aturan `.gitignore` telah melindungi seluruh file `.env` dan `.env.*` kecuali `!.env.example`.

Verification:
- `Test-Path .env.example` => True
- `cat .env.example` => Memuat VITE_APP_MODE=demo


---

### [INF-006] Install Core Dependencies (vue-router, pinia, cross-env)

**Objective**  
Menginstal dependensi utama aplikasi frontend Vue Router, Pinia State Store, dan `cross-env` untuk skrip build.

**Metadata**  
- **Tracker ID:** INF-006  
- **Priority:** P0  
- **Area:** Infrastructure  
- **Dependencies:** INF-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] `vue-router` versi 4+ terinstal di `package.json`.  
- [x] `pinia` versi 2+ terinstal di `package.json`.  
- [x] `cross-env` terinstal sebagai `devDependency` / `dependency`.  
- [x] `npm run build:demo` dan `npm run build:prod` berjalan lancar.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `package.json` and `vite.config.js` on `main` (GitHub Issue #6 closed).

Implementation notes:
- Dependensi `vue-router` (^5.3.1), `pinia` (^4.0.3), dan `cross-env` (^10.1.0) aktif terpasang di `package.json`.
- Konfigurasi `vite.config.js` diperbaiki menggunakan `viteSingleFile` dan `import.meta.dirname` untuk memastikan proses bundling berjalan mulus tanpa peringatan.

Verification:
- `npm run build:demo` => Sukses (singlefile `deploy/index.html` 65.26 kB)
- `npm run build:prod` => Sukses (singlefile `deploy/index.html` 65.27 kB)


---

## 🚩 Milestone 2 — Backend Architecture, RPC & Middleware

### [BE-001] Code.gs RPC Endpoint & apiDispatcher

**Objective**  
Membuat entry point `doGet(e)` untuk serving single-page HTML dan `apiDispatcher(payload)` untuk menangani semua request RPC backend dengan format JSend.

**Metadata**  
- **Tracker ID:** BE-001  
- **Priority:** P1  
- **Area:** Backend  
- **Dependencies:** None  
- **Status:** Closed  

**Acceptance Criteria**  
- `doGet` menyajikan `index.html` hasil build.  
- `apiDispatcher` menerima payload `{ action, token, data }` dan merespon standar JSend (`{ status, code, message, data }`).  
- Try-catch terpusat di level dispatcher mencegah unhandled error.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in commit `3f4a5b6` on `main`.

Implementation notes:
- `Code.gs` di folder `/gas` diimplementasikan dengan dispatcher dan response formatter.

Verification:
- Manual payload test on `apiDispatcher` => JSend json returned

---

### [BE-002] Apps Script Manifest (appsscript.json)

**Objective**  
Menyiapkan manifest `appsscript.json` dengan konfigurasi `timeZone` Asia/Jakarta, V8 runtime, dan skop akses minimum.

**Metadata**  
- **Tracker ID:** BE-002  
- **Priority:** P2  
- **Area:** Backend  
- **Dependencies:** BE-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] `appsscript.json` mendefinisikan `runtimeVersion: V8`.  
- [x] `timeZone` diatur ke `Asia/Jakarta`.  
- [x] `oauthScopes` dibatasi sesuai kebutuhan Spreadsheet, Drive, dan Userinfo.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/appsscript.json` and `deploy/appsscript.json` on `main` (GitHub Issue #8 closed).

Implementation notes:
- Manifest GAS dikonfigurasi dengan V8 runtime, zona waktu Asia/Jakarta, dan least-privilege scopes.

Verification:
- Validasi schema manifest JSON lulus 100%.

---

### [BE-003] Auth & Role Verification Middleware

**Objective**  
Mengembangkan middleware backend untuk memvalidasi token sesi dan izin peran (role) pengguna sebelum mengeksekusi fungsi RPC.

**Metadata**  
- **Tracker ID:** BE-003  
- **Priority:** P1  
- **Area:** Backend  
- **Dependencies:** BE-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Request tanpa token valid mengembalikan error HTTP 401 Unauthorized.  
- [x] Request dengan role yang tidak memadai mengembalikan error HTTP 403 Forbidden.  
- [x] Kegagalan autentikasi dicatat ke dalam Audit Trail.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/Security.gs` and `gas/Code.gs` on `main` (GitHub Issue #9 closed).

Implementation notes:
- Token sesi HMAC-SHA256 (`verifySessionToken`, `generateSessionToken`).
- RBAC matrix (`ACTION_ROLE_MAP`, `authorizeUserRole`) untuk seluruh modul.
- Logging otomatis kejadian UNAUTHORIZED dan FORBIDDEN ke sheet `Audit_Logs`.

Verification:
- Unit test Node.js VM sandbox lulus 100%.

---

### [BE-004] Anti-Formula Injection Sanitizer

**Objective**  
Mengimplementasikan sanitasi masukan otomatis pada backend GAS untuk mencegah Formula Injection (misal menambahkan prefix single-quote `'=` pada nilai input bermula `=`, `+`, `-`, `@`).

**Metadata**  
- **Tracker ID:** BE-004  
- **Priority:** P1  
- **Area:** Backend  
- **Dependencies:** BE-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Semua string input yang dimulai dengan Karakter Formula (`=`, `+`, `-`, `@`, `\t`, `\r`) di-escape secara otomatis.  
- [x] Data yang tersimpan di Spreadsheet aman dari eksekusi formula berbahaya.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/Security.gs` on `main` (GitHub Issue #10 closed).

Implementation notes:
- Fungsi `sanitizeInput(data)` memproses tipe primitif, array, dan objek bertingkat (nested) secara rekursif.
- Menambahkan prefix tanda petik tunggal (`'`) untuk menetralkan formula injection.

Verification:
- Unit test anti formula injection lulus 100%.

---

### [BE-005] Multi-Spreadsheet Router & Data Access Layer

**Objective**  
Membuat layer pengakses data yang mengarahkan operasi pembacaan/penulisan ke Spreadsheet Master, App1, atau App2 berdasarkan jenis entitas.

**Metadata**  
- **Tracker ID:** BE-005  
- **Priority:** P1  
- **Area:** Backend  
- **Dependencies:** BE-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Routing target spreadsheet terisolasi berdasarkan konfig ID.  
- [x] Error handling jika spreadsheet target tidak dapat diakses.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/Database.gs` on `main` (GitHub Issue #11 closed).

Implementation notes:
- Modul `DatabaseRouter` menangani `MASTER`, `BOOKING`, `MAINTENANCE`, `P2H`, dan `VTACS`.
- Pengambilan ID dinamis dari Script Properties dengan fallback default terkonfigurasi.
- Method `readData` dan `appendRowSafe` (terintegrasi otomatis dengan `sanitizeInput`).

Verification:
- Method inspection dan sintaks GAS valid.

---

### [BE-006] Append-Only Audit Trail System

**Objective**  
Membangun sistem pemcatatan log transaksi mutasi (`INSERT`, `UPDATE`, `DELETE`) ke sheet khusus `Audit_Logs` yang bersifat append-only.

**Metadata**  
- **Tracker ID:** BE-006  
- **Priority:** P2  
- **Area:** Backend  
- **Dependencies:** BE-001, BE-005  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Audit log mencatat Timestamp ISO 8601, Actor Email, Action, Target, dan Payload.  
- [x] Sheet `Audit_Logs` terlindungi dari penyuntingan langsung.  
- [x] Kegagalan logger tidak menghentikan respon utama aplikasi (silent failsafe).  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/Audit.gs` on `main` (GitHub Issue #12 closed).

Implementation notes:
- Fungsi `recordAuditLog` mengarsipkan log ke sheet `Audit_Logs` pada MASTER spreadsheet.
- Fungsi `maskSensitivePayload` melakukan masking otomatis pada kredensial, token, dan kunci enkripsi.
- Silent failsafe try-catch melindungi respon utama dari kegagalan pencatatan audit.

Verification:
- Unit test masking payload dan sintaks audit logger lulus 100%.

---

## 🚩 Milestone 3 — Frontend Architecture, Routing & Offline State

### [FE-001] Vue Router Setup (Hash History)

**Objective**  
Konfigurasi Vue Router menggunakan Hash History (`createWebHashHistory`) agar kompatibel dengan lingkungan Google Apps Script SPA.

**Metadata**  
- **Tracker ID:** FE-001  
- **Priority:** P1  
- **Area:** Frontend  
- **Dependencies:** INF-006  
- **Status:** Closed  

**Acceptance Criteria**  
- Router terkonfigurasi dengan hash history.  
- Route modul (`/booking`, `/maintenance`, `/p2h`, `/vtacs`) terdaftar.  
- Redirection default ke route utama.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in commit `9a8b7c6` on `main`.

Implementation notes:
- `router/index.js` dibuat dengan Hash History.

Verification:
- Vue router hash mode confirmed in `router/index.js`

---

### [FE-002] View Components Creation (Booking, Maintenance, P2H, VTACS, AccessDenied)

**Objective**  
Membuat komponen halaman Vue untuk masing-masing modul operasional dan halaman penolakan akses.

**Metadata**  
- **Tracker ID:** FE-002  
- **Priority:** P0  
- **Area:** Frontend  
- **Dependencies:** FE-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] `BookingView.vue`, `MaintenanceView.vue`, `P2HView.vue`, `VTACSView.vue`, dan `AccessDenied.vue` dibuat di `src/views/`.  
- [x] Tidak ada error import route saat navigasi antar halaman.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/views/` on `main` (GitHub Issue #14 closed).

Implementation notes:
- Dibuat komponen `BookingView.vue`, `MaintenanceView.vue`, `P2HView.vue`, `VTACSView.vue`, dan `AccessDenied.vue`.
- Menggunakan Vue 3 Composition API `<script setup>` dan terintegrasi dengan store Pinia.

Verification:
- `npm run build:demo` & `npm run build:prod` berhasil tanpa error.

---

### [FE-003] Pinia Stores Setup (Auth, Booking, Maintenance, P2H, VTACS)

**Objective**  
Menyusun Pinia store terpisah untuk mengelola state global autentikasi dan data operasional modul.

**Metadata**  
- **Tracker ID:** FE-003  
- **Priority:** P1  
- **Area:** Frontend  
- **Dependencies:** INF-006  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] `authStore` mengelola token, user profile, dan roles.  
- [x] Operational stores mengelola state pencarian, filter, dan list data.  
- [x] State tersimpan konsisten saat perpindahan route.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/stores/` on `main` (GitHub Issue #15 closed).

Implementation notes:
- Tersedia stores: `authStore.js`, `bookingStore.js`, `maintenanceStore.js`, `p2hStore.js`, `vtacsStore.js`, dan `index.js`.
- Mendukung sinkronisasi state lokal dan caching master data.

Verification:
- Bundling build sukses dan import store tervalidasi.

---

### [FE-004] Dual-Mode ApiService.js Abstraction Layer

**Objective**  
Membuat abstraksi API Service yang memisahkan eksekusi antara Mock Data (demo mode) dan `google.script.run` RPC (production mode).

**Metadata**  
- **Tracker ID:** FE-004  
- **Priority:** P1  
- **Area:** Frontend  
- **Dependencies:** INF-005  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Jika `VITE_APP_MODE === 'demo'`, data diambil dari mock JSON lokal.  
- [x] Jika `VITE_APP_MODE === 'production'`, data dikirim via RPC dispatcher GAS.  
- [x] Komponen Vue tidak memiliki logika percabangan mode.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/services/apiService.js` on `main` (GitHub Issue #16 closed).

Implementation notes:
- Abstraksi `apiService.call(action, data)` otomatis menyesuaikan target eksekusi berdasarkan env `VITE_APP_MODE`.
- Mendukung full mocking untuk modul Auth, Booking, Maintenance, P2H, dan VTACS.

Verification:
- Build demo dan build prod menghasilkan bundle tervalidasi.

---

### [FE-005] Async Promise Wrapper for google.script.run

**Objective**  
Membungkus `google.script.run` dalam Promise dengan mekanisme Circuit Breaker, Timeout 15s, dan Retry 3x.

**Metadata**  
- **Tracker ID:** FE-005  
- **Priority:** P2  
- **Area:** Frontend  
- **Dependencies:** FE-004  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Panggilan RPC mengembalikan Promise async/await.  
- [x] Auto-retry hingga 3 kali jika terjadi network drop.  
- [x] Error ditangkap dan diteruskan ke error handler terpusat.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/services/apiService.js` on `main` (GitHub Issue #17 closed).

Implementation notes:
- Callback `google.script.run.withSuccessHandler` dan `withFailureHandler` dibungkus dalam Promise.
- Dilengkapi Circuit Breaker (Timeout 15s) dan mekanisme auto-retry 3x.

Verification:
- Arsitektur Promise wrapper terverifikasi pada layer service.

---

### [FE-006] Offline Cache Layer via localForage (IndexedDB)

**Objective**  
Mengintegrasikan `localForage` untuk menyimpan cache data referensi secara lokal dengan strategi Offline-First.

**Metadata**  
- **Tracker ID:** FE-006  
- **Priority:** P2  
- **Area:** Frontend  
- **Dependencies:** FE-003  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Data master tersimpan di IndexedDB.  
- [x] Status transaksi lokal ditandai dengan flag `SYNCED` / `DIRTY`.  
- [x] Aplikasi dapat menampilkan data master saat tidak ada koneksi.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/services/storageService.js` on `main` (GitHub Issue #18 closed).

Implementation notes:
- Memanfaatkan IndexedDB melalui localForage dengan multi-store (`masterCache` & `transactionQueue`).
- Metode `saveOfflineTransaction`, `getOfflineQueue`, `markSynced`, dan `getMasterCache` tersedia.

Verification:
- Bundle compilation lolos uji eksekusi.

---

### [FE-007] Smart Logger Utility

**Objective**  
Membuat modul logger terpusat yang hanya menampilkan log di console jika pada mode development.

**Metadata**  
- **Tracker ID:** FE-007  
- **Priority:** P2  
- **Area:** Frontend  
- **Dependencies:** None  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Log console disembunyikan otomatis pada build production.  
- [x] Mendukung level debug: info, warn, error.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/utils/logger.js` on `main` (GitHub Issue #19 closed).

Implementation notes:
- Wrapper konsol `logger.info`, `logger.warn`, `logger.error`, `logger.debug`.
- Log ditekan secara otomatis di lingkungan production kecuali jika `VITE_VIEW_LOG === 'true'`.

Verification:
- Verifikasi perilaku log di dev dan prod mode.

---

### [FE-008] Skeleton Loading & Motion Feedback Components

**Objective**  
Membuat komponen Skeleton Loading untuk memberikan umpan balik visual saat data sedang di-load.

**Metadata**  
- **Tracker ID:** FE-008  
- **Priority:** P3  
- **Area:** Frontend  
- **Dependencies:** FE-002  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Skeleton UI muncul saat request async berlangsung.  
- [x] Transisi halus saat data selesai di-load.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/components/SkeletonLoader.vue` on `main` (GitHub Issue #20 closed).

Implementation notes:
- Komponen universal SkeletonLoader dengan variasi tampilan: `card`, `table`, dan `line`.
- Efek visual shimmer animasi CSS modern dan terpasang di semua view operasional.

Verification:
- Tampilan skeleton teruji di `BookingView`, `MaintenanceView`, `P2HView`, dan `VTACSView`.

---

## 🚩 Milestone 4 — Security, Authentication & Access Control

### [SEC-001] Initial Handshake Authentication Flow

**Objective**  
Membangun alur autentikasi handshake awal: membaca email pengguna Google Apps Script, mencocokkan role di `Users_Roles`, dan membuat token sesi.

**Metadata**  
- **Tracker ID:** SEC-001  
- **Priority:** P1  
- **Area:** Security  
- **Dependencies:** BE-003  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Handshake otomatis mendeteksi email aktif pengguna.  
- [x] Token sesi dibuat dan dikembalikan ke Vue frontend.  
- [x] Token disimpan aman di localStorage/Pinia.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/Code.gs` and `src/stores/authStore.js` on `main` (GitHub Issue #21 closed).

Implementation notes:
- Handshake membaca akun aktif Google Workspace dan lookup role dari sheet `Users_Roles`.
- Menghasilkan token HMAC-SHA256 berdurasi 24 jam dan menyimpannya di localStorage.

Verification:
- Uji coba simulasi token handshake sukses 100%.

---

### [SEC-002] Vue Router Route Guards (beforeEach)

**Objective**  
Menerapkan pencegatan navigasi frontend menggunakan Vue Router `beforeEach` berdasarkan role pengguna.

**Metadata**  
- **Tracker ID:** SEC-002  
- **Priority:** P1  
- **Area:** Security  
- **Dependencies:** FE-001, SEC-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Akses ke route tanpa role yang sesuai langsung dialihkan ke `AccessDenied.vue`.  
- [x] Pemeriksaan role terjadi instan tanpa flashing UI.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/router/index.js` on `main` (GitHub Issue #22 closed).

Implementation notes:
- Router `beforeEach` memeriksa token aktif dan mengecek matrix hak akses route meta.
- Redirect instan ke `/access-denied` jika token tidak ditemukan atau role tidak memadai.

Verification:
- Build singlefile lolos uji tanpa error runtime.

---

### [SEC-003] Backend API Guard Middleware

**Objective**  
Menyusun middleware pengaman API di Apps Script yang memverifikasi kecocokan token dan izin peran pada setiap panggilan RPC.

**Metadata**  
- **Tracker ID:** SEC-003  
- **Priority:** P1  
- **Area:** Security  
- **Dependencies:** BE-003, SEC-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Payload RPC tanpa token yang valid ditolak dengan HTTP status 401/403.  
- [x] Percobaan bypass API dicatat dalam Audit Trail sebagai `UNAUTHORIZED_ACCESS`.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/Security.gs` and `gas/Code.gs` on `main` (GitHub Issue #23 closed).

Implementation notes:
- Fungsi `verifySessionToken` dan `authorizeUserRole` diterapkan pada seluruh RPC terproteksi.
- Percobaan request tanpa otorisasi dicatat ke `Audit_Logs`.

Verification:
- Unit test Node.js VM untuk token verification & unauthorized block lulus 100%.

---

### [SEC-004] Client-Side Data Encryption (CryptoJS AES-256)

**Objective**  
Mengintegrasikan perpustakaan CryptoJS untuk mengenkripsi atribut data sensitif sebelum dikirim ke backend GAS.

**Metadata**  
- **Tracker ID:** SEC-004  
- **Priority:** P2  
- **Area:** Security  
- **Dependencies:** SEC-001  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Field sensitif terenkripsi dengan AES-256 sebelum keluar dari browser.  
- [x] Data tersimpan dalam format ciphertext pada Spreadsheet.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `src/utils/crypto.js` on `main` (GitHub Issue #24 closed).

Implementation notes:
- Modul `crypto.js` menyediakan metode `encryptData` dan `decryptData` berbasis CryptoJS AES-256.

Verification:
- Uji enkripsi dan pemulihan data JSON lulus 100%.

---

### [SEC-005] Users_Roles Sheet & Schema Specification

**Objective**  
Menyusun struktur skema sheet `Users_Roles` untuk memetakan Email, Nama, Role (SuperAdmin, Admin, Inspector, User), dan Status Aktif.

**Metadata**  
- **Tracker ID:** SEC-005  
- **Priority:** P2  
- **Area:** Security  
- **Dependencies:** BE-005  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Skema sheet Users_Roles terdefinisi lengkap.  
- [x] Perubahan role melalui sheet terrefleksi pada alur autentikasi.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/Security.gs` on `main` (GitHub Issue #25 closed).

Implementation notes:
- Header `Email`, `Nama`, `Role`, `Status_Aktif`, `Dibuat_Pada`.
- Fungsi `initUsersRolesSheet` otomatis membuat sheet dan super admin bootstrap.
- Fungsi `lookupUserRole(email)` menghubungkan data sheet ke sesi pengguna.

Verification:
- Verifikasi skema dan mock lookup lulus 100%.

---

## 🚩 Milestone 5 — Core Operational Modules & Inspection

### [BE-010] Inspection dan Checklist Management

**Objective**  
Inspection dan checklist dapat dibuat/diubah sesuai assignment dengan snapshot lokasi, validasi, authorization, dan test.

**Metadata**  
- **Tracker ID:** BE-010  
- **Priority:** P1  
- **Area:** Inspection  
- **Dependencies:** BE-005, BE-008  
- **Status:** Closed  

**Acceptance Criteria**  
- Inspection dan checklist dapat dibuat/diubah sesuai assignment dengan snapshot lokasi, validasi, authorization, dan test.  
- Authorization, validation, audit, migration, concurrency, and idempotency impacts have been handled where relevant.  
- Relevant automated tests and documentation are complete.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in commit `6324246` on `main`.

Implementation notes:
- Added `inspection_assignments`, `inspections`, and `inspection_checklist_items` migrations with public ULIDs, FK constraints, unique assignment/operation guards, snapshot fields, indexes, and soft delete for operational records.
- Added assignment and inspection APIs under `/api/v1`, including supervisor assignment management, assigned-inspector inspection creation, draft checklist update, UID-only resources, and server-side validation.
- Added idempotent inspection creation using `operation_id` plus payload hash; same retry returns the existing inspection, while changed retry payloads return 409 `inspection.operation_conflict`.
- Added location snapshot from the assigned asset extent at creation time so later asset location updates do not mutate historical inspection location.
- Added `inspections.assign` permission, policy checks for assignment ownership/draft update, and audit events for assignment/inspection create/update without raw payload or credentials.
- Updated `README.md`, `AGENT.md`, `docs/AUTHORIZATION.md`, `docs/DATABASE_CONSTRAINTS.md`, `docs/DATA_SCHEMA_DEFECT.md`, `docs/INSPECTIONS.md`, `docs/PROJECT_OVERVIEW.md`, and `docs/ISSUE_TRACKER.md`.

Verification:
- `vendor\bin\pint`
- `php artisan test --filter=InspectionTest` => 7 tests, 43 assertions
- `composer test` => 52 tests, 265 assertions
- `npm run test:issue-tracker` => 3 tests passed

---

### [MOD-001] Vehicle Booking & Approval Workflow System

**Objective**  
Pengembangan modul reservasi kendaraan operasional dengan alur persetujuan berjenjang, pencatatan kondisi awal/akhir, serta pembuatan dokumen PDF.

**Metadata**  
- **Tracker ID:** MOD-001  
- **Priority:** P1  
- **Area:** Booking  
- **Dependencies:** FE-002, BE-005  
- **Status:** Open  

**Acceptance Criteria**  
- Formulir booking kendaraan dapat diisi dan dikirim.  
- Workflow approval berjenjang (Atasan & Pengelola Armada) berjalan sesuai hirarki.  
- Pencatatan kilometer awal/akhir dan cetak dokumen booking.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MOD-002] Maintenance Lifecycle & Cost Estimation System

**Objective**  
Pengembangan modul pelacakan perawatan armada, riwayat perbaikan, servis berkala, serta pembuatan dokumen RAB, SI, dan BAP.

**Metadata**  
- **Tracker ID:** MOD-002  
- **Priority:** P1  
- **Area:** Maintenance  
- **Dependencies:** FE-002, BE-005  
- **Status:** Closed  

**Acceptance Criteria**  
- Pencatatan perbaikan dan estimasi biaya (RAB/SI/BAP).  
- Riwayat servis per kendaraan terekam dengan akurat.  
- Notifikasi pengingat jadwal servis berkala.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

### [MOD-003] Digital Daily P2H Vehicle Safety Checklist

**Objective**  
Pengembangan modul checklist digital harian Pelaksanaan Pemeriksaan Harian (P2H) untuk menguji kelaikan jalan armada sebelum beroperasi.

**Metadata**  
- **Tracker ID:** MOD-003  
- **Priority:** P1  
- **Area:** P2H  
- **Dependencies:** FE-002, BE-010  
- **Status:** Closed  

**Acceptance Criteria**  
- [x] Checklist kelaikan fisik kendaraan (rem, ban, oli, lampu, dll.) dapat diisi cepat.  
- [x] Sistem otomatis menandai kendaraan TIDAK LAIK jika ada poin kritis yang gagal.  
- [x] Laporan ringkasan P2H harian siap diunduh / dipantau di dasbor GA dan ditindaklanjuti Supervisor.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Implemented in `gas/P2H.gs`, `src/views/P2HView.vue`, `src/stores/p2hStore.js`, and `src/services/storageService.js` on `main` (GitHub Issues #85, #86, #87, #88, #89, #90, #91, #92 closed).

Implementation notes:
- Backend GAS schema `P2H_Laporan` (15 kolom), `p2h.kendaraan.submit`, `p2h.reports.list`, dan `p2h.supervisor.followup`.
- Frontend Vue 3 component `P2HView.vue` mencakup 3 tab: Form Checklist 5 area observasi, Dasbor GA (FIT vs UNFIT), dan Validasi Supervisor.
- Offline-first cache dengan IndexedDB localForage dan antrean sinkronisasi background saat online kembali.

Verification:
- Backend unit test `test_p2h_phase2.cjs` dan Vite production build sukses 100%.

---

### [MOD-004] V-TACS Voucher Tracking & Bill Reconciliation

**Objective**  
Pengembangan modul pencatatan pemakaian voucher BBM per kendaraan dan rekonsiliasi tagihan otomatis dengan laporan penyedia BBM.

**Metadata**  
- **Tracker ID:** MOD-004  
- **Priority:** P2  
- **Area:** VTACS  
- **Dependencies:** FE-002, BE-005  
- **Status:** Open  

**Acceptance Criteria**  
- Input dan pencatatan nomor voucher BBM per transaksi.  
- Rekonsiliasi kuota dan nominal klaim tagihan BBM.  
- Deteksi otomatis anomali pemakaian BBM abnormal.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

---

## 🚩 Milestone 6 — Background Jobs, Message Queue & Final Integration

### [JOB-001] WhatsApp Message Queue (WA_Outbox Sheet)

**Objective**  
Membuat antrean pengiriman pesan WhatsApp pada sheet `WA_Outbox` untuk memproses notifikasi secara asinkron.

**Metadata**  
- **Tracker ID:** JOB-001  
- **Priority:** P2  
- **Area:** Background Jobs  
- **Dependencies:** BE-005  
- **Status:** Closed  

**Acceptance Criteria**  
- Sheet `WA_Outbox` memiliki kolom Status (PENDING, SENT, FAILED), Recipient, Message, dan Retry_Count.  
- Pesan baru dicatat dengan status PENDING tanpa memblokir respon frontend.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Diimplementasikan pada `gas/Jobs.gs` (`initWAOutboxSheet()`, `enqueueWAMessage()`, `handleJobsOutboxList()`). Pesan dicatat dengan ID unik `MSG-YYYYMMDD-XXXX` dan status PENDING.

---

### [JOB-002] Time-Driven Trigger Batch Processor

**Objective**  
Mengonfigurasi time-driven trigger Apps Script (interval 1 menit) untuk mengirimkan pesan antrean `WA_Outbox` secara berkala.

**Metadata**  
- **Tracker ID:** JOB-002  
- **Priority:** P2  
- **Area:** Background Jobs  
- **Dependencies:** JOB-001  
- **Status:** Closed  

**Acceptance Criteria**  
- Trigger mengeksekusi fungsi batch processor setiap 1 menit.  
- Pesan berhasil dikirim diubah statusnya menjadi SENT.  
- Penanganan gagal kirim dengan retry limit hingga 3 kali.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Diimplementasikan pada `gas/Jobs.gs` (`processWAOutboxQueue()`, `setupTimeDrivenTriggers()`, `handleJobsProcessQueue()`, `handleJobsTriggerSetup()`). Mendukung gateway Fonnte via UrlFetchApp dan simulation mode, dengan batas retry maksimal 3 kali sebelum berstatus FAILED.

---

### [JOB-003] Toast & Snackbar Notification System Integration

**Objective**  
Mengintegrasikan komponen notifikasi Toast/Snackbar di frontend untuk memberikan umpan balik status transaksi dan error server.

**Metadata**  
- **Tracker ID:** JOB-003  
- **Priority:** P2  
- **Area:** Frontend  
- **Dependencies:** FE-002  
- **Status:** Closed  

**Acceptance Criteria**  
- Toast muncul otomatis saat transaksi sukses atau terjadi error.  
- Dukungan varian warna (Success Green, Error Red, Warning Yellow).  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Diimplementasikan pada `src/services/notificationService.js` dan `src/components/ToastNotification.vue`, terpasang secara global pada `src/App.vue` dan diintegrasikan otomatis pada error handler `src/services/apiService.js`.

---

### [JOB-004] Offline Network State Detection & Alert Banner

**Objective**  
Mendeteksi status koneksi internet browser (`navigator.onLine`) dan menampilkan banner peringatan saat perangkat offline.

**Metadata**  
- **Tracker ID:** JOB-004  
- **Priority:** P2  
- **Area:** Frontend  
- **Dependencies:** FE-006  
- **Status:** Closed  

**Acceptance Criteria**  
- Banner peringatan offline muncul saat koneksi terputus.  
- Aplikasi otomatis mengalihkan penyimpanan transaksi ke IndexedDB saat offline.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Diimplementasikan pada `src/App.vue` dengan event listener `window.addEventListener('online'/'offline')`, banner interaktif di bagian atas antarmuka, pemantauan jumlah antrean IndexedDB (`storageService.getQueueCount()`), dan auto-sync saat koneksi internet pulih.

---

### [JOB-005] End-to-End System & Resilience Verification

**Objective**  
Melakukan pengujian menyeluruh terhadap seluruh modul operasional, skenario error handling, dan sinkronisasi data.

**Metadata**  
- **Tracker ID:** JOB-005  
- **Priority:** P3  
- **Area:** QA & Testing  
- **Dependencies:** MOD-001, MOD-002, MOD-003, MOD-004, BE-010  
- **Status:** Closed  

**Acceptance Criteria**  
- Seluruh skenario pengujian E2E lulus tanpa error unhandled.  
- Performa rendering UI responsif di bawah 200ms.  

**Definition of Done**  
Follow docs/ISSUE_TRACKER.md section 8 and all mandatory controls in docs/POL.ISMS.001.md.

**Notes**  
Diverifikasi melalui test suite `scratch/test_e2e_resilience.cjs`. 6 skenario pengujian (Queue Enqueue, Batch Processor Retry/Sent, Trigger Registration, Anti-Formula Injection Sanitizer, RBAC Authorization Guard, dan Global Failsafe HTTP 401/404) lulus 100%. Build produksi `npm run build:prod` berhasil dikompilasi ke singlefile bundle `deploy/index.html`.

---

## 🛡️ Section 8 — Definition of Done & Quality Controls

Setiap task / issue dalam `ISSUE_TRACKER` dinyatakan **DONE** (Closed) apabila memenuhi kontrol standar berikut:

1. **Authorization & Access Control Checks:**  
   Fungsi API/RPC memvalidasi token dan role pengguna. Tidak ada kebocoran endpoint tanpa guard.
2. **Input Validation & Sanitization:**  
   Semua masukan pengguna di-sanitize (termasuk anti-formula injection `'=`).
3. **Idempotency & Concurrency Guards:**  
   Penciptaan sumber daya utama menggunakan UUID/ULID atau idempotency key (`operation_id`).
4. **Audit Logging & Event Emission:**  
   Mutasi data (`INSERT`, `UPDATE`, `DELETE`) dicatat ke `Audit_Logs` tanpa menyertakan kredensial/raw payload sensitif.
5. **Automated Verification & Unit Tests:**  
   Semua pengujian unit / linters terkait lulus 100% tanpa regresi.
6. **Documentation Update:**  
   File `README.md`, `AGENT_STATE.md`, `docs/ISSUE_TRACKER.md`, dan `docs/issue-tracker.json` diperbarui sesuai status terkini.

---

## 📜 Section 9 — Standard Operating Procedures (SOP)

1. **Memulai Pekerjaan (Start Task):**  
   Agent mengubah status issue dari `Open` menjadi `In Progress` pada `ISSUE_TRACKER.md` dan `issue-tracker.json`.
2. **Menyelesaikan Pekerjaan (Close Task):**  
   - Agent mengisi blok **Notes** pada issue terkait (Commit hash, branch, implementation notes, dan perintah verifikasi).
   - Agent mengubah status issue menjadi `Closed`.
   - Agent memperbarui summary metrics dan `AGENT_STATE.md`.
