# 📋 BOOKING_SCHEMA — Data Contract Ground Truth

> **Modul:** VAMOS FMS - Booking (Peminjaman Kendaraan Roda 4)  
> **Tracker ID:** `BKG-001`  
> **Status:** Canonical Ground Truth

Dokumen ini mendokumentasikan skema tabel Google Sheets untuk modul Booking, menggantikan raw index kolom magic number dari `old_apps/Booking/Code.js` dengan konstanta terstandarisasi.

---

## 1. Sheet `datadb` (Transaksi Peminjaman Kendaraan)

Menyimpan seluruh rekaman permohonan peminjaman armada, data keluar/masuk kendaraan, dan histori persetujuan berjenjang.

| No | Nama Field | Kolom | Tipe Data | Keterangan & Validasi |
|:---|:---|:---|:---|:---|
| 1 | `UID` | J | String | Primary Key, format: `BKG-YYYYMMDD-XXXX` |
| 2 | `Nopol` | K | String | Nomor polisi kendaraan (contoh: `KT 1234 AB`) |
| 3 | `Peminjam` | L | String | Nama lengkap peminjam |
| 4 | `NDK` | M | String | Nomor Induk Karyawan / NPK peminjam |
| 5 | `Tanggal_Pinjam` | N | Date (YYYY-MM-DD) | Tanggal rencana peminjaman |
| 6 | `Jam_Pinjam` | O | Time (HH:mm) | Waktu mulai pinjam |
| 7 | `Tanggal_Kembali` | P | Date (YYYY-MM-DD) | Tanggal rencana pengembalian |
| 8 | `Jam_Kembali` | Q | Time (HH:mm) | Waktu rencana pengembalian |
| 9 | `Keperluan` | R | String | Deskripsi kebutuhan dinas / operasional |
| 10 | `Jenis_Keperluan` | S | String | `Operasional` \| `Non Operasional` |
| 11 | `Lokasi_Tujuan` | T | String | Lokasi tujuan perjalanan |
| 12 | `Driver` | U | String | Nama pengemudi atau `Lepas Kunci` |
| 13 | `Atasan_1` | V | String | Nama atasan pemberi persetujuan tahap 1 |
| 14 | `Atasan_2` | W | String | Nama atasan pemberi persetujuan tahap 2 |
| 15 | `Status` | X | String | Status alur: `SUBMITTED`, `PENDING_AM`, `PENDING_GS1`, `ON_TRIP`, `PENDING_GS2`, `COMPLETED`, `REJECTED` |
| 16 | `KM_Keluar` | Y | Number | Kilometer odometer saat kendaraan keluar pool |
| 17 | `BBM_Keluar` | Z | String / Number | Posisi bar/strip BBM saat keluar pool |
| 18 | `Kondisi_Keluar` | AA | String | Catatan fisik kendaraan saat keluar pool |
| 19 | `Petugas_Keluar` | AB | String | Petugas Pool / GS yang mengesahkan keluar |
| 20 | `Tgl_Keluar` | AC | DateTime | Waktu aktual kendaraan keluar pool |
| 21 | `KM_Masuk` | AD | Number | Kilometer odometer saat kendaraan kembali |
| 22 | `BBM_Masuk` | AE | String / Number | Posisi bar/strip BBM saat kembali |
| 23 | `Kondisi_Masuk` | AF | String | Catatan fisik kendaraan saat kembali |
| 24 | `Petugas_Masuk` | AG | String | Petugas Pool / GS yang mengesahkan masuk |
| 25 | `Tgl_Masuk` | AH | DateTime | Waktu aktual kendaraan kembali |
| 26 | `Catatan_Admin` | AI | String | Catatan dari GA Admin / SM |
| 27 | `Created_At` | AJ | DateTime (ISO) | Waktu pembuatan dokumen permohonan |
| 28 | `Updated_At` | AK | DateTime (ISO) | Waktu pembaruan status terakhir |

---

## 2. Sheet `nopol` (Master Kendaraan Roda 4)

| Kolom | Nama Field | Tipe Data | Keterangan |
|:---|:---|:---|:---|
| A | `Nopol` | String | Nomor polisi normalized (Uppercase, spasi tunggal) |
| B | `Unit` | String | Nama unit / departemen kepemilikan |
| C | `Jenis_Unit` | String | Merk & Tipe (contoh: `Toyota Hilux`, `Mitsubishi Triton`) |
| D | `Status_Aktif` | String | `AKTIF` \| `NONAKTIF` \| `MAINTENANCE` |

---

## 3. Sheet `user` (Master Peminjam & Tanda Tangan)

| Kolom | Nama Field | Tipe Data | Keterangan |
|:---|:---|:---|:---|
| A | `Nama` | String | Nama lengkap karyawan |
| B | `NDK` | String | Nomor Induk Karyawan |
| C | `Departemen` | String | Divisi / Departemen |
| D | `No_WA` | String | Nomor WhatsApp aktif format 628xxx |
| E | `Signature_URL` | String | URL Google Drive file tanda tangan digital |

---

## 4. Sheet `atasan_wa` (Kontak Approver & Notifikasi)

| Kolom | Nama Field | Tipe Data | Keterangan |
|:---|:---|:---|:---|
| A | `Nama_Atasan` | String | Nama lengkap atasan / manajer |
| B | `Jabatan` | String | Jabatan (SM, GS, Manager Site, dll.) |
| C | `No_WA` | String | Nomor WhatsApp format internasional (628xxx) |
| D | `Status_Aktif` | String | `AKTIF` \| `NONAKTIF` |

---

## 5. Sheet `WA_Outbox` (Antrean Notifikasi Pesan WhatsApp)

| Kolom | Nama Field | Tipe Data | Keterangan |
|:---|:---|:---|:---|
| A | `Message_ID` | String | Unique ID: `MSG-YYYYMMDD-XXXX` |
| B | `Module` | String | `BOOKING` \| `P2H` \| `VTACS` \| `MAINTENANCE` |
| C | `Target_WA` | String | Nomor WhatsApp tujuan |
| D | `Message_Body` | String | Teks isi pesan |
| E | `Status` | String | `PENDING` \| `SENT` \| `FAILED` |
| F | `Retry_Count` | Number | Jumlah percobaan kirim |
| G | `Created_At` | DateTime (ISO) | Waktu pesan masuk antrean |
| H | `Sent_At` | DateTime (ISO) | Waktu pesan berhasil terkirim |
