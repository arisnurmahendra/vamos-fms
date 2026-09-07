# 📊 AGENT STATE — VAMOS FMS

> **Terakhir diperbarui:** 2026-09-07 10:28 WIB
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
| 2    | Arsitektur Backend & Middleware         | 🔄 Sebagian    | 30%      |
| 3    | Arsitektur Frontend & State             | 🔄 Sebagian    | 20%      |
| 4    | Strategi Autentikasi                    | ⬜ Belum mulai | 0%       |
| 5    | Background Jobs & Integrasi Final       | ⬜ Belum mulai | 0%       |

---

## 📦 Inventaris File Aktif

### Frontend (`/src`)

| File / Folder     | Status       | Keterangan                                       |
| ----------------- | ------------ | ------------------------------------------------ |
| `index.html`      | ✅ Ada       | HTML template utama (lang="id")                  |
| `main.js`         | ✅ Ada       | Entry point Vue                                  |
| `App.vue`         | ✅ Ada       | Root component — menampilkan mode status         |
| `style.css`       | ✅ Ada       | Global styles (default Vite)                     |
| `router/index.js` | ✅ Ada       | 4 route modul + AccessDenied + redirect          |
| `views/`          | ⚠️ Belum ada | View components belum dibuat (BookingView, dll.) |
| `components/`     | ⚠️ Belum ada | Belum ada komponen reusable                      |
| `stores/`         | ⚠️ Belum ada | Pinia stores belum dibuat                        |

### Backend (`/gas`)

| File              | Status       | Keterangan                                            |
| ----------------- | ------------ | ----------------------------------------------------- |
| `Code.gs`         | ✅ Ada       | doGet + apiDispatcher + responseSuccess/responseError |
| `.claspignore`    | ✅ Ada       | Hanya allow _.gs, _.html, appsscript.json             |
| `appsscript.json` | ⚠️ Belum ada | Manifest GAS belum dibuat                             |

### Config (Root)

| File                 | Status       | Keterangan                                 |
| -------------------- | ------------ | ------------------------------------------ |
| `vite.config.js`     | ✅ Ada       | root: ./src, singlefile, outDir: ../deploy |
| `package.json`       | ✅ Ada       | Scripts + dependencies lengkap             |
| `.clasp.json`        | ✅ Ada       | rootDir: ./gas (scriptId placeholder)      |
| `.gitignore`         | ✅ Ada       | Lengkap untuk Vue+Vite+GAS                 |
| `.env` / `.env.demo` | ⚠️ Belum ada | Environment variables belum dibuat         |

### Dokumentasi (Root)

| File                            | Status |
| ------------------------------- | ------ |
| `README.md`                     | ✅ Ada |
| `AGENT.md`                      | ✅ Ada |
| `AGENT_STATE.md`                | ✅ Ada |
| `ISSUE_TRACKER.md`              | ✅ Ada |

---

## 🔧 Dependencies Terpasang

### Production

| Package       | Versi   | Kegunaan                          |
| ------------- | ------- | --------------------------------- |
| `vue`         | ^3.5.42 | Framework UI                      |
| `crypto-js`   | ^4.2.0  | Enkripsi AES-256 data sensitif    |
| `localforage` | ^1.10.0 | IndexedDB wrapper (offline cache) |
| `lodash-es`   | ^4.18.1 | debounce, throttle, utilities     |

### Dev Dependencies

| Package                  | Versi  | Kegunaan                |
| ------------------------ | ------ | ----------------------- |
| `vite`                   | ^8.2.2 | Build tool              |
| `@vitejs/plugin-vue`     | ^6.0.8 | Vue 3 plugin untuk Vite |
| `vite-plugin-singlefile` | ^2.3.3 | Bundle semua ke 1 HTML  |

### Belum Terpasang (Dibutuhkan)

| Package      | Kegunaan                     | Kapan Diperlukan     |
| ------------ | ---------------------------- | -------------------- |
| `vue-router` | Client-side routing          | Fase 3               |
| `pinia`      | State management             | Fase 3               |
| `cross-env`  | Cross-platform env variables | Saat build:demo/prod |

---

## 🧠 Catatan Kontekstual

- **Router sudah dikonfigurasi** tapi view components (`BookingView.vue`, dll.) **belum dibuat** — app akan crash jika dijalankan sekarang.
- **`cross-env`** digunakan di npm scripts (`build:demo`, `build:prod`) tapi **belum di-install**.
- **`vue-router` dan `pinia`** digunakan di kode tapi **belum ada di `package.json`**.
- **`scriptId`** di `.clasp.json` masih placeholder — perlu diisi oleh user.
- Build output ke `deploy/` — folder ini kosong, belum pernah build.
