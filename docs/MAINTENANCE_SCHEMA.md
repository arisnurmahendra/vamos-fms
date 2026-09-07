# 📋 MAINTENANCE_SCHEMA — Ground Truth Data Contract

> **Modul:** VAMOS FMS - SmartServ Maintenance (Perawatan & Perbaikan Kendaraan)  
> **Tracker ID:** `MTN-003`  
> **Ground Truth Groundwork:** Pengganti sistem lama `old_apps/Maintenance`

Dokumen ini mendokumentasikan skema tabel Google Sheets yang digunakan oleh modul Maintenance (SmartServ) pada VAMOS FMS.

---

## 1. Sheet `laporan` (Laporan Kerusakan & Permohonan Servis)

Menyimpan data keluhan, kerusakan kendaraan, dan status siklus perbaikan.

| Kolom | Nama Field | Tipe Data | Keterangan & Validasi |
|:---|:---|:---|:---|
| A | `No_Laporan` | String | Primary Key, format: `MNT-YYYYMMDD-XXXX` |
| B | `Tanggal_Lapor` | Date (YYYY-MM-DD) | Tanggal laporan dibuat |
| C | `Nopol` | String | Nomor polisi kendaraan (contoh: `KT 1234 AB`) |
| D | `Driver_Pelapor` | String | Nama pelapor / pengemudi |
| E | `KM_Odometer` | Number | Odometer kendaraan saat lapor |
| F | `Kategori_Servis` | String | `Berkala` \| `Perbaikan Kerusakan` \| `Emergency` |
| G | `Keluhan` | String | Rincian masalah / gejala kerusakan |
| H | `Status_Perbaikan` | String | `LAPORAN_BARU`, `RAB_DIAJUKAN`, `SPK_TERBIT`, `DALAM_PENGERJAAN`, `SELESAI`, `DITOLAK` |
| I | `Estimasi_Biaya` | Number | Total estimasi biaya dari RAB |
| J | `Biaya_Realisasi` | Number | Total biaya aktual dari faktur bengkel |
| K | `Bengkel_Rekanan` | String | Nama bengkel pengerjaan |
| L | `Foto_Kerusakan_URL` | String | URL Google Drive foto fisik |
| M | `Created_At` | DateTime (ISO) | Waktu submit laporan |
| N | `Updated_At` | DateTime (ISO) | Waktu pembaruan status |

---

## 2. Sheet `harsat` (Katalog Harga Satuan Jasa & Part)

Daftar acuan biaya pekerjaan mekanik dan suku cadang terstandar.

| Kolom | Nama Field | Tipe Data | Keterangan |
|:---|:---|:---|:---|
| A | `Kode_Item` | String | Primary Key: `HST-001`, `HST-002`, dst. |
| B | `Deskripsi` | String | Nama pekerjaan atau komponen suku cadang |
| C | `Kategori` | String | `Jasa Mekanik` \| `Oli & Pelumas` \| `Fast Moving Part` \| `Heavy Part` |
| D | `Satuan` | String | `Pcs` \| `Liter` \| `Set` \| `Paket` |
| E | `Harga_Satuan` | Number | Tarif acuan dalam Rupiah |
| F | `Status_Aktif` | String | `AKTIF` \| `NONAKTIF` |

---

## 3. Sheet `rab` & `no_rab` (Rencana Anggaran Biaya)

Menyimpan rincian item biaya yang diajukan untuk perbaikan tertentu sebelum SPK diterbitkan.

| Kolom | Nama Field | Tipe Data | Keterangan |
|:---|:---|:---|:---|
| A | `No_RAB` | String | Primary Key: `RAB-YYYYMMDD-XXXX` |
| B | `No_Laporan` | String | Foreign Key merujuk ke sheet `laporan` |
| C | `Nopol` | String | Nomor polisi armada |
| D | `Item_Pekerjaan` | String | Rincian pekerjaan / part |
| E | `Qty` | Number | Jumlah kuantitas |
| F | `Harga_Satuan` | Number | Harga per satuan |
| G | `Total_Harga` | Number | `Qty * Harga_Satuan` |
| H | `Status_Approval` | String | `DRAFT`, `PENDING_SM`, `APPROVED`, `REJECTED` |

---

## 4. Sheet `no_spk` (Surat Perintah Kerja ke Bengkel)

Dokumen legal instruksi kerja perbaikan ke bengkel rekanan resmi.

| Kolom | Nama Field | Tipe Data | Keterangan |
|:---|:---|:---|:---|
| A | `No_SPK` | String | Primary Key: `SPK-YYYYMMDD-XXXX` |
| B | `No_RAB` | String | Referensi RAB yang disetujui |
| C | `No_Laporan` | String | Referensi Laporan Kerusakan |
| D | `Nopol` | String | Nomor Polisi Kendaraan |
| E | `Nama_Bengkel` | String | Bengkel pelaksana pekerjaan |
| F | `Tgl_Terbit_SPK` | Date (YYYY-MM-DD) | Tanggal SPK dikeluarkan |
| G | `Tgl_Target_Selesai`| Date (YYYY-MM-DD) | Batas waktu pekerjaan selesai |
| H | `Total_Nilai_SPK` | Number | Total pagu biaya perbaikan disetujui |
| I | `Status_SPK` | String | `TERBIT`, `DIKERJAKAN`, `SELESAI`, `DIBATALKAN` |
| J | `Catatan_Teknis` | String | Instruksi spesifik mekanik |

---

## 5. Sheet `vehicles` (Master Armada & Status Servis)

| Kolom | Nama Field | Tipe Data | Keterangan |
|:---|:---|:---|:---|
| A | `Nopol` | String | Nomor Polisi kendaraan |
| B | `Merk_Model` | String | Merk & Model (Toyota Hilux, Triton, dll.) |
| C | `Tahun_Pembuatan` | Number | Tahun perakitan |
| D | `Odometer_Terakhir`| Number | KM terkini |
| E | `Jadwal_Servis_KM` | Number | Jadwal servis berkala berikutnya |
| F | `Status_Operasional`| String | `SIAP_OPERASI`, `PERLU_SERVIS`, `BENGKEL_REPAIR` |
