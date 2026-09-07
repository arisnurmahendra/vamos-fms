# 🔒 Panduan Keamanan — VAMOS FMS

## Gambaran Umum

VAMOS menerapkan **5 lapisan keamanan** untuk melindungi data dan mencegah akses tidak sah:

1. **Autentikasi** — Token-based via Google Auth
2. **Route Guarding** — Frontend (Layer 1)
3. **API Guarding** — Backend Middleware (Layer 2)
4. **Enkripsi** — CryptoJS AES-256
5. **Audit Trail** — Log immutable semua mutasi

---

## 1. Autentikasi (Token-Based)

### Alur Initial Handshake

```
┌──────────┐         ┌──────────────────┐         ┌──────────────┐
│  Browser │         │   Apps Script    │         │ Users_Roles  │
│ (Vue SPA)│         │  (apiDispatcher) │         │   (Sheet)    │
└────┬─────┘         └───────┬──────────┘         └──────┬───────┘
     │                       │                           │
     │  1. handshake()       │                           │
     │──────────────────────▶│                           │
     │                       │                           │
     │                       │  2. getActiveUser()       │
     │                       │  email = user@company.com │
     │                       │                           │
     │                       │  3. Lookup email          │
     │                       │──────────────────────────▶│
     │                       │                           │
     │                       │  4. Return role + status  │
     │                       │◀──────────────────────────│
     │                       │                           │
     │                       │  5. Generate token        │
     │                       │  (UUID + timestamp)       │
     │                       │                           │
     │  6. { token, role }   │                           │
     │◀──────────────────────│                           │
     │                       │                           │
     │  7. Store token       │                           │
     │  localStorage         │                           │
     │  + Pinia authStore    │                           │
```

### Deploy Configuration

```
Web App Deployment Settings:
  Execute as: "User accessing the web app"  ← WAJIB
  Who has access: "Anyone within organization" atau "Anyone"
```

> **Penting:** Opsi *"Execute as: Me"* TIDAK digunakan karena `Session.getActiveUser()` akan mengembalikan email pemilik script, bukan email pengakses.

---

## 2. Route Guarding (Frontend — Layer 1)

### Tujuan

Mencegah user melihat halaman yang bukan haknya **secara instan** (tanpa loading screen).

### Implementasi

```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Halaman publik (tidak perlu auth)
  if (!to.meta.requiresAuth) {
    return next()
  }

  // Belum login
  if (!authStore.isAuthenticated) {
    return next('/access-denied')
  }

  // Role tidak sesuai
  if (to.meta.role && !authStore.hasRole(to.meta.role)) {
    return next('/access-denied')
  }

  next()
})
```

### Role Matrix

| Route           | Role yang Diizinkan     |
| --------------- | ----------------------- |
| `/booking`      | `user`, `admin`         |
| `/maintenance`  | `mechanic`, `admin`     |
| `/p2h`          | `driver`, `admin`       |
| `/vtacs`        | `gs_admin`, `admin`     |
| `/access-denied`| Semua (publik)          |

> ⚠️ **Peringatan:** Route guard di frontend hanya bersifat **kosmetik**. User teknis bisa mem-bypass dengan DevTools. Keamanan sesungguhnya ada di **Layer 2 (Backend)**.

---

## 3. API Guarding (Backend — Layer 2)

### Tujuan

Memvalidasi **setiap request** yang masuk ke `apiDispatcher`, bahkan jika frontend sudah di-bypass.

### Middleware Flow

```javascript
function apiDispatcher(payload) {
  try {
    // 1. Validasi struktur payload
    if (!payload || !payload.action) {
      return responseError(400, "Invalid payload structure.")
    }

    // 2. Cek apakah action membutuhkan auth
    if (requiresAuth(payload.action)) {
      // 3. Validasi token
      const session = validateToken(payload.token)
      if (!session) {
        logAudit('UNAUTHORIZED_ACCESS', payload)
        return responseError(401, "Token tidak valid atau expired.")
      }

      // 4. Validasi role
      if (!hasPermission(session.role, payload.action)) {
        logAudit('FORBIDDEN_ACCESS', payload)
        return responseError(403, "Anda tidak memiliki akses untuk aksi ini.")
      }
    }

    // 5. Route ke handler
    return routeAction(payload)

  } catch (error) {
    return responseError(500, "Internal Server Error")
  }
}
```

---

## 4. Enkripsi Data Sensitif (CryptoJS)

### Algoritma

| Parameter  | Nilai              |
| ---------- | ------------------ |
| Library    | CryptoJS           |
| Algoritma  | AES-256            |
| Mode       | CBC (default)      |
| Padding    | Pkcs7 (default)    |

### Alur Enkripsi

```
[Data Asli] → CryptoJS.AES.encrypt(data, SECRET_KEY) → [Ciphertext] → Simpan ke Sheet
[Ciphertext dari Sheet] → CryptoJS.AES.decrypt(cipher, SECRET_KEY) → [Data Asli]
```

### Contoh Penggunaan

```javascript
import CryptoJS from 'crypto-js'

const SECRET_KEY = import.meta.env.VITE_CRYPTO_KEY

// Encrypt sebelum kirim ke GAS
function encrypt(plainText) {
  return CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString()
}

// Decrypt setelah terima dari GAS
function decrypt(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}
```

### Data yang WAJIB Dienkripsi

| Data                | Alasan                           |
| ------------------- | -------------------------------- |
| Nomor telepon       | Data pribadi (PII)               |
| Alamat email pribadi| Data pribadi (PII)               |
| Catatan rahasia     | Informasi sensitif perusahaan    |

---

## 5. Sanitasi Anti-Inject

### Ancaman

Injeksi formula di Google Sheets — jika user memasukkan `=IMPORTRANGE(...)` atau `=IMAGE(url)` di field input, Spreadsheet akan mengeksekusinya.

### Mitigasi

```javascript
// Backend GAS — Middleware
function sanitizeInput(value) {
  if (typeof value === 'string') {
    // Tambah prefix ' jika diawali karakter formula
    const dangerChars = ['=', '+', '-', '@', '\t', '\r', '\n']
    if (dangerChars.some(c => value.startsWith(c))) {
      return "'" + value
    }
  }
  return value
}

// Sanitasi rekursif untuk seluruh payload
function sanitizePayload(data) {
  if (typeof data === 'string') return sanitizeInput(data)
  if (Array.isArray(data)) return data.map(sanitizePayload)
  if (typeof data === 'object' && data !== null) {
    const sanitized = {}
    for (const [key, val] of Object.entries(data)) {
      sanitized[key] = sanitizePayload(val)
    }
    return sanitized
  }
  return data
}
```

---

## 6. Audit Trail

### Sheet: `Audit_Logs`

| Kolom             | Tipe       | Contoh                          |
| ----------------- | ---------- | ------------------------------- |
| `Timestamp`       | ISO 8601   | `2026-09-07T10:30:00+07:00`    |
| `Actor`           | String     | `user@company.com`             |
| `Action`          | String     | `INSERT`, `UPDATE`, `DELETE`   |
| `Target`          | String     | `App1:Bookings`                |
| `Payload_Before`  | JSON       | `{ "status": "pending" }`     |
| `Payload_After`   | JSON       | `{ "status": "approved" }`    |
| `IP_Info`         | String     | *(tidak tersedia di GAS)*      |

### Proteksi

- Sheet dilindungi (**Protected Range**) — hanya script yang bisa menulis.
- Operasi hanya **Append** — tidak ada update atau delete pada log.
- Retensi otomatis: rotasi per 90 hari atau arsip bulanan.

### Event yang Dicatat

| Event                    | Severity | Contoh                                |
| ------------------------ | -------- | ------------------------------------- |
| `DATA_INSERT`            | INFO     | User membuat booking baru             |
| `DATA_UPDATE`            | INFO     | Status maintenance diubah             |
| `DATA_DELETE`            | WARNING  | Booking dibatalkan                    |
| `UNAUTHORIZED_ACCESS`    | CRITICAL | Token invalid mencoba akses API       |
| `FORBIDDEN_ACCESS`       | CRITICAL | Role user tidak sesuai dengan action  |
| `SYSTEM_ERROR`           | CRITICAL | Fatal error di dispatcher             |
