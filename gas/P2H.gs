/**
 * VAMOS FMS - Daily P2H Module (Pemeriksaan & Perawatan Harian)
 * [P2H-001] Pembuatan Schema Sheet Master & Laporan P2H
 * [P2H-002] Pembuatan RPC Actions p2h.kendaraan.submit
 */

var P2H_MODULE_KEY = 'P2H';
var P2H_SHEET_LAPORAN = 'P2H_Laporan';
var P2H_SHEET_MASTER_KENDARAAN = 'P2H_Kendaraan';

// Definisi ground truth schema header untuk P2H_Laporan
var P2H_LAPORAN_HEADERS = [
  'UID',
  'Tanggal',
  'Observator',
  'Subkon',
  'Merk',
  'Nopol',
  'Jenis',
  'KM_Kendaraan',
  'Status_Kelayakan', // 'FIT' (Layak Operasi) | 'UNFIT' (Perlu Perbaikan)
  'Total_Item_NOK',   // Jumlah item T.Baik
  'Temuan_NOK',       // Daftar item T.Baik (JSON string)
  'Checklist_Data',   // Seluruh 35 checklist item (JSON string)
  'Catatan_Tambahan',
  'Created_At',
  'Created_By'
];

// Master dropdown default (replika mock & fallback jika sheet kosong)
var DEFAULT_P2H_MASTER = {
  subkon: ['INTERNAL', 'PT MAJU JAYA', 'PT TRANS LOGISTIK', 'CV ANUGERAH'],
  kendaraan: [
    { nopol: 'KT 1234 AB', merk: 'Toyota Hilux', jenis: 'Light Vehicle (LV)', subkon: 'INTERNAL' },
    { nopol: 'KT 5678 CD', merk: 'Mitsubishi Triton', jenis: 'Light Vehicle (LV)', subkon: 'INTERNAL' },
    { nopol: 'KT 9012 EF', merk: 'Toyota Hiace', jenis: 'Minibus / Commuter', subkon: 'PT TRANS LOGISTIK' },
    { nopol: 'KT 3456 GH', merk: 'Hino Dutro', jenis: 'Truck / Dump Truck', subkon: 'PT MAJU JAYA' }
  ]
};

/**
 * [P2H-001] Inisialisasi Sheet P2H_Laporan dan P2H_Kendaraan jika belum ada
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function initP2HSheets() {
  var ss;
  try {
    ss = DatabaseRouter.openSpreadsheet(P2H_MODULE_KEY);
  } catch (e) {
    // Jika P2H_SPREADSHEET_ID belum diset, gunakan MASTER spreadsheet
    ss = DatabaseRouter.openSpreadsheet('MASTER');
  }

  var sheetLaporan = ss.getSheetByName(P2H_SHEET_LAPORAN);
  if (!sheetLaporan) {
    sheetLaporan = ss.insertSheet(P2H_SHEET_LAPORAN);
    sheetLaporan.appendRow(P2H_LAPORAN_HEADERS);
    sheetLaporan.getRange(1, 1, 1, P2H_LAPORAN_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1d76db')
      .setFontColor('#ffffff');
    sheetLaporan.setFrozenRows(1);
  }

  var sheetKendaraan = ss.getSheetByName(P2H_SHEET_MASTER_KENDARAAN);
  if (!sheetKendaraan) {
    sheetKendaraan = ss.insertSheet(P2H_SHEET_MASTER_KENDARAAN);
    sheetKendaraan.appendRow(['Nopol', 'Merk', 'Jenis', 'Subkon', 'Status_Aktif']);
    sheetKendaraan.getRange(1, 1, 1, 5)
      .setFontWeight('bold')
      .setBackground('#2c3e50')
      .setFontColor('#ffffff');
    sheetKendaraan.setFrozenRows(1);

    // Isi master data awal
    DEFAULT_P2H_MASTER.kendaraan.forEach(function(k) {
      sheetKendaraan.appendRow([k.nopol, k.merk, k.jenis, k.subkon, 'AKTIF']);
    });
  }

  return {
    laporan: sheetLaporan,
    kendaraan: sheetKendaraan
  };
}

/**
 * [P2H-002] RPC Action: Mengambil data master P2H untuk dropdown & offline cache
 * @returns {Object} JSend response
 */
function handleP2HMasterGet() {
  try {
    var ss;
    try {
      ss = DatabaseRouter.openSpreadsheet(P2H_MODULE_KEY);
    } catch (e) {
      ss = DatabaseRouter.openSpreadsheet('MASTER');
    }

    var sheetKendaraan = ss.getSheetByName(P2H_SHEET_MASTER_KENDARAAN);
    var kendaraanList = [];
    var subkonSet = {};

    if (sheetKendaraan && sheetKendaraan.getLastRow() > 1) {
      var data = sheetKendaraan.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (row[0] && String(row[4]).toUpperCase() !== 'NONAKTIF') {
          kendaraanList.push({
            nopol: String(row[0]).trim().toUpperCase(),
            merk: String(row[1]).trim(),
            jenis: String(row[2]).trim(),
            subkon: String(row[3]).trim()
          });
          if (row[3]) subkonSet[String(row[3]).trim()] = true;
        }
      }
    } else {
      // Fallback ke default master jika sheet belum ada/kosong
      kendaraanList = DEFAULT_P2H_MASTER.kendaraan;
      DEFAULT_P2H_MASTER.subkon.forEach(function(s) { subkonSet[s] = true; });
    }

    return responseSuccess({
      subkon: Object.keys(subkonSet),
      kendaraan: kendaraanList,
      lastSync: new Date().toISOString()
    });

  } catch (err) {
    console.error("[P2H ERROR in handleP2HMasterGet]:", err.message);
    return responseSuccess(DEFAULT_P2H_MASTER); // Failsafe fallback
  }
}

/**
 * [P2H-002] RPC Action: Submit formulir inspeksi kendaraan harian
 * @param {Object} data Payload form P2H
 * @param {string} actor Email pengguna / aktor pengirim
 * @returns {Object} JSend response
 */
function handleP2HKendaraanSubmit(data, actor) {
  // 1. Validasi server-side
  if (!data) {
    return responseError(422, "Data formulir P2H tidak boleh kosong.");
  }

  var nopol = (data.nopol || '').trim().toUpperCase();
  var observator = (data.observator || '').trim();
  var tanggal = (data.tanggal || '').trim();

  if (!nopol) {
    return responseError(422, "Validasi gagal: Nomor Polisi (Nopol) wajib diisi.");
  }
  if (!observator) {
    return responseError(422, "Validasi gagal: Nama Observator wajib diisi.");
  }
  if (!tanggal) {
    return responseError(422, "Validasi gagal: Tanggal inspeksi wajib diisi.");
  }

  var checklist = data.checklist || {};
  var nokList = [];
  var totalItemsChecked = 0;

  // Evaluasi 35 checklist item
  for (var itemKey in checklist) {
    if (Object.prototype.hasOwnProperty.call(checklist, itemKey)) {
      totalItemsChecked++;
      var val = String(checklist[itemKey]).toLowerCase();
      if (val === 't.baik' || val === 'tidak baik' || val === 'false' || val === 'nok') {
        nokList.push(itemKey);
      }
    }
  }

  var statusKelayakan = nokList.length === 0 ? 'FIT' : 'UNFIT';
  var lock = LockService.getScriptLock();

  try {
    // Atomic lock untuk mencegah race condition penomoran UID
    lock.waitLock(10000);

    var now = new Date();
    var datePrefix = Utilities.formatDate(now, "Asia/Jakarta", "yyyyMMdd");
    var randomSuffix = Math.floor(1000 + Math.random() * 9000);
    var uid = "P2H-" + datePrefix + "-" + randomSuffix;

    var recordRow = {
      'UID': uid,
      'Tanggal': tanggal,
      'Observator': sanitizeInput(observator),
      'Subkon': sanitizeInput(data.subkon || ''),
      'Merk': sanitizeInput(data.merk || ''),
      'Nopol': sanitizeInput(nopol),
      'Jenis': sanitizeInput(data.jenis || ''),
      'KM_Kendaraan': data.km_kendaraan || '',
      'Status_Kelayakan': statusKelayakan,
      'Total_Item_NOK': nokList.length,
      'Temuan_NOK': JSON.stringify(nokList),
      'Checklist_Data': JSON.stringify(checklist),
      'Catatan_Tambahan': sanitizeInput(data.catatan || ''),
      'Created_At': now.toISOString(),
      'Created_By': actor || 'ANONYMOUS'
    };

    // Pastikan sheet P2H tersedia
    var sheets = initP2HSheets();
    
    // Simpan baris ke Google Sheets
    var rowValues = P2H_LAPORAN_HEADERS.map(function(header) {
      return recordRow[header] !== undefined ? recordRow[header] : '';
    });
    
    sheets.laporan.appendRow(rowValues);

    // Rekam ke Audit Trail
    recordAuditLog(
      actor || observator, 
      'P2H_SUBMIT', 
      'P2H', 
      { uid: uid, nopol: nopol, status: statusKelayakan, totalNOK: nokList.length }, 
      'SUCCESS'
    );

    return responseSuccess({
      uid: uid,
      nopol: nopol,
      statusKelayakan: statusKelayakan,
      totalNOK: nokList.length,
      temuanNOK: nokList,
      message: statusKelayakan === 'FIT' 
        ? "Laporan P2H berhasil disimpan. Kendaraan dinyatakan LAYAK OPERASI (FIT)."
        : "Laporan P2H berhasil disimpan. Kendaraan dinyatakan PERLU PERBAIKAN (" + nokList.length + " item NOK)."
    });

  } catch (err) {
    console.error("[P2H ERROR in handleP2HKendaraanSubmit]:", err.message);
    return responseError(500, "Gagal menyimpan laporan P2H ke database: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * [P2H-007] RPC Action: Mendapatkan daftar laporan P2H untuk dasbor GA & Supervisor
 * @param {Object} filter { nopol, status, tanggal }
 * @returns {Object} JSend response
 */
function handleP2HReportsList(filter) {
  try {
    var ss;
    try {
      ss = DatabaseRouter.openSpreadsheet(P2H_MODULE_KEY);
    } catch (e) {
      ss = DatabaseRouter.openSpreadsheet('MASTER');
    }

    var sheet = ss.getSheetByName(P2H_SHEET_LAPORAN);
    if (!sheet || sheet.getLastRow() <= 1) {
      return responseSuccess({ reports: [], summary: { total: 0, fit: 0, unfit: 0 } });
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var reports = [];
    var totalFit = 0;
    var totalUnfit = 0;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var reportObj = {};
      for (var h = 0; h < headers.length; h++) {
        reportObj[headers[h]] = row[h];
      }

      var status = String(reportObj['Status_Kelayakan'] || '').toUpperCase();
      if (status === 'FIT') totalFit++;
      if (status === 'UNFIT') totalUnfit++;

      // Filter jika ada parameter pencarian
      if (filter) {
        if (filter.status && status !== String(filter.status).toUpperCase()) continue;
        if (filter.nopol && String(reportObj['Nopol']).indexOf(filter.nopol) === -1) continue;
      }

      reports.push(reportObj);
    }

    return responseSuccess({
      reports: reports.reverse(), // Laporan terbaru di atas
      summary: {
        total: reports.length,
        fit: totalFit,
        unfit: totalUnfit
      }
    });

  } catch (err) {
    console.error("[P2H ERROR in handleP2HReportsList]:", err.message);
    return responseError(500, "Gagal mengambil daftar laporan P2H: " + err.message);
  }
}

/**
 * [P2H-008] RPC Action: Supervisor follow-up temuan NOK kendaraan
 * @param {Object} data { uid, actionStatus, followUpNotes }
 * @param {string} actor
 * @returns {Object} JSend response
 */
function handleP2HFollowUpUpdate(data, actor) {
  if (!data || !data.uid) {
    return responseError(422, "UID laporan P2H diperlukan untuk tindak lanjut.");
  }

  try {
    var ss;
    try {
      ss = DatabaseRouter.openSpreadsheet(P2H_MODULE_KEY);
    } catch (e) {
      ss = DatabaseRouter.openSpreadsheet('MASTER');
    }

    var sheet = ss.getSheetByName(P2H_SHEET_LAPORAN);
    if (!sheet) return responseError(404, "Sheet P2H_Laporan tidak ditemukan.");

    var values = sheet.getDataRange().getValues();
    var uidColIdx = 0; // Header UID di kolom 1 (indeks 0)

    for (var i = 1; i < values.length; i++) {
      if (String(values[i][uidColIdx]) === String(data.uid)) {
        var rowNum = i + 1;
        var newStatus = data.actionStatus || 'PERBAIKAN'; // PERBAIKAN | CLEAR
        var notes = sanitizeInput(data.followUpNotes || '');

        // Update kolom Catatan_Tambahan (indeks 12 -> kolom 13)
        var existingCatatan = String(values[i][12] || '');
        var updatedCatatan = existingCatatan + " | [SPV " + (actor || 'GA') + ": " + newStatus + " - " + notes + "]";
        
        sheet.getRange(rowNum, 13).setValue(updatedCatatan);

        recordAuditLog(
          actor, 
          'P2H_SUPERVISOR_FOLLOWUP', 
          'P2H', 
          { uid: data.uid, status: newStatus, notes: notes }, 
          'SUCCESS'
        );

        return responseSuccess({
          uid: data.uid,
          status: newStatus,
          message: "Tindak lanjut supervisor untuk " + data.uid + " berhasil disimpan."
        });
      }
    }

    return responseError(404, "Laporan P2H dengan UID " + data.uid + " tidak ditemukan.");

  } catch (err) {
    console.error("[P2H ERROR in handleP2HFollowUpUpdate]:", err.message);
    return responseError(500, "Gagal memperbarui tindak lanjut P2H: " + err.message);
  }
}

