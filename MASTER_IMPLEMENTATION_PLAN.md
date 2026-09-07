MASTER IMPLEMENTATION PLAN
Enterprise Single Page Application (SPA) on Google Apps Script (GAS)

1. Arsitektur Inti (Core Architecture)
Sistem menggunakan arsitektur Dual-App Single-Instance SPA. Dua aplikasi terpisah digabungkan ke dalam satu antarmuka pengguna tanpa page reload, didukung oleh satu backend GAS terpusat.

Frontend: Vue.js 3, Vite, Vue Router, Pinia.

Backend: Google Apps Script (V8 Engine).

Build System: vite-plugin-singlefile (Kompilasi seluruh aset Vue/CSS/JS menjadi satu index.html murni).

Deployment: Clasp (Command Line Apps Script Projects).

Struktur Direktori Terisolasi: Repositori dibagi menjadi dua domain: /src (untuk Vue Frontend) dan /gas (untuk Backend Apps Script).

2. Dual-Mode Environment (Demo vs Production)
Sistem memiliki dua mode yang dikontrol ketat melalui Variabel Lingkungan Vite (import.meta.env.VITE_APP_MODE). Komponen Vue tidak menggunakan logika percabangan secara langsung, melainkan menggunakan Service / Repository Layer (ApiService.js) untuk abstraksi.

A. Mode Demo (Strict Isolated)
Kondisi: VITE_APP_MODE = 'demo'

Karakteristik: Murni terisolasi. Tidak ada request ke server GAS. Dibiarkan mati total / tidak melakukan ping ke GAS (sesuai preferensi strict).

Data Source: Menggunakan Mock Data lokal (memori Vue, localForage, atau JSON statis) sebagai Single Source of Truth.

Autentikasi: Bypass validasi email. Menggunakan dummy token / identitas (misal: demo.admin@app.com) untuk simulasi Role (Admin/User).

B. Mode Produksi (Live)
Kondisi: VITE_APP_MODE = 'production'

Karakteristik: Terkoneksi penuh ke GAS. Mock data di-tree-shake (dihapus dari build akhir agar ringan).

Data Source: Google Sheets via RPC API Dispatcher.

Autentikasi: Ketat. Wajib menggunakan Email Google (Session.getActiveUser().getEmail()) yang divalidasi dengan Token.

3. Frontend Specifications (Vue 3 SPA)
Fokus pada performa, Fast Response, dan resiliensi (ketahanan aplikasi).

Client-Side Routing: Menggunakan Vue Router untuk navigasi instan (0ms latency) antar Aplikasi 1, Aplikasi 2, dan modul lainnya.

State Management & Caching (Offline First):

Pinia: Menyimpan state aktif (Sesi, Token, Data UI sementara).

IndexedDB (localForage): Bertindak sebagai Offline Cache. Menyimpan data referensi guna menghemat kuota request ke GAS.

Sync Logic: Transaksi di IndexedDB diberi status SYNCED, DIRTY, atau DELETED. Kolom Last_Modified_At digunakan untuk sinkronisasi data online.

Rendering & Performa UI:

Implementasi Skeleton Loading untuk asynchronous rendering.

lodash-es untuk debounce/throttle pada kolom pencarian (300ms) dan pencegahan double-click pada tombol submit (menggunakan flag isSubmitting).

Optimasi Media (Base64 Image Rendering): Gambar dari backend yang berupa string Data URI langsung dipasang sebagai atribut src pada tag <img>. Browser merender gambar instan tanpa HTTP request tambahan ke Google Drive.

Logger Cerdas: Modul tersentralisasi yang merender console.log hanya jika import.meta.env.DEV == true atau flag viewLog == true.

4. Backend Specifications (Google Apps Script)
Meninggalkan gaya prosedural klasik dan menggunakan pola RPC (Remote Procedure Call).

Single Endpoint: Hanya menggunakan satu fungsi doGet(e) untuk menyajikan UI (satu file HTML murni). Tidak ada logika bisnis pada entry point.

Router/Dispatcher Pattern: Frontend hanya memanggil satu fungsi utama: google.script.run.apiDispatcher(payload). Payload berisi { action: 'namaFungsi', token: 'xxx', data: {...} }.

Routing Data (2 Spreadsheet): Logika Dispatcher menentukan ke Spreadsheet mana data harus dibaca/ditulis (App 1 atau App 2) berdasarkan aksi yang diminta.

Optimasi Media (Base64 Data URI Embedding): File diambil sebagai binary via DriveApp.getFileById(id).getBlob(), diubah menjadi teks base64 via Utilities.base64Encode(), lalu dibungkus dalam format data:[mime-type];base64,[data] (Data URI) sebelum dikirim ke JSON/HTML payload.

Message Queue (Asynchronous Jobs / FronteWA):

Aksi berat seperti pengiriman pesan WhatsApp tidak dilakukan secara synchronous.

Request dicatat ke dalam Sheet WA_Outbox dengan status PENDING. Respon sukses langsung dikirim ke frontend.

Time-driven Trigger (1 menit sekali) mengeksekusi antrean WA di latar belakang (Batch Processing).

5. Security, Authentication & Audit Trail
Autentikasi (Token-Based):

Web app di-deploy dengan opsi: "Execute as: User accessing the web app".

Saat initial handshake, GAS membaca email, mencocokkan dengan Sheet Users_Roles, membuat Token sesi, dan mengirimkannya ke Vue. Vue menyimpan di localStorage (Bearer concept).

Route Guarding (Frontend - Layer 1): Vue Router menggunakan beforeEach untuk mencegat akses. Jika Role tidak sesuai, user instan dilempar ke komponen AccessDenied.vue (tanpa loading screen).

API Guarding (Backend - Layer 2): Middleware GAS memvalidasi Token dan Role pada setiap request. Jika peretas mem-bypass UI dan mengirim payload ilegal, Middleware akan menolak aksi tersebut.

Kriptografi Data Sensitif: Diimplementasikan dengan CryptoJS (AES-256) di frontend. Data dienkripsi sebelum dikirim dan disimpan sebagai Ciphertext di Spreadsheet.

Sanitasi Anti Inject: Middleware GAS secara otomatis mengubah karakter berbahaya (seperti = di awal string) menjadi '= sebelum ditulis ke sel Sheet untuk mencegah injeksi formula.

Audit Trail (Log Akuntabilitas):

Sheet khusus Audit_Logs (Protected Sheet, Append-Only).

Interceptor Middleware GAS otomatis merekam semua mutasi (INSERT, UPDATE, DELETE) dan percobaan UNAUTHORIZED_ACCESS.

Mencatat: Waktu (ISO 8601), Aktor (Email), Tindakan, Target (App1/App2), dan Payload (Data Sebelum & Sesudah).

Terdapat retensi data otomatis (misal: rotasi per 90 hari / bulanan).

6. Global Error Handling & Resilience
Penanganan error tersentralisasi untuk mencegah blank screen dan crash aplikasi.

A. Backend Failsafe (GAS)
Centralized Dispatcher Try-Catch: Jika kode crash, dispatcher mencegah berhentinya script dan membungkus error dalam format standar (JSend Pattern):

JSON
{ "status": "error", "code": 500, "message": "Pesan ramah", "data": null }
Kategorisasi:

400 (Bad Request / Validasi Gagal)

401/403 (Auth/Forbidden - Masuk Audit Trail)

500 (Fatal Error - Kirim notifikasi WA ke Developer).

Silent Failsafe Logger: Jika fungsi Audit Trail gagal, error handler mem-bypass agar aplikasi tetap berjalan dan merespon ke client.

B. Frontend Error Interceptor (Vue 3)
Promise Wrapper (Circuit Breaker): google.script.run dibungkus menjadi Async/Await. Memiliki auto-retry (maks 3x) untuk menangani network drop atau timeout di balik layar.

Global Promise Rejection: Wrapper bertindak sebagai Interceptor untuk menangkap respon status: "error" dari GAS secara terpusat.

Global Vue Error Handler: Menggunakan app.config.errorHandler untuk mencegat kegagalan render komponen (mencegah blank screen seluruh layar).

Toast / Snackbar Notification: Secara otomatis menampilkan peringatan Merah (Fatal Error) atau Oranye (Validation Warning).

Offline State: Mendeteksi navigator.onLine dan menampilkan banner khusus (Progressive Web App Standard) saat koneksi terputus.

7. Peta Jalan Implementasi (Phases Roadmap)
Fase 1: Infrastruktur Repositori & Build System
Menyiapkan direktori terpisah (/src & /gas), konfigurasi Vite Single-File, dan data Mock lokal.

Fase 2: Arsitektur Backend & Middleware
Membangun pola RPC, satu endpoint API Dispatcher, dan pengamanan Middleware (Sanitasi & Routing ke 2 Spreadsheet).

Fase 3: Arsitektur Frontend & State
Konfigurasi Vue Router, Pinia (State), IndexedDB (Cache offline), dan pembuatan Promise Wrapper (CryptoJS terintegrasi).

Fase 4: Strategi Autentikasi
Pengaturan Initial Handshake GAS, pembuatan Token, dan Route/API Guarding.

Fase 5: Background Jobs & Integrasi Final
Membangun antrean WA_Outbox, konfigurasi Trigger, penulisan Audit Trail, serta pengujian Error Handling secara end-to-end.
