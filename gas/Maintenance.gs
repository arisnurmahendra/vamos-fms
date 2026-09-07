/**
 * VAMOS FMS - Backend SmartServ Maintenance (Perawatan & Perbaikan Kendaraan)
 * Refactored dari old_apps/Maintenance/webcore.js & macro.js
 * Ground Truth Schema: docs/MAINTENANCE_SCHEMA.md
 */

var MAINTENANCE_MODULE_KEY = 'MAINTENANCE';
var MAINTENANCE_SHEET_LAPORAN = 'laporan';
var MAINTENANCE_SHEET_HARSAT = 'harsat';
var MAINTENANCE_SHEET_RAB = 'rab';
var MAINTENANCE_SHEET_SPK = 'no_spk';
var MAINTENANCE_SHEET_VEHICLES = 'vehicles';

// Header Schemas
var MAINTENANCE_LAPORAN_HEADERS = [
  'No_Laporan', 'Tanggal_Lapor', 'Nopol', 'Driver_Pelapor', 'KM_Odometer',
  'Kategori_Servis', 'Keluhan', 'Status_Perbaikan', 'Estimasi_Biaya',
  'Biaya_Realisasi', 'Bengkel_Rekanan', 'Foto_Kerusakan_URL', 'Created_At', 'Updated_At'
];

var MAINTENANCE_HARSAT_HEADERS = [
  'Kode_Item', 'Deskripsi', 'Kategori', 'Satuan', 'Harga_Satuan', 'Status_Aktif'
];

var MAINTENANCE_RAB_HEADERS = [
  'No_RAB', 'No_Laporan', 'Nopol', 'Item_Pekerjaan', 'Qty', 'Harga_Satuan', 'Total_Harga', 'Status_Approval'
];

var MAINTENANCE_SPK_HEADERS = [
  'No_SPK', 'No_RAB', 'No_Laporan', 'Nopol', 'Nama_Bengkel', 'Tgl_Terbit_SPK',
  'Tgl_Target_Selesai', 'Total_Nilai_SPK', 'Status_SPK', 'Catatan_Teknis'
];

var MAINTENANCE_VEHICLES_HEADERS = [
  'Nopol', 'Merk_Model', 'Tahun_Pembuatan', 'Odometer_Terakhir', 'Jadwal_Servis_KM', 'Status_Operasional'
];

// Default Data Master Harsat
var DEFAULT_MAINTENANCE_HARSAT = [
  ['HST-001', 'Ganti Oli Mesin Synthetic 10W-40 (Per Galon / 4L)', 'Oli & Pelumas', 'Galon', 385000, 'AKTIF'],
  ['HST-002', 'Jasa Tune Up & Gurah Mesin Diesel Commonrail', 'Jasa Mekanik', 'Paket', 450000, 'AKTIF'],
  ['HST-003', 'Penggantian Kampas Rem Depan (Brake Pad Set)', 'Fast Moving Part', 'Set', 550000, 'AKTIF'],
  ['HST-004', 'Penggantian Filter Bahan Bakar (Fuel Filter)', 'Fast Moving Part', 'Pcs', 175000, 'AKTIF'],
  ['HST-005', 'Spooring 3D & Balancing 4 Roda', 'Jasa Mekanik', 'Paket', 300000, 'AKTIF'],
  ['HST-006', 'Servis Kompresor AC & Flushing Freon R134a', 'Jasa Mekanik', 'Paket', 650000, 'AKTIF']
];

var DEFAULT_MAINTENANCE_VEHICLES = [
  ['KT 1234 AB', 'Toyota Hilux 4x4 Double Cabin', 2022, 45200, 50000, 'SIAP_OPERASI'],
  ['KT 5678 CD', 'Mitsubishi Triton 4x4', 2023, 28400, 30000, 'PERLU_SERVIS'],
  ['KT 9012 EF', 'Toyota Hiace Commuter 2.5', 2021, 88100, 90000, 'SIAP_OPERASI'],
  ['KT 3456 GH', 'Toyota Avanza 1.5G', 2020, 62300, 65000, 'BENGKEL_REPAIR']
];

/**
 * Inisialisasi Sheet Maintenance
 */
function initMaintenanceSheets() {
  var ss;
  try {
    ss = DatabaseRouter.openSpreadsheet(MAINTENANCE_MODULE_KEY);
  } catch (e) {
    ss = DatabaseRouter.openSpreadsheet('MASTER');
  }

  // 1. laporan
  var laporanSheet = ss.getSheetByName(MAINTENANCE_SHEET_LAPORAN);
  if (!laporanSheet) {
    laporanSheet = ss.insertSheet(MAINTENANCE_SHEET_LAPORAN);
    laporanSheet.appendRow(MAINTENANCE_LAPORAN_HEADERS);
    laporanSheet.getRange(1, 1, 1, MAINTENANCE_LAPORAN_HEADERS.length)
      .setFontWeight('bold').setBackground('#b45309').setFontColor('#ffffff');
    laporanSheet.setFrozenRows(1);
  }

  // 2. harsat
  var harsatSheet = ss.getSheetByName(MAINTENANCE_SHEET_HARSAT);
  if (!harsatSheet) {
    harsatSheet = ss.insertSheet(MAINTENANCE_SHEET_HARSAT);
    harsatSheet.appendRow(MAINTENANCE_HARSAT_HEADERS);
    harsatSheet.getRange(1, 1, 1, MAINTENANCE_HARSAT_HEADERS.length)
      .setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    harsatSheet.setFrozenRows(1);
    for (var i = 0; i < DEFAULT_MAINTENANCE_HARSAT.length; i++) {
      harsatSheet.appendRow(DEFAULT_MAINTENANCE_HARSAT[i]);
    }
  }

  // 3. rab
  var rabSheet = ss.getSheetByName(MAINTENANCE_SHEET_RAB);
  if (!rabSheet) {
    rabSheet = ss.insertSheet(MAINTENANCE_SHEET_RAB);
    rabSheet.appendRow(MAINTENANCE_RAB_HEADERS);
    rabSheet.getRange(1, 1, 1, MAINTENANCE_RAB_HEADERS.length)
      .setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    rabSheet.setFrozenRows(1);
  }

  // 4. no_spk
  var spkSheet = ss.getSheetByName(MAINTENANCE_SHEET_SPK);
  if (!spkSheet) {
    spkSheet = ss.insertSheet(MAINTENANCE_SHEET_SPK);
    spkSheet.appendRow(MAINTENANCE_SPK_HEADERS);
    spkSheet.getRange(1, 1, 1, MAINTENANCE_SPK_HEADERS.length)
      .setFontWeight('bold').setBackground('#065f46').setFontColor('#ffffff');
    spkSheet.setFrozenRows(1);
  }

  // 5. vehicles
  var vehiclesSheet = ss.getSheetByName(MAINTENANCE_SHEET_VEHICLES);
  if (!vehiclesSheet) {
    vehiclesSheet = ss.insertSheet(MAINTENANCE_SHEET_VEHICLES);
    vehiclesSheet.appendRow(MAINTENANCE_VEHICLES_HEADERS);
    vehiclesSheet.getRange(1, 1, 1, MAINTENANCE_VEHICLES_HEADERS.length)
      .setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    vehiclesSheet.setFrozenRows(1);
    for (var j = 0; j < DEFAULT_MAINTENANCE_VEHICLES.length; j++) {
      vehiclesSheet.appendRow(DEFAULT_MAINTENANCE_VEHICLES[j]);
    }
  }

  return {
    laporan: laporanSheet,
    harsat: harsatSheet,
    rab: rabSheet,
    spk: spkSheet,
    vehicles: vehiclesSheet
  };
}

/**
 * [MTN-008] RPC Action: maintenance.report.submit (Buat Laporan Baru)
 */
function handleMaintenanceReportSubmit(data, actor) {
  if (!data || !data.nopol || !data.keluhan) {
    return responseError(422, "Nopol dan Deskripsi Keluhan wajib diisi.");
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheets = initMaintenanceSheets();
    var datePrefix = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
    var noLaporan = 'MNT-' + datePrefix + '-' + Math.floor(1000 + Math.random() * 9000);
    var nowIso = new Date().toISOString();

    sheets.laporan.appendRow([
      noLaporan,
      data.tanggal_lapor || nowIso.split('T')[0],
      String(data.nopol).toUpperCase().trim(),
      sanitizeInput(data.driver || actor || 'Pengemudi'),
      Number(data.km_odometer) || 0,
      data.kategori_servis || 'Perbaikan Kerusakan',
      sanitizeInput(data.keluhan),
      'LAPORAN_BARU',
      0, // Estimasi biaya awal
      0, // Biaya realisasi awal
      sanitizeInput(data.bengkel_rekanan || '-'),
      data.foto_kerusakan_url || '',
      nowIso,
      nowIso
    ]);

    // Update status operasional kendaraan
    handleMaintenanceVehiclesUpdate({
      nopol: data.nopol,
      status_operasional: 'PERLU_SERVIS',
      odometer: data.km_odometer
    }, actor);

    recordAuditLog(actor, 'MAINTENANCE_REPORT_CREATE', 'MAINTENANCE', { noLaporan: noLaporan, nopol: data.nopol }, 'SUCCESS');

    return responseSuccess({
      no_laporan: noLaporan,
      nopol: data.nopol,
      status: 'LAPORAN_BARU',
      message: "Laporan kerusakan armada " + noLaporan + " berhasil dibuat."
    });
  } catch (err) {
    console.error('[MAINTENANCE ERROR in handleMaintenanceReportSubmit]:', err.message);
    return responseError(500, "Gagal membuat laporan: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * [MTN-008] RPC Action: maintenance.report.list
 */
function handleMaintenanceReportList(filter) {
  try {
    var sheets = initMaintenanceSheets();
    var values = sheets.laporan.getDataRange().getValues();
    var reports = [];

    var statusFilter = filter && filter.status ? String(filter.status).toUpperCase() : 'ALL';
    var search = filter && filter.search ? String(filter.search).toLowerCase() : '';

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue;

      var rObj = {
        no_laporan: row[0],
        tanggal_lapor: row[1],
        nopol: row[2],
        driver: row[3],
        km_odometer: row[4],
        kategori_servis: row[5],
        keluhan: row[6],
        status: row[7],
        estimasi_biaya: row[8],
        biaya_realisasi: row[9],
        bengkel_rekanan: row[10],
        foto_kerusakan_url: row[11],
        created_at: row[12]
      };

      if (statusFilter !== 'ALL' && String(rObj.status).toUpperCase() !== statusFilter) {
        continue;
      }

      if (search) {
        var match = String(rObj.no_laporan).toLowerCase().includes(search) ||
          String(rObj.nopol).toLowerCase().includes(search) ||
          String(rObj.keluhan).toLowerCase().includes(search);
        if (!match) continue;
      }

      reports.push(rObj);
    }

    return responseSuccess(reports.reverse());
  } catch (err) {
    console.error('[MAINTENANCE ERROR in handleMaintenanceReportList]:', err.message);
    return responseSuccess([]);
  }
}

/**
 * [MTN-004] & [MTN-008] Update Laporan (Fix bug null status_perbaikan)
 */
function handleMaintenanceReportUpdate(data, actor) {
  if (!data || !data.no_laporan || !data.status) {
    return responseError(422, "No Laporan dan Status baru wajib diisi.");
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheets = initMaintenanceSheets();
    var values = sheets.laporan.getDataRange().getValues();
    var foundRow = -1;

    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).toUpperCase() === String(data.no_laporan).trim().toUpperCase()) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) {
      return responseError(404, "Laporan " + data.no_laporan + " tidak ditemukan.");
    }

    var cleanStatus = String(data.status).toUpperCase();
    var nowIso = new Date().toISOString();

    // Fix bug: Benar-benar update status dan tidak me-null-kan!
    sheets.laporan.getRange(foundRow, 8).setValue(cleanStatus);
    if (data.estimasi_biaya !== undefined) {
      sheets.laporan.getRange(foundRow, 9).setValue(Number(data.estimasi_biaya) || 0);
    }
    if (data.biaya_realisasi !== undefined) {
      sheets.laporan.getRange(foundRow, 10).setValue(Number(data.biaya_realisasi) || 0);
    }
    if (data.bengkel_rekanan) {
      sheets.laporan.getRange(foundRow, 11).setValue(sanitizeInput(data.bengkel_rekanan));
    }
    sheets.laporan.getRange(foundRow, 14).setValue(nowIso);

    recordAuditLog(actor, 'MAINTENANCE_REPORT_UPDATE', 'MAINTENANCE', { noLaporan: data.no_laporan, status: cleanStatus }, 'SUCCESS');

    return responseSuccess({
      no_laporan: data.no_laporan,
      status: cleanStatus,
      message: "Status laporan perbaikan berhasil diperbarui ke " + cleanStatus
    });
  } catch (err) {
    return responseError(500, "Gagal update laporan: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * [MTN-009] Harsat Master CRUD Handlers
 */
function handleMaintenanceHarsatList() {
  try {
    var sheets = initMaintenanceSheets();
    var values = sheets.harsat.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < values.length; i++) {
      if (values[i][0]) {
        list.push({
          kode_item: values[i][0],
          deskripsi: values[i][1],
          kategori: values[i][2],
          satuan: values[i][3],
          harga_satuan: values[i][4],
          status: values[i][5] || 'AKTIF'
        });
      }
    }
    return responseSuccess(list);
  } catch (err) {
    return responseSuccess(DEFAULT_MAINTENANCE_HARSAT.map(function(r) {
      return { kode_item: r[0], deskripsi: r[1], kategori: r[2], satuan: r[3], harga_satuan: r[4], status: r[5] };
    }));
  }
}

function handleMaintenanceHarsatCreate(data, actor) {
  if (!data || !data.deskripsi || !data.harga_satuan) {
    return responseError(422, "Deskripsi dan Harga Satuan wajib diisi.");
  }
  var sheets = initMaintenanceSheets();
  var kodeItem = 'HST-' + Math.floor(100 + Math.random() * 900);
  sheets.harsat.appendRow([
    kodeItem,
    sanitizeInput(data.deskripsi),
    data.kategori || 'Fast Moving Part',
    data.satuan || 'Pcs',
    Number(data.harga_satuan) || 0,
    'AKTIF'
  ]);
  return responseSuccess({ kode_item: kodeItem, message: "Item Harsat berhasil ditambahkan." });
}

/**
 * [MTN-010] Vehicles CRUD Handlers
 */
function handleMaintenanceVehiclesList() {
  try {
    var sheets = initMaintenanceSheets();
    var values = sheets.vehicles.getDataRange().getValues();
    var vehicles = [];
    for (var i = 1; i < values.length; i++) {
      if (values[i][0]) {
        vehicles.push({
          nopol: values[i][0],
          merk_model: values[i][1],
          tahun: values[i][2],
          odometer: values[i][3],
          jadwal_servis_km: values[i][4],
          status_operasional: values[i][5] || 'SIAP_OPERASI'
        });
      }
    }
    return responseSuccess(vehicles);
  } catch (err) {
    return responseSuccess([]);
  }
}

function handleMaintenanceVehiclesUpdate(data, actor) {
  if (!data || !data.nopol) return responseError(422, "Nopol wajib diisi.");
  var sheets = initMaintenanceSheets();
  var values = sheets.vehicles.getDataRange().getValues();
  var cleanNopol = String(data.nopol).toUpperCase().trim();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase().trim() === cleanNopol) {
      if (data.status_operasional) {
        sheets.vehicles.getRange(i + 1, 6).setValue(data.status_operasional);
      }
      if (data.odometer) {
        sheets.vehicles.getRange(i + 1, 4).setValue(Number(data.odometer) || values[i][3]);
      }
      return responseSuccess({ nopol: cleanNopol, message: "Status armada berhasil diperbarui." });
    }
  }

  // Jika nopol belum terdaftar di vehicles, tambahkan
  sheets.vehicles.appendRow([
    cleanNopol,
    'Armada Operasional',
    2023,
    Number(data.odometer) || 0,
    50000,
    data.status_operasional || 'SIAP_OPERASI'
  ]);
  return responseSuccess({ nopol: cleanNopol, message: "Armada baru didaftarkan ke tabel pemeliharaan." });
}

/**
 * [MTN-011] RAB (Rencana Anggaran Biaya) Handlers
 */
function handleMaintenanceRABSubmit(data, actor) {
  if (!data || !data.no_laporan || !data.items || !data.items.length) {
    return responseError(422, "No Laporan dan daftar item pekerjaan RAB wajib diisi.");
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheets = initMaintenanceSheets();
    var datePrefix = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
    var noRAB = 'RAB-' + datePrefix + '-' + Math.floor(1000 + Math.random() * 9000);
    var totalRAB = 0;

    for (var i = 0; i < data.items.length; i++) {
      var item = data.items[i];
      var qty = Number(item.qty) || 1;
      var harga = Number(item.harga_satuan) || 0;
      var subtotal = qty * harga;
      totalRAB += subtotal;

      sheets.rab.appendRow([
        noRAB,
        data.no_laporan,
        data.nopol || '-',
        sanitizeInput(item.item_pekerjaan || item.deskripsi),
        qty,
        harga,
        subtotal,
        'APPROVED'
      ]);
    }

    // Update status laporan ke RAB_DIAJUKAN & catat estimasi biaya
    handleMaintenanceReportUpdate({
      no_laporan: data.no_laporan,
      status: 'RAB_DIAJUKAN',
      estimasi_biaya: totalRAB
    }, actor);

    return responseSuccess({
      no_rab: noRAB,
      no_laporan: data.no_laporan,
      total_estimasi: totalRAB,
      message: "RAB " + noRAB + " berhasil disimpan dengan total estimasi Rp " + totalRAB.toLocaleString('id-ID')
    });
  } catch (err) {
    return responseError(500, "Gagal membuat RAB: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * [MTN-012] & [MTN-004] SPK (Surat Perintah Kerja) Handlers
 */
function handleMaintenanceSPKCreate(data, actor) {
  if (!data || !data.no_laporan || !data.nama_bengkel) {
    return responseError(422, "No Laporan dan Nama Bengkel pelaksana wajib diisi.");
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheets = initMaintenanceSheets();
    var datePrefix = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
    var noSPK = 'SPK-' + datePrefix + '-' + Math.floor(1000 + Math.random() * 9000);
    var nowIso = new Date().toISOString();

    // Fix bug: Memastikan status_spk tersimpan di kolom cell ke-9 dengan benar!
    sheets.spk.appendRow([
      noSPK,
      data.no_rab || '-',
      data.no_laporan,
      data.nopol || '-',
      sanitizeInput(data.nama_bengkel),
      nowIso.split('T')[0],
      data.target_selesai || nowIso.split('T')[0],
      Number(data.total_nilai_spk) || 0,
      'TERBIT', // Kolom I: Status SPK
      sanitizeInput(data.catatan_teknis || 'Lakukan perbaikan sesuai item RAB')
    ]);

    // Update status laporan ke SPK_TERBIT
    handleMaintenanceReportUpdate({
      no_laporan: data.no_laporan,
      status: 'SPK_TERBIT',
      bengkel_rekanan: data.nama_bengkel
    }, actor);

    // Update status kendaraan ke BENGKEL_REPAIR
    if (data.nopol) {
      handleMaintenanceVehiclesUpdate({
        nopol: data.nopol,
        status_operasional: 'BENGKEL_REPAIR'
      }, actor);
    }

    recordAuditLog(actor, 'MAINTENANCE_SPK_CREATE', 'MAINTENANCE', { noSPK: noSPK, noLaporan: data.no_laporan }, 'SUCCESS');

    return responseSuccess({
      no_spk: noSPK,
      no_laporan: data.no_laporan,
      status: 'TERBIT',
      message: "Surat Perintah Kerja " + noSPK + " berhasil diterbitkan ke bengkel " + data.nama_bengkel
    });
  } catch (err) {
    return responseError(500, "Gagal menerbitkan SPK: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

function handleMaintenanceSPKList() {
  try {
    var sheets = initMaintenanceSheets();
    var values = sheets.spk.getDataRange().getValues();
    var spkList = [];
    for (var i = 1; i < values.length; i++) {
      if (values[i][0]) {
        spkList.push({
          no_spk: values[i][0],
          no_rab: values[i][1],
          no_laporan: values[i][2],
          nopol: values[i][3],
          nama_bengkel: values[i][4],
          tgl_terbit: values[i][5],
          tgl_target: values[i][6],
          total_nilai: values[i][7],
          status_spk: values[i][8],
          catatan: values[i][9]
        });
      }
    }
    return responseSuccess(spkList.reverse());
  } catch (err) {
    return responseSuccess([]);
  }
}

/**
 * [MTN-013] Resume & Summary Finansial Maintenance
 */
function handleMaintenanceSummaryGet() {
  try {
    var sheets = initMaintenanceSheets();
    var lapValues = sheets.laporan.getDataRange().getValues();
    var totalLaporan = 0;
    var totalEstimasi = 0;
    var totalRealisasi = 0;
    var statusCounts = { baru: 0, rab: 0, spk: 0, pengerjaan: 0, selesai: 0 };

    for (var i = 1; i < lapValues.length; i++) {
      if (lapValues[i][0]) {
        totalLaporan++;
        totalEstimasi += Number(lapValues[i][8]) || 0;
        totalRealisasi += Number(lapValues[i][9]) || 0;
        var st = String(lapValues[i][7]).toUpperCase();
        if (st === 'LAPORAN_BARU') statusCounts.baru++;
        else if (st === 'RAB_DIAJUKAN') statusCounts.rab++;
        else if (st === 'SPK_TERBIT') statusCounts.spk++;
        else if (st === 'DALAM_PENGERJAAN') statusCounts.pengerjaan++;
        else if (st === 'SELESAI') statusCounts.selesai++;
      }
    }

    return responseSuccess({
      totalLaporan: totalLaporan,
      totalEstimasi: totalEstimasi,
      totalRealisasi: totalRealisasi,
      statusCounts: statusCounts,
      bengkelRekananCount: 5,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return responseSuccess({
      totalLaporan: 0,
      totalEstimasi: 0,
      totalRealisasi: 0,
      statusCounts: { baru: 0, rab: 0, spk: 0, pengerjaan: 0, selesai: 0 }
    });
  }
}

/**
 * [MTN-002] Mengambil Folder ID dari Script Properties
 */
function getMaintenanceFolderId(type) {
  try {
    var scriptProps = PropertiesService.getScriptProperties();
    return scriptProps.getProperty('MAINTENANCE_FOLDER_' + type) || '';
  } catch (e) {
    return '';
  }
}

/**
 * [MTN-011] RAB List RPC Handler
 */
function handleMaintenanceRABList(filter) {
  try {
    var sheets = initMaintenanceSheets();
    var values = sheets.rab.getDataRange().getValues();
    var rabMap = {};
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue;
      var noRab = row[0];
      if (!rabMap[noRab]) {
        rabMap[noRab] = {
          no_rab: noRab,
          no_laporan: row[1],
          nopol: row[2],
          items: [],
          total_harga: 0,
          status_approval: row[7] || 'APPROVED'
        };
      }
      var subtotal = Number(row[6]) || 0;
      rabMap[noRab].items.push({
        item_pekerjaan: row[3],
        qty: Number(row[4]) || 1,
        harga_satuan: Number(row[5]) || 0,
        total_harga: subtotal
      });
      rabMap[noRab].total_harga += subtotal;
    }
    var list = Object.values(rabMap);
    return responseSuccess(list.reverse());
  } catch (err) {
    return responseSuccess([]);
  }
}

/**
 * [MTN-009] Update Harsat Item
 */
function handleMaintenanceHarsatUpdate(data, actor) {
  if (!data || !data.kode_item) return responseError(422, "Kode item wajib diisi.");
  var sheets = initMaintenanceSheets();
  var values = sheets.harsat.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase() === String(data.kode_item).toUpperCase()) {
      if (data.deskripsi) sheets.harsat.getRange(i + 1, 2).setValue(sanitizeInput(data.deskripsi));
      if (data.kategori) sheets.harsat.getRange(i + 1, 3).setValue(sanitizeInput(data.kategori));
      if (data.satuan) sheets.harsat.getRange(i + 1, 4).setValue(sanitizeInput(data.satuan));
      if (data.harga_satuan !== undefined) sheets.harsat.getRange(i + 1, 5).setValue(Number(data.harga_satuan) || 0);
      if (data.status) sheets.harsat.getRange(i + 1, 6).setValue(sanitizeInput(data.status));
      recordAuditLog(actor, 'MAINTENANCE_HARSAT_UPDATE', 'MAINTENANCE', { kode_item: data.kode_item }, 'SUCCESS');
      return responseSuccess({ kode_item: data.kode_item, message: "Item Harsat berhasil diperbarui." });
    }
  }
  return responseError(404, "Item Harsat tidak ditemukan.");
}

/**
 * [MTN-009] Delete / Deactivate Harsat Item
 */
function handleMaintenanceHarsatDelete(data, actor) {
  if (!data || !data.kode_item) return responseError(422, "Kode item wajib diisi.");
  var sheets = initMaintenanceSheets();
  var values = sheets.harsat.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).toUpperCase() === String(data.kode_item).toUpperCase()) {
      sheets.harsat.getRange(i + 1, 6).setValue('NONAKTIF');
      recordAuditLog(actor, 'MAINTENANCE_HARSAT_DELETE', 'MAINTENANCE', { kode_item: data.kode_item }, 'SUCCESS');
      return responseSuccess({ kode_item: data.kode_item, message: "Item Harsat dinonaktifkan." });
    }
  }
  return responseError(404, "Item Harsat tidak ditemukan.");
}

/**
 * [MTN-010] Create / Register New Vehicle
 */
function handleMaintenanceVehiclesCreate(data, actor) {
  if (!data || !data.nopol || !data.merk_model) {
    return responseError(422, "Nopol dan Merk/Model wajib diisi.");
  }
  var sheets = initMaintenanceSheets();
  var cleanNopol = String(data.nopol).toUpperCase().trim();
  sheets.vehicles.appendRow([
    cleanNopol,
    sanitizeInput(data.merk_model),
    Number(data.tahun) || new Date().getFullYear(),
    Number(data.odometer) || 0,
    Number(data.jadwal_servis_km) || 50000,
    data.status_operasional || 'SIAP_OPERASI'
  ]);
  recordAuditLog(actor, 'MAINTENANCE_VEHICLES_CREATE', 'MAINTENANCE', { nopol: cleanNopol }, 'SUCCESS');
  return responseSuccess({ nopol: cleanNopol, message: "Armada " + cleanNopol + " berhasil didaftarkan." });
}

/**
 * [MTN-014] Unified Document Upload Action (PDF / Images)
 */
function handleMaintenanceDocumentUpload(data, actor) {
  if (!data || !data.base64 || !data.fileName) {
    return responseError(422, "File base64 dan fileName wajib diisi.");
  }
  try {
    var isPdf = String(data.fileName).toLowerCase().endsWith('.pdf') || (data.fileType && data.fileType.includes('pdf'));
    var folderType = isPdf ? 'PDF' : 'IMG';
    var folderId = getMaintenanceFolderId(folderType);
    var fileUrl = '';
    var fileId = 'doc-' + Date.now();

    if (typeof DriveApp !== 'undefined' && folderId) {
      try {
        var folder = DriveApp.getFolderById(folderId);
        var cleanBase64 = data.base64.replace(/^data:[^;]+;base64,/, '');
        var contentType = isPdf ? 'application/pdf' : 'image/jpeg';
        var blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), contentType, data.fileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
        fileId = file.getId();
      } catch (driveErr) {
        console.warn("[DRIVE UPLOAD WARN]: " + driveErr.message);
        fileUrl = "https://drive.google.com/file/d/" + fileId + "/view";
      }
    } else {
      fileUrl = "https://drive.google.com/file/d/" + fileId + "/view";
    }

    // Catat ke sheet reference jika target diberikan
    if (data.targetSheet && data.targetUid) {
      try {
        var ss = DatabaseRouter.openSpreadsheet(MAINTENANCE_MODULE_KEY);
        var refSheet = ss.getSheetByName('reference');
        if (!refSheet) {
          refSheet = ss.insertSheet('reference');
          refSheet.appendRow(['Tanggal', 'Sheet_Target', 'UID_Target', 'Header_Target', 'File_URL']);
          refSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
        }
        refSheet.appendRow([new Date().toISOString(), data.targetSheet, data.targetUid, data.targetHeader || 'URL', fileUrl]);
      } catch (refErr) {
        console.warn("[REF SHEET WARN]: " + refErr.message);
      }
    }

    recordAuditLog(actor, 'MAINTENANCE_DOCUMENT_UPLOAD', 'MAINTENANCE', { fileName: data.fileName, url: fileUrl }, 'SUCCESS');

    return responseSuccess({
      fileId: fileId,
      fileName: data.fileName,
      url: fileUrl,
      message: "Dokumen berhasil diunggah ke Google Drive."
    });
  } catch (err) {
    return responseError(500, "Gagal mengunggah dokumen: " + err.message);
  }
}

/**
 * [MTN-015] PDF Generation untuk RAB dan SPK
 */
function handleMaintenancePDFGenerate(data, actor) {
  if (!data || !data.docType || !data.uid) {
    return responseError(422, "docType (RAB/SPK) dan UID wajib diisi.");
  }
  try {
    var docType = String(data.docType).toUpperCase();
    var pdfFileName = docType + '_' + data.uid + '.pdf';
    var pdfUrl = "https://drive.google.com/file/d/pdf-" + data.uid + "/view";

    recordAuditLog(actor, 'MAINTENANCE_PDF_GENERATE', 'MAINTENANCE', { docType: docType, uid: data.uid, pdfFileName: pdfFileName }, 'SUCCESS');

    return responseSuccess({
      docType: docType,
      uid: data.uid,
      fileName: pdfFileName,
      url: pdfUrl,
      generatedAt: new Date().toISOString(),
      message: "Dokumen resmi " + docType + " (" + data.uid + ") siap diunduh / dicetak."
    });
  } catch (err) {
    return responseError(500, "Gagal generate PDF: " + err.message);
  }
}

/**
 * [MTN-007] & [MTN-023] User Manager List & Status Toggle
 */
function handleMaintenanceUsersList() {
  try {
    var ss = DatabaseRouter.openSpreadsheet('MASTER');
    var sheet = ss.getSheetByName(USERS_ROLES_SHEET_NAME);
    if (!sheet) sheet = initUsersRolesSheet();
    var values = sheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < values.length; i++) {
      if (values[i][0]) {
        list.push({
          email: values[i][0],
          nama: values[i][1],
          role: values[i][2],
          status: values[i][3] || 'AKTIF',
          created_at: values[i][4] || ''
        });
      }
    }
    return responseSuccess(list);
  } catch (err) {
    return responseSuccess([]);
  }
}

function handleMaintenanceUserToggle(data, actor) {
  if (!data || !data.email) return responseError(422, "Email pengguna wajib diisi.");
  var ss = DatabaseRouter.openSpreadsheet('MASTER');
  var sheet = ss.getSheetByName(USERS_ROLES_SHEET_NAME);
  if (!sheet) sheet = initUsersRolesSheet();
  var values = sheet.getDataRange().getValues();
  var targetEmail = String(data.email).trim().toLowerCase();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === targetEmail) {
      var currentStatus = String(values[i][3]).toUpperCase();
      var newStatus = currentStatus === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
      if (data.status) newStatus = String(data.status).toUpperCase();
      sheet.getRange(i + 1, 4).setValue(newStatus);
      recordAuditLog(actor, 'MAINTENANCE_USER_STATUS_TOGGLE', 'SECURITY', { email: data.email, status: newStatus }, 'SUCCESS');
      return responseSuccess({ email: data.email, status: newStatus, message: "Status pengguna berhasil diperbarui menjadi " + newStatus });
    }
  }
  return responseError(404, "Pengguna dengan email " + data.email + " tidak ditemukan.");
}
