# 🔄 BOOKING_APPROVAL_FLOW — State Machine Specification

> **Modul:** VAMOS FMS - Booking (Peminjaman Kendaraan Roda 4)  
> **Tracker ID:** `BKG-011`  
> **Status:** Canonical Ground Truth

Dokumen ini mendefinisikan siklus hidup (State Machine), peran yang terlibat, dan aturan transisi persetujuan peminjaman kendaraan operasional di lingkungan PT VAMOS FMS.

---

## 1. Diagram Alur Transisi Status (State Machine)

```
[ Form Diajukan (User) ]
           │
           ▼
     [ SUBMITTED ]
           │
           ▼
    [ PENDING_AM ] ────────(Ditolak)───────► [ REJECTED ]
           │ (Disetujui Atasan 1 / SM)
           ▼
    [ PENDING_GS1 ] ───────(Ditolak)───────► [ REJECTED ]
           │ (Pemeriksaan & Serah Keluar oleh Pool GS)
           ▼
       [ ON_TRIP ]
 (Kendaraan Operasional Digunakan)
           │
           ▼
    [ PENDING_GS2 ]
 (Pengembalian & Cek Fisik/KM Masuk oleh Pool GS)
           │ (Disahkan Masuk)
           ▼
     [ COMPLETED ]
(Selesai / Dokumen Diarsipkan)
```

---

## 2. Definisi State Lengkap

| State | Keterangan | Aktor Berwenang | Syarat Masuk |
|:---|:---|:---|:---|
| `SUBMITTED` | Permohonan baru diajukan oleh peminjam. | Peminjam / System | Form lengkap, Nopol valid & tersedia pada jadwal tersebut. |
| `PENDING_AM` | Menunggu persetujuan Atasan Langsung / Site Manager (SM). | SM / Atasan 1 | Transisi otomatis setelah `SUBMITTED`. Link notifikasi WA dikirim. |
| `PENDING_GS1` | Permohonan disetujui atasan; menunggu pengeluaran kendaraan oleh Pool GS. | GS1 / Petugas Pool | Atasan 1 menyetujui. |
| `ON_TRIP` | Kendaraan telah diperiksa fisik & KM keluar, diserahkan ke peminjam. | GS1 / Petugas Pool | Input KM keluar, posisi strip BBM, checklist fisik keluar. |
| `PENDING_GS2` | Kendaraan kembali ke pool; menunggu verifikasi kondisi masuk. | GS2 / Petugas Pool | Perjalanan selesai / peminjam mengembalikan unit. |
| `COMPLETED` | Pemeriksaan masuk selesai (KM, BBM, kondisi aman); peminjaman tuntas. | GS2 / ADM | Input KM kembali, strip BBM kembali, tidak ada kendala tersisa. |
| `REJECTED` | Permohonan ditolak oleh atasan atau petugas pool. | SM / GS / ADM | Disertai alasan penolakan wajib. Notifikasi dikirim ke peminjam. |

---

## 3. Validasi & Hak Akses Transisi

1. **Anti-Tumpang Tindih (`NOPOL_BUSY`):**
   Sistem memvalidasi jadwal (`Tanggal_Pinjam` s/d `Tanggal_Kembali`) untuk nopol yang sama. Jika ada transaksi berstatus aktif (`SUBMITTED`, `PENDING_AM`, `PENDING_GS1`, `ON_TRIP`), booking ditolak dengan kode `NOPOL_BUSY`.
2. **One-Click Quick Approval via WhatsApp:**
   Approver dapat menyetujui langsung melalui tautan WA yang memuat token HMAC-SHA256 (`uid`, `role`, `action`, `expiry`) tanpa harus masuk ke sesi penuh. Token kadaluarsa dalam 24 jam.
3. **Penyimpanan Audit Trail:**
   Setiap perubahan status mencatat waktu, aktor eksekutor, status sebelumnya, dan status baru ke log audit VAMOS.
