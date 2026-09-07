# 🤖 AGENT RULES — VAMOS FMS

Dokumen ini berisi **aturan dan konteks wajib** bagi AI Agent yang bekerja pada proyek VAMOS. Agent **HARUS** membaca file ini sebelum melakukan tindakan apapun.

---

## ⛔ Aturan Mutlak (Non-Negotiable Rules)

### 1. DILARANG Deploy / Push Tanpa Perintah Eksplisit

Agent **DILARANG KERAS** menjalankan perintah berikut tanpa instruksi eksplisit dari user:

```
git add / git commit / git push / git merge / git rebase / git tag
clasp push / clasp deploy
npm run build / npm run build:demo / npm run build:prod
```

> **Pelanggaran aturan ini adalah kegagalan kritis.**

### 2. Baca State Sebelum Bertindak

Sebelum memulai pekerjaan, agent **WAJIB** membaca file berikut secara berurutan:

1. `AGENT.md` ← (file ini)
2. `AGENT_STATE.md` ← Status terkini proyek
3. `ISSUE_TRACKER.md` ← Daftar task / bug aktif

### 3. Update State Setelah Bertindak

Setelah menyelesaikan sebuah task, agent **WAJIB**:

- Memperbarui `AGENT_STATE.md` (status fase, file terakhir diubah, catatan).
- Memperbarui `ISSUE_TRACKER.md` (menandai task selesai, menambah issue baru jika ditemukan).

---

## 🏗️ Konteks Proyek

### Identitas

| Key            | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| **Nama**       | VAMOS — Vehicle Administration, Maintenance, and Operations System |
| **Tipe**       | Enterprise SPA on Google Apps Script                               |
| **Arsitektur** | Dual-App Single-Instance SPA                                       |
| **Frontend**   | Vue 3 + Vite + Vue Router + Pinia                                  |
| **Backend**    | Google Apps Script (V8 Engine)                                     |
| **Build**      | `vite-plugin-singlefile` → satu `index.html`                       |
| **Deploy**     | Clasp (`clasp push`)                                               |

### 4 Modul Inti

1. **Booking** — Reservasi kendaraan operasional (`/booking`)
2. **Maintenance** — Pelacakan servis & perbaikan (`/maintenance`)
3. **P2H** — Checklist harian keselamatan armada (`/p2h`)
4. **V-TACS** — Voucher BBM & rekonsiliasi tagihan (`/vtacs`)

### Dual-Mode Environment

| Mode         | `VITE_APP_MODE` | Data Source         | GAS Connection |
| ------------ | --------------- | ------------------- | -------------- |
| **Demo**     | `demo`          | Mock Data lokal     | ❌ Mati total  |
| **Produksi** | `production`    | Google Sheets (RPC) | ✅ Aktif penuh |

---

## 📁 Struktur Direktori

```
vamos-fms/
├── src/                    # Frontend Vue 3
│   ├── assets/             # Aset statis (gambar, ikon)
│   ├── components/         # Komponen Vue reusable
│   ├── router/             # Vue Router config
│   │   └── index.js        # Route definitions (Hash mode)
│   ├── stores/             # Pinia state management
│   ├── views/              # Halaman per modul (BookingView, dll.)
│   ├── App.vue             # Root component
│   ├── main.js             # Entry point Vue
│   ├── index.html          # HTML template
│   └── style.css           # Global styles
├── gas/                    # Backend Google Apps Script (Development)
│   └── Code.gs             # RPC Dispatcher (apiDispatcher)
├── deploy/                 # Direktori deployment (Root clasp)
│   ├── index.html          # Output build singlefile Vite
│   ├── Code.gs             # Hasil copy dari folder /gas
│   └── .claspignore        # Clasp ignore rules
├── docs/                   # Dokumentasi proyek
├── .clasp.json             # Clasp config (scriptId + rootDir)
├── .gitignore              # Git ignore rules
├── vite.config.js          # Vite config (singlefile + root ./src)
├── package.json            # Dependencies & scripts
├── AGENT.md                # ← File ini (termasuk Arsitektur lengkap)
├── AGENT_STATE.md          # Status terkini proyek
├── ISSUE_TRACKER.md        # Pelacak task & bug
└── README.md               # Deskripsi proyek
```

---

## 🔧 Konvensi Kode

### Frontend (Vue 3)

- Gunakan `<script setup>` Composition API (bukan Options API).
- Penamaan file komponen: **PascalCase** (`BookingView.vue`, `SidebarNav.vue`).
- Penamaan file utilitas/services: **camelCase** (`apiService.js`, `authGuard.js`).
- State management: **Pinia** (bukan Vuex).
- Routing: **Hash mode** (`createWebHashHistory`) — wajib untuk GAS.

### Backend (GAS)

- Satu entry point: `doGet(e)` hanya menyajikan HTML.
- Satu dispatcher: `apiDispatcher(payload)` untuk semua RPC.
- Response format: **JSend Pattern** (`{ status, code, message, data }`).
- Error handling: Try-catch di level dispatcher, BUKAN di level fungsi individual.

### Penamaan Umum

- Variabel & fungsi: `camelCase`
- Konstanta: `UPPER_SNAKE_CASE`
- CSS class: `kebab-case`
- Commit message: Bahasa Indonesia atau Inggris, konsisten per sesi.

---

## 📋 NPM Scripts

| Command              | Fungsi                                          |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Jalankan dev server Vite (port 3000)            |
| `npm run build`      | Build default                                   |
| `npm run build:demo` | Build mode demo (mock data, tanpa GAS)          |
| `npm run build:prod` | Build mode production (koneksi GAS penuh)       |
| `npm run push`       | ⛔ Push ke GAS via clasp (PERLU IZIN EKSPLISIT) |
| `npm run preview`    | Preview hasil build                             |

# MASTER IMPLEMENTATION PLAN

**Enterprise Single Page Application (SPA) on Google Apps Script (GAS)**

---

> ⛔ **ATURAN DEPLOYMENT — WAJIB DIBACA**
>
> **DILARANG** melakukan `git add`, `git commit`, `git push`, `clasp push`, atau operasi deployment apapun **TANPA perintah eksplisit** dari user.
>
> Aturan ini berlaku untuk:
>
> - **Git** — Semua operasi yang mengubah riwayat repositori (`add`, `commit`, `push`, `merge`, `rebase`, `tag`).
> - **Clasp / GAS** — Semua operasi yang mendorong kode ke Google Apps Script (`clasp push`, `clasp deploy`).
> - **Build & Deploy** — Menjalankan `npm run build`, `npm run build:demo`, `npm run build:prod` yang menghasilkan artefak produksi.
>
> **Alasan:** Mencegah perubahan yang belum divalidasi terdorong ke remote repository atau production environment secara tidak sengaja.

---

## 1. Arsitektur Inti (Core Architecture)

Sistem menggunakan arsitektur **Dual-App Single-Instance SPA**. Sistem ini menggabungkan dan merefaktor 4 subsistem operasional (VAMOS) ke dalam satu antarmuka pengguna tanpa _page reload_, didukung oleh satu backend GAS terpusat.

**Data Aplikasi Lama & Refaktor:**

- **Master Data (VAMOS FMS):**
  - Spreadsheet: `13n6sw4pk9Sus1WK1WV8i_Xsx3Yo8lVE2UDVycaKFaFE`
  - GAS: `11zjsXl8Dz7eB2a0eRKU_Kti7x7AeVA0uLAieR7dB8ayVwbh_7pKW4nUe`

- **1. Booking (Vehicle Booking / Peminjaman KR)**
  - Pengelolaan peminjaman kendaraan operasional, approval berjenjang, pencatatan kondisi kendaraan, PDF, notifikasi WA.
  - Spreadsheet lama: `14eq-5xgFnf5fEetkZ6AfmIxeppcKR1sjKawYnTQ8bOA`
  - GAS lama: `13aSqvPhLuKXtHAgYDyAQUCNRJUpoiD1n1oTQkV-u8LLuvCeiQv17ctr8`
  - Path: `old_apps/Booking` | DB: `Formulir Peminjaman KR.xlsx`

- **2. Maintenance (Maintenance Tracker) / SmartServ**
  - Manajemen siklus hidup kendaraan, riwayat perbaikan, servis berkala, pembuatan RAB, SI, BAP, Penawaran, dll.
  - Spreadsheet lama: `1RWmQc_V-VlVxD8bV6WAJM2mzeXzq42yizzCc502DI3I`
  - GAS lama: `1bHGJ6yn5DAV6oqPZNa4qEK9DVRuCIxkIhv_CfU_E0nuc09tnRO7_ubWA`
  - Path: `old_apps/Maintenance` | DB: `Maintenance Kendaraan Operasional.xlsx`

- **3. P2HView (Daily P2H)**
  - Checklist digital harian standar keselamatan dan kelayakan jalan armada. (Baru dibangun)
  - Spreadsheet / GAS / DB: _Belum ada_
  - Path: `old_apps/p2h`

- **4. V-TACS (Voucher Tracking & Consolidation System)**
  - Modul pelacakan pemakaian voucher BBM per kendaraan secara _offline-first_ dan rekonsiliasi tagihan otomatis.
  - Fitur Utama: Permintaan voucher, pelaporan pemakaian (IndexedDB offline-ready), dasbor konsolidasi GA & POM, dan sinkronisasi data anti-conflict.
  - Target Pengguna: Rekan Lapangan, Admin GA, dan Pihak POM.
  - Spreadsheet / GAS / DB: _Belum ada_
  - Path: `old_apps/V-TACS`

| Layer            | Teknologi                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------- |
| **Frontend**     | Vue.js 3, Vite, Vue Router, Pinia                                                            |
| **Backend**      | Google Apps Script (V8 Engine)                                                               |
| **Build System** | `vite-plugin-singlefile` — Kompilasi seluruh aset Vue/CSS/JS menjadi satu `index.html` murni |
| **Deployment**   | Clasp (Command Line Apps Script Projects)                                                    |

**Struktur Direktori Terisolasi:** Repositori dibagi menjadi tiga domain utama:

- `/src` — Vue Frontend (Development)
- `/gas` — Backend Apps Script (`Code.gs`)
- `/deploy` — Direktori Deployment (Berisi hasil kompilasi single-file HTML dan copy script GAS yang akan di-push menggunakan clasp)

---

## 2. Dual-Mode Environment (Demo vs Production)

Sistem memiliki dua mode yang dikontrol ketat melalui **Variabel Lingkungan Vite** (`import.meta.env.VITE_APP_MODE`). Komponen Vue tidak menggunakan logika percabangan secara langsung, melainkan menggunakan **Service / Repository Layer** (`ApiService.js`) untuk abstraksi.

### A. Mode Demo (Strict Isolated)

> **Kondisi:** `VITE_APP_MODE = 'demo'`

- **Karakteristik:** Murni terisolasi. Tidak ada request ke server GAS. Dibiarkan mati total / tidak melakukan ping ke GAS (sesuai preferensi _strict_).
- **Data Source:** Menggunakan Mock Data lokal (memori Vue, `localForage`, atau JSON statis) sebagai _Single Source of Truth_.
- **Autentikasi:** Bypass validasi email. Menggunakan dummy token / identitas (misal: `demo.admin@app.com`) untuk simulasi Role (Admin/User).

### B. Mode Produksi (Live)

> **Kondisi:** `VITE_APP_MODE = 'production'`

- **Karakteristik:** Terkoneksi penuh ke GAS. Mock data di-_tree-shake_ (dihapus dari build akhir agar ringan).
- **Data Source:** Google Sheets via RPC API Dispatcher.
- **Autentikasi:** Ketat. Wajib menggunakan Email Google (`Session.getActiveUser().getEmail()`) yang divalidasi dengan Token.

---

## 3. Frontend Specifications (Vue 3 SPA)

Fokus pada **performa**, **Fast Response**, dan **resiliensi** (ketahanan aplikasi).

### Client-Side Routing

Menggunakan **Vue Router** untuk navigasi instan (_0ms latency_) antar Aplikasi 1, Aplikasi 2, dan modul lainnya.

### State Management & Caching (Offline First)

- **Pinia:** Menyimpan state aktif (Sesi, Token, Data UI sementara).
- **IndexedDB (`localForage`):** Bertindak sebagai _Offline Cache_. Menyimpan data referensi guna menghemat kuota request ke GAS.
- **Sync Logic:** Transaksi di IndexedDB diberi status `SYNCED`, `DIRTY`, atau `DELETED`. Kolom `Last_Modified_At` digunakan untuk sinkronisasi data online.

### Rendering & Performa UI

- Implementasi **Skeleton Loading** untuk asynchronous rendering.
- `lodash-es` untuk `debounce`/`throttle` pada kolom pencarian (_300ms_) dan pencegahan double-click pada tombol submit (menggunakan flag `isSubmitting`).

### Optimasi Media (Base64 Image Rendering)

Gambar dari backend yang berupa string _Data URI_ langsung dipasang sebagai atribut `src` pada tag `<img>`. Browser merender gambar instan tanpa HTTP request tambahan ke Google Drive.

### Logger Cerdas

Modul tersentralisasi yang merender `console.log` hanya jika `import.meta.env.DEV == true` atau flag `viewLog == true`.

---

## 4. Backend Specifications (Google Apps Script)

Meninggalkan gaya prosedural klasik dan menggunakan pola **RPC** (_Remote Procedure Call_).

### Single Endpoint

Hanya menggunakan satu fungsi `doGet(e)` untuk menyajikan UI (satu file HTML murni). Tidak ada logika bisnis pada entry point.

### Router / Dispatcher Pattern

Frontend hanya memanggil satu fungsi utama:

```javascript
google.script.run.apiDispatcher(payload)
```

Payload berisi:

```json
{
  "action": "namaFungsi",
  "token": "xxx",
  "data": { "..." }
}
```

### Routing Data (2 Spreadsheet)

Logika Dispatcher menentukan ke Spreadsheet mana data harus dibaca/ditulis (App 1 atau App 2) berdasarkan aksi yang diminta.

### Optimasi Media (Base64 Data URI Embedding)

1. File diambil sebagai binary via `DriveApp.getFileById(id).getBlob()`.
2. Diubah menjadi teks base64 via `Utilities.base64Encode()`.
3. Dibungkus dalam format `data:[mime-type];base64,[data]` (_Data URI_) sebelum dikirim ke JSON/HTML payload.

### Message Queue (Asynchronous Jobs / FronteWA)

- Aksi berat seperti pengiriman pesan WhatsApp **tidak** dilakukan secara synchronous.
- Request dicatat ke dalam Sheet `WA_Outbox` dengan status `PENDING`. Respon sukses langsung dikirim ke frontend.
- **Time-driven Trigger** (1 menit sekali) mengeksekusi antrean WA di latar belakang (_Batch Processing_).

---

## 5. Security, Authentication & Audit Trail

### Autentikasi (Token-Based)

1. Web app di-deploy dengan opsi: _"Execute as: User accessing the web app"_.
2. Saat _initial handshake_, GAS membaca email, mencocokkan dengan Sheet `Users_Roles`, membuat Token sesi, dan mengirimkannya ke Vue.
3. Vue menyimpan di `localStorage` (_Bearer concept_).

### Route Guarding (Frontend — Layer 1)

Vue Router menggunakan `beforeEach` untuk mencegat akses. Jika Role tidak sesuai, user instan dilempar ke komponen `AccessDenied.vue` (tanpa loading screen).

### API Guarding (Backend — Layer 2)

Middleware GAS memvalidasi Token dan Role pada setiap request. Jika peretas mem-bypass UI dan mengirim payload ilegal, Middleware akan menolak aksi tersebut.

### Kriptografi Data Sensitif

Diimplementasikan dengan **CryptoJS** (AES-256) di frontend. Data dienkripsi sebelum dikirim dan disimpan sebagai _Ciphertext_ di Spreadsheet.

### Sanitasi Anti Inject

Middleware GAS secara otomatis mengubah karakter berbahaya (seperti `=` di awal string) menjadi `'=` sebelum ditulis ke sel Sheet untuk mencegah injeksi formula.

### Audit Trail (Log Akuntabilitas)

- Sheet khusus `Audit_Logs` (_Protected Sheet, Append-Only_).
- Interceptor Middleware GAS otomatis merekam semua mutasi (`INSERT`, `UPDATE`, `DELETE`) dan percobaan `UNAUTHORIZED_ACCESS`.
- Mencatat:
  - **Waktu** (ISO 8601)
  - **Aktor** (Email)
  - **Tindakan**
  - **Target** (App1 / App2)
  - **Payload** (Data Sebelum & Sesudah)
- Terdapat retensi data otomatis (misal: rotasi per 90 hari / bulanan).

---

## 6. Global Error Handling & Resilience

Penanganan error tersentralisasi untuk mencegah _blank screen_ dan crash aplikasi.

### A. Backend Failsafe (GAS)

#### Centralized Dispatcher Try-Catch

Jika kode crash, dispatcher mencegah berhentinya script dan membungkus error dalam format standar (_JSend Pattern_):

```json
{
  "status": "error",
  "code": 500,
  "message": "Pesan ramah",
  "data": null
}
```

#### Kategorisasi Error

| Code    | Keterangan                                               | Audit Trail |
| ------- | -------------------------------------------------------- | ----------- |
| **400** | Bad Request / Payload tidak valid atau malformed         | Tidak       |
| **401** | Unauthorized / Token sesi tidak valid atau expired       | ✅ Ya       |
| **403** | Forbidden / Akses Role ditolak untuk endpoint ini        | ✅ Ya       |
| **404** | Not Found / Action atau Data target tidak ditemukan      | Tidak       |
| **408** | Request Timeout / Request ke GAS melebihi batas waktu    | Tidak       |
| **409** | Conflict / Konflik data (mis: kendaraan sudah dibooking) | ✅ Ya       |
| **413** | Payload Too Large / Ukuran file base64 terlalu besar     | Tidak       |
| **422** | Unprocessable Entity / Validasi form logika bisnis gagal | Tidak       |
| **429** | Too Many Requests / Indikasi spam, terkena Rate Limiting | ✅ Ya       |
| **500** | Fatal Error / Internal Error — Notifikasi ke Developer   | ✅ Ya       |
| **503** | Service Unavailable / Google Quota Limit tercapai        | ✅ Ya       |

#### Silent Failsafe Logger

Jika fungsi Audit Trail gagal, error handler mem-bypass agar aplikasi tetap berjalan dan merespon ke client.

### B. Frontend Error Interceptor (Vue 3)

- **Promise Wrapper (Circuit Breaker):** `google.script.run` dibungkus menjadi Async/Await. Memiliki auto-retry (maks 3×) untuk menangani network drop atau timeout di balik layar.
- **Global Promise Rejection:** Wrapper bertindak sebagai Interceptor untuk menangkap respon `status: "error"` dari GAS secara terpusat.
- **Global Vue Error Handler:** Menggunakan `app.config.errorHandler` untuk mencegat kegagalan render komponen (mencegah blank screen seluruh layar).
- **Toast / Snackbar Notification:** Secara otomatis menampilkan peringatan 🔴 _Fatal Error_ atau 🟠 _Validation Warning_.
- **Offline State:** Mendeteksi `navigator.onLine` dan menampilkan banner khusus (_Progressive Web App Standard_) saat koneksi terputus.

---

## 7. Peta Jalan Implementasi (Phases Roadmap)

| Fase | Nama                                        | Deskripsi                                                                                                                    |
| ---- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Infrastruktur Repositori & Build System** | Menyiapkan direktori terpisah (`/src`, `/gas`, `/deploy`), konfigurasi Vite Single-File, dan data Mock lokal.                |
| 2    | **Arsitektur Backend & Middleware**         | Membangun pola RPC, satu endpoint API Dispatcher, dan pengamanan Middleware (Sanitasi & Routing ke 2 Spreadsheet).           |
| 3    | **Arsitektur Frontend & State**             | Konfigurasi Vue Router, Pinia (State), IndexedDB (Cache offline), dan pembuatan Promise Wrapper (CryptoJS terintegrasi).     |
| 4    | **Strategi Autentikasi**                    | Pengaturan Initial Handshake GAS, pembuatan Token, dan Route/API Guarding.                                                   |
| 5    | **Background Jobs & Integrasi Final**       | Membangun antrean `WA_Outbox`, konfigurasi Trigger, penulisan Audit Trail, serta pengujian Error Handling secara end-to-end. |
