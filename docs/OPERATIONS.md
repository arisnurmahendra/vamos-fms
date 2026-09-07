# ⚙️ OPERATIONS GUIDE — VAMOS FMS

> **Panduan Operasional & Konfigurasi Script Properties Google Apps Script**

Dokumen ini menjelaskan tata cara pengelolaan konfigurasi sensitif, token API pihak ketiga, dan secret key yang disimpan pada **Google Apps Script Script Properties** (bukan di source code).

---

## 🔑 Daftar Script Properties Wajib

| Property Key | Deskripsi | Contoh Nilai | Wajib Untuk |
|:---|:---|:---|:---|
| `APP_SECRET` | Kunci HMAC-SHA256 untuk token sesi VAMOS FMS | `vamos_fms_secret_prod_xyz123` | Semua Modul |
| `FONNTE_TOKEN` | API Token Fonnte untuk pengiriman pesan WhatsApp | `d4R9ENLdGHwTgMqq6fkZ` | Booking, P2H, Outbox |
| `WA_APPROVAL_SECRET` | Kunci secret untuk token tanda tangan approval link WA | `bkg_wa_approval_secret_2026` | Booking |
| `SIGNATURE_FOLDER_ID` | Google Drive Folder ID untuk menyimpan tanda tangan digital peminjam | `1A2b3C4d5E6f7G8h9I0j` | Booking Master User |
| `PDF_FOLDER_ID` | Google Drive Folder ID untuk menyimpan arsip PDF peminjaman | `1X2y3Z4a5B6c7D8e9F0g` | Booking PDF Generator |
| `AES_ENCRYPTION_KEY` | Kunci enkripsi AES-256 untuk kredensial & data sensitif | `vamos_aes_key_secret_2026` | Maintenance (SmartServ) |
| `MAINTENANCE_SS_ID` | Spreadsheet ID terpisah khusus database histori maintenance | `1RWmQc_V-VlVxD8bV6WAJM2mzeXzq42yizzCc502DI3I` | Maintenance DAL |
| `MAINTENANCE_FOLDER_IMG` | Google Drive Folder ID untuk upload foto fisik kerusakan armada | `1FldImgMnt_xyz123` | Maintenance Upload |
| `MAINTENANCE_FOLDER_PDF` | Google Drive Folder ID untuk penyimpanan arsip SPK/RAB PDF | `1FldPdfMnt_xyz456` | Maintenance SPK PDF |

---

## 🛠️ Cara Mengatur Script Properties di GAS

1. Buka Google Sheets database VAMOS FMS atau kunjungi [script.google.com](https://script.google.com).
2. Buka proyek Google Apps Script VAMOS FMS.
3. Klik ikon **Project Settings** (ikon roda gigi ⚙️ di menu sebelah kiri).
4. Gulir ke bawah hingga bagian **Script Properties**.
5. Klik **Add script property** (atau **Edit script properties**).
6. Masukkan **Property** dan **Value** sesuai tabel di atas.
7. Klik **Save script properties**.

---

## 🔒 Kebijakan Keamanan (POL.ISMS.001)

1. **Dilarang Keras** menuliskan token, secret, atau credential mentah di file `.js`, `.gs`, maupun dokumen publik.
2. Token WhatsApp dan webhook hanya boleh dipanggil dari backend GAS via `PropertiesService.getScriptProperties().getProperty('KEY')`.
