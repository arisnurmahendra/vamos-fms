# 📊 AGENT STATE — VAMOS FMS

> **Terakhir diperbarui:** 2026-09-08 00:25 WIB
>
> File ini merekam **status terkini** proyek. Agent WAJIB membaca file ini sebelum mulai bekerja dan WAJIB memperbaruinya setelah menyelesaikan task.
> Aturan ketika menjalankan promt dari user:

- Gunakan mode hemat token. Baca AGENT.md dan AGENT_STATE.md dulu.
- Baca hanya dokumen kontrak yang relevan, jangan full scan semua docs kecuali ada konflik kontrak.
- Saya ingin menambahkan fitur expiry app berbasis Script Properties.
- Kerjakan issue jika diperintahkan namun jangan push ke github (boleh coomit local dulu).
- Jangan paste log panjang ke issue comment.
- Cek acceptance criteria, isi verification ringkas, update tracker lokal setelah GitHub issue confirmed closed.
- Implementasikan, verifikasi, update tracker, lalu close GitHub issue.
- Jangan pernah melakukan push di GAS atau GitHub tanpa perintah eksplisit (PUSH GITHUB/GAS), dan selalu push keduanya.
- Saat membuat atau mengubah fitur, selalu prioritaskan **safety**: sebelum memodifikasi file aktif, lakukan backup dengan timestamp (nama file, timestamp, deskripsi perubahan singkat).
- Saat membuat fitur, selalu implementasikan dalam format single-file-component (.vue) dengan `<script setup>` (Composition API).

---

## 🚦 Status Fase Implementasi

| Fase | Nama                                    | Status         | Progress |
| ---- | --------------------------------------- | -------------- | -------- |
| 1    | Infrastruktur Repositori & Build System | ✅ Selesai     | 100%     |
| 2    | Arsitektur Backend & Middleware         | ✅ Selesai     | 100%     |
| 3    | Arsitektur Frontend & State             | ✅ Selesai     | 100%     |
| 4    | Strategi Autentikasi                    | ✅ Selesai     | 100%     |
| 5    | Modul P2H (Issues #85 - #92)            | ✅ Selesai     | 100%     |
| 6    | Modul V-TACS (Issues #93 - #100)        | ✅ Selesai     | 100%     |
| 7    | Background Jobs & Integrasi Final       | ⬜ Belum mulai | 0%       |

---

## 📦 Inventaris File Aktif

### Frontend (`/src`)

| File / Folder     | Status       | Keterangan                                       |
| ----------------- | ------------ | ------------------------------------------------ |
| `index.html`      | ✅ Ada       | HTML template utama (lang="id")                  |
| `main.js`         | ✅ Ada       | Entry point Vue dengan Pinia & Vue Router        |
| `App.vue`         | ✅ Ada       | Root layout: Header, status badge & RouterView   |
| `style.css`       | ✅ Ada       | Global styles & variables                        |
| `router/index.js` | ✅ Ada       | Route navigation guard (beforeEach) + 4 modul + AccessDenied |
| `views/`          | ✅ Ada       | BookingView, MaintenanceView, P2HView (Full), VTACSView (Full), AccessDenied |
| `components/`     | ✅ Ada       | SkeletonLoader.vue (card, table, line)           |
| `stores/`         | ✅ Ada       | Pinia stores (auth, booking, maintenance, p2h, vtacs) |
| `services/`       | ✅ Ada       | apiService.js (dual-mode RPC), storageService.js |
| `utils/`          | ✅ Ada       | logger.js (smart logger), crypto.js (AES-256)    |

### Backend (`/gas`)

| File              | Status       | Keterangan                                            |
| ----------------- | ------------ | ----------------------------------------------------- |
| `Code.gs`         | ✅ Ada       | doGet + apiDispatcher + full middleware pipeline      |
| `Security.gs`     | ✅ Ada       | verifySessionToken + RBAC + sanitizeInput             |
| `Database.gs`     | ✅ Ada       | DatabaseRouter multi-spreadsheet DAL                  |
| `Audit.gs`        | ✅ Ada       | recordAuditLog append-only with silent failsafe       |
| `P2H.gs`          | ✅ Ada       | Schema P2H_Laporan (15 kolom), submit, reports.list & supervisor.followup |
| `VTACS.gs`        | ✅ Ada       | Schema VTACS Sheets, anti-conflict lock, voucher request/redeem & reconcile |
| `.claspignore`    | ✅ Ada       | Hanya allow *.gs, *.html, appsscript.json             |
| `appsscript.json` | ✅ Ada       | Manifest GAS (V8 runtime, Asia/Jakarta)               |

### Config (Root)

| File                 | Status       | Keterangan                                 |
| -------------------- | ------------ | ------------------------------------------ |
| `vite.config.js`     | ✅ Ada       | root: ./src, singlefile, outDir: ../deploy |
| `package.json`       | ✅ Ada       | Scripts + dependencies lengkap             |
| `.clasp.json`        | ✅ Ada       | rootDir: ./gas (scriptId placeholder)      |
| `.gitignore`         | ✅ Ada       | Lengkap untuk Vue+Vite+GAS                 |
| `.env.example`       | ✅ Ada       | Template environment variables (demo/production) |

### Dokumentasi

| File                                      | Status | Keterangan                                              |
| ----------------------------------------- | ------ | ------------------------------------------------------- |
| `README.md`                               | ✅ Ada | Dokumentasi utama proyek VAMOS                          |
| `AGENT.md`                                | ✅ Ada | Kontrak & aturan AI Agent                               |
| `AGENT_STATE.md`                          | ✅ Ada | State terkini proyek                                    |
| `docs/README.md`                          | ✅ Ada | Indeks pusat dokumentasi teknis                         |
| `docs/ISSUE_TRACKER.md` & `.json`         | ✅ Ada | Master tracker (Milestone INF, BE, FE, SEC, MOD, OPS)   |
| `docs/BOOKING_REFACTOR.md`                | ✅ Ada | Roadmap refaktor Booking (Fase 1-6)                     |
| `docs/MAINTENANCE_REFACTOR.md` & `.json`  | ✅ Ada | Roadmap refaktor SmartServ Maintenance (Fase 1-6)       |
| `docs/P2H_DEVELOPMENT.md` & `.json`       | ✅ Ada | Roadmap pengembangan P2H Daily Checklist (Fase 1-5)     |
| `docs/VTACS_DEVELOPMENT.md` & `.json`     | ✅ Ada | Roadmap pengembangan V-TACS BBM Voucher (Fase 1-5)      |
| `docs/POL.ISMS.001.md`                    | ✅ Ada | Kebijakan Keamanan Informasi & Standard DoD             |

---

## 🔧 Dependencies Terpasang

### Production

| Package       | Versi   | Kegunaan                                |
| ------------- | ------- | --------------------------------------- |
| `vue`         | ^3.5.42 | Framework UI                            |
| `vue-router`  | ^5.3.1  | Client-side routing                     |
| `pinia`       | ^4.0.3  | State management                        |
| `crypto-js`   | ^4.2.0  | Enkripsi AES-256 data sensitif          |
| `localforage` | ^1.10.0 | IndexedDB wrapper (offline cache)       |
| `lodash-es`   | ^4.18.1 | debounce, throttle, utilities           |
| `cross-env`   | ^10.1.0 | Cross-platform env variables            |

### Dev Dependencies

| Package                  | Versi  | Kegunaan                |
| ------------------------ | ------ | ----------------------- |
| `vite`                   | ^8.2.2 | Build tool              |
| `@vitejs/plugin-vue`     | ^6.0.8 | Vue 3 plugin untuk Vite |
| `vite-plugin-singlefile` | ^2.3.3 | Bundle semua ke 1 HTML  |

---

## 🧠 Catatan Kontekstual

- **Dependencies lengkap terpasang:** `vue`, `vue-router`, `pinia`, `crypto-js`, `localforage`, `lodash-es`, dan `cross-env` sudah tercatat di `package.json`.
- **Router sudah dikonfigurasi** tapi view components (`BookingView.vue`, dll.) **belum dibuat** — app perlu dibuatkan skeleton views atau components saat masuk fase implementasi UI.
- **`scriptId`** di `.clasp.json` masih placeholder — perlu diisi oleh user saat siap deploy ke Google Apps Script aktif.
- Build output ke `deploy/` — folder ini diabaikan oleh `.gitignore`.

