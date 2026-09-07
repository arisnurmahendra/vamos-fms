# 📡 API Reference — VAMOS FMS

## Gambaran Umum

Backend VAMOS menggunakan pola **RPC** (Remote Procedure Call) melalui satu endpoint tunggal: `apiDispatcher(payload)`. Semua komunikasi Frontend ↔ Backend melewati fungsi ini.

---

## Entry Point

### `doGet(e)`

Menyajikan file `index.html` hasil build Vite sebagai Apps Script Web App.

```javascript
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('VAMOS - Fleet Management System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
```

> **Catatan:** Tidak ada logika bisnis di `doGet`. Hanya menyajikan UI.

---

## RPC Dispatcher

### `apiDispatcher(payload)`

Pintu masuk utama untuk semua operasi data.

#### Payload Format

```json
{
  "action": "string",       // Nama fungsi yang akan dieksekusi
  "token": "string",        // Token sesi untuk autentikasi
  "data": { }               // Data spesifik per aksi
}
```

#### Pemanggilan dari Frontend

```javascript
// Via Promise Wrapper (Rekomendasi)
const result = await gasCall({
  action: 'getBookings',
  token: authStore.token,
  data: { month: '2026-09' }
})

// Via google.script.run langsung (Tidak direkomendasikan)
google.script.run
  .withSuccessHandler(callback)
  .withFailureHandler(errorHandler)
  .apiDispatcher(payload)
```

---

## Response Format (JSend Pattern)

Semua response dari backend mengikuti kontrak **JSend**:

### Success Response

```json
{
  "status": "success",
  "code": 200,
  "message": "Success",
  "data": { ... }
}
```

### Error Response

```json
{
  "status": "error",
  "code": 400,
  "message": "Deskripsi error yang ramah",
  "data": null
}
```

### Kode Error

| Code    | Tipe                 | Keterangan                                                | Audit Trail |
| ------- | -------------------- | --------------------------------------------------------- | ----------- |
| `200`   | Success              | Operasi berhasil                                          | Tidak       |
| `400`   | Bad Request          | Payload tidak valid atau malformed                        | Tidak       |
| `401`   | Unauthorized         | Token sesi tidak valid atau expired                       | ✅ Ya       |
| `403`   | Forbidden            | Akses Role ditolak untuk endpoint ini                     | ✅ Ya       |
| `404`   | Not Found            | Action atau Data target tidak ditemukan                   | Tidak       |
| `408`   | Request Timeout      | Request ke GAS melebihi batas waktu                       | Tidak       |
| `409`   | Conflict             | Konflik data (mis: kendaraan sudah dibooking)             | ✅ Ya       |
| `413`   | Payload Too Large    | Ukuran file base64 terlalu besar                          | Tidak       |
| `422`   | Unprocessable Entity | Validasi form logika bisnis gagal                         | Tidak       |
| `429`   | Too Many Requests    | Indikasi spam, terkena Rate Limiting                      | ✅ Ya       |
| `500`   | Internal Error       | Fatal error — notifikasi ke developer                     | ✅ Ya       |
| `503`   | Service Unavailable  | Google Quota Limit tercapai                               | ✅ Ya       |

---

## Daftar Action

> **Status:** Banyak action belum diimplementasikan. Tabel ini adalah _contract_ yang akan bertumbuh seiring development.

### System

| Action   | Deskripsi                     | Auth | Status      |
| -------- | ----------------------------- | ---- | ----------- |
| `ping`   | Health check backend          | ❌    | ✅ Aktif    |

### Booking (Planned)

| Action              | Deskripsi                            | Auth | Status      |
| ------------------- | ------------------------------------ | ---- | ----------- |
| `getBookings`       | Ambil daftar peminjaman kendaraan    | ✅    | ⬜ Planned  |
| `createBooking`     | Buat peminjaman baru                 | ✅    | ⬜ Planned  |
| `updateBooking`     | Update status peminjaman             | ✅    | ⬜ Planned  |
| `deleteBooking`     | Hapus/batalkan peminjaman            | ✅    | ⬜ Planned  |

### Maintenance (Planned)

| Action                 | Deskripsi                          | Auth | Status      |
| ---------------------- | ---------------------------------- | ---- | ----------- |
| `getMaintenanceList`   | Ambil riwayat maintenance          | ✅    | ⬜ Planned  |
| `createMaintenance`    | Catat maintenance baru             | ✅    | ⬜ Planned  |
| `updateMaintenance`    | Update status maintenance          | ✅    | ⬜ Planned  |

### P2H (Planned)

| Action            | Deskripsi                           | Auth | Status      |
| ----------------- | ----------------------------------- | ---- | ----------- |
| `getP2HChecklist` | Ambil template checklist P2H        | ✅    | ⬜ Planned  |
| `submitP2H`       | Submit hasil inspeksi harian        | ✅    | ⬜ Planned  |
| `getP2HHistory`   | Ambil riwayat P2H per kendaraan     | ✅    | ⬜ Planned  |

### V-TACS (Planned)

| Action               | Deskripsi                          | Auth | Status      |
| -------------------- | ---------------------------------- | ---- | ----------- |
| `getVoucherUsage`    | Ambil data pemakaian voucher BBM   | ✅    | ⬜ Planned  |
| `submitVoucher`      | Catat pemakaian voucher            | ✅    | ⬜ Planned  |
| `getReconciliation`  | Data rekonsiliasi tagihan          | ✅    | ⬜ Planned  |

### Auth (Planned)

| Action          | Deskripsi                           | Auth | Status      |
| --------------- | ----------------------------------- | ---- | ----------- |
| `handshake`     | Initial auth — email → token        | ❌    | ⬜ Planned  |
| `validateToken` | Validasi token aktif                 | ✅    | ⬜ Planned  |
| `getUserRole`   | Ambil role user berdasarkan email    | ✅    | ⬜ Planned  |
