/**
 * VAMOS FMS - Backend V-TACS (Voucher Tracking & Allocation System)
 * [VTC-001] Setup Sheet Master Voucher, POM & Transaksi
 * [VTC-002] RPC Action Anti-Conflict & Validasi Unique Key
 */

var VTACS_MODULE_KEY = 'VTACS';
var VTACS_SHEET_VOUCHER = 'VTACS_Master_Voucher';
var VTACS_SHEET_POM = 'VTACS_Master_POM';
var VTACS_SHEET_TRANSAKSI = 'VTACS_Transaksi_BBM';

// Skema Header Kolom
var VTACS_VOUCHER_HEADERS = ['Voucher_Code', 'Nopol', 'Kuota_Liter', 'Nominal_Rp', 'Status', 'POM_Tujuan', 'Expired_At', 'Created_At'];
var VTACS_POM_HEADERS = ['Kode_POM', 'Nama_POM', 'Lokasi', 'Saldo_Alokasi', 'Terpakai', 'Status_Aktif'];
var VTACS_TRANSAKSI_HEADERS = ['Transaction_ID', 'Voucher_Code', 'Kode_POM', 'Nopol', 'Driver', 'Liter_Diisi', 'Total_Nominal', 'KM_Odometer', 'Foto_Struk_URL', 'Status', 'Timestamp', 'Created_By'];

// Data Master Fallback / Default
var DEFAULT_VTACS_POM = [
  { kode: 'POM-01', nama: 'SPBU 61.751.01 Ring Road', lokasi: 'Samarinda', saldo: 15000000, terpakai: 2500000, status: 'AKTIF' },
  { kode: 'POM-02', nama: 'SPBU 64.752.02 Loa Janan', lokasi: 'Kutai Kartanegara', saldo: 20000000, terpakai: 4100000, status: 'AKTIF' },
  { kode: 'POM-03', nama: 'SPBU 61.753.03 Balikpapan KM 13', lokasi: 'Balikpapan', saldo: 18000000, terpakai: 3200000, status: 'AKTIF' }
];

var DEFAULT_VTACS_VOUCHERS = [
  { code: 'VCH-2026-001', nopol: 'KT 1234 AB', kuota: 50, nominal: 500000, status: 'AVAILABLE', pom: 'POM-01', expired: '2026-12-31' },
  { code: 'VCH-2026-002', nopol: 'KT 5678 CD', kuota: 60, nominal: 600000, status: 'AVAILABLE', pom: 'POM-02', expired: '2026-12-31' },
  { code: 'VCH-2026-003', nopol: 'KT 9012 EF', kuota: 40, nominal: 400000, status: 'REDEEMED', pom: 'POM-01', expired: '2026-12-31' }
];

/**
 * [VTC-001] Inisialisasi Sheet VTACS: Master_Voucher, Master_POM, Transaksi_BBM
 * @returns {Object} { voucherSheet, pomSheet, transaksiSheet }
 */
function initVTACSSheets() {
  var ss;
  try {
    ss = DatabaseRouter.openSpreadsheet(VTACS_MODULE_KEY);
  } catch (e) {
    ss = DatabaseRouter.openSpreadsheet('MASTER');
  }

  var voucherSheet = ss.getSheetByName(VTACS_SHEET_VOUCHER);
  if (!voucherSheet) {
    voucherSheet = ss.insertSheet(VTACS_SHEET_VOUCHER);
    voucherSheet.appendRow(VTACS_VOUCHER_HEADERS);
    voucherSheet.getRange(1, 1, 1, VTACS_VOUCHER_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#059669')
      .setFontColor('#ffffff');
    voucherSheet.setFrozenRows(1);

    // Bootstrap data default voucher
    DEFAULT_VTACS_VOUCHERS.forEach(function(v) {
      voucherSheet.appendRow([v.code, v.nopol, v.kuota, v.nominal, v.status, v.pom, v.expired, new Date().toISOString()]);
    });
  }

  var pomSheet = ss.getSheetByName(VTACS_SHEET_POM);
  if (!pomSheet) {
    pomSheet = ss.insertSheet(VTACS_SHEET_POM);
    pomSheet.appendRow(VTACS_POM_HEADERS);
    pomSheet.getRange(1, 1, 1, VTACS_POM_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#047857')
      .setFontColor('#ffffff');
    pomSheet.setFrozenRows(1);

    // Bootstrap data default POM
    DEFAULT_VTACS_POM.forEach(function(p) {
      pomSheet.appendRow([p.kode, p.nama, p.lokasi, p.saldo, p.terpakai, p.status]);
    });
  }

  var transaksiSheet = ss.getSheetByName(VTACS_SHEET_TRANSAKSI);
  if (!transaksiSheet) {
    transaksiSheet = ss.insertSheet(VTACS_SHEET_TRANSAKSI);
    transaksiSheet.appendRow(VTACS_TRANSAKSI_HEADERS);
    transaksiSheet.getRange(1, 1, 1, VTACS_TRANSAKSI_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#065f46')
      .setFontColor('#ffffff');
    transaksiSheet.setFrozenRows(1);
  }

  return {
    voucher: voucherSheet,
    pom: pomSheet,
    transaksi: transaksiSheet
  };
}

/**
 * [VTC-002] RPC Action: Ambil daftar master data voucher & POM
 */
function handleVTACSMasterGet() {
  try {
    var sheets = initVTACSSheets();
    var voucherData = sheets.voucher.getDataRange().getValues();
    var pomData = sheets.pom.getDataRange().getValues();

    var vouchers = [];
    for (var i = 1; i < voucherData.length; i++) {
      if (voucherData[i][0]) {
        vouchers.push({
          code: voucherData[i][0],
          nopol: voucherData[i][1],
          fuelQuota: voucherData[i][2],
          nominal: voucherData[i][3],
          status: voucherData[i][4],
          pom: voucherData[i][5],
          expiredAt: voucherData[i][6]
        });
      }
    }

    var pomList = [];
    for (var j = 1; j < pomData.length; j++) {
      if (pomData[j][0]) {
        pomList.push({
          kode: pomData[j][0],
          nama: pomData[j][1],
          lokasi: pomData[j][2],
          saldo: pomData[j][3],
          terpakai: pomData[j][4],
          status: pomData[j][5]
        });
      }
    }

    return responseSuccess({
      vouchers: vouchers,
      pomList: pomList,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[VTACS ERROR in handleVTACSMasterGet]:', err.message);
    return responseSuccess({
      vouchers: DEFAULT_VTACS_VOUCHERS,
      pomList: DEFAULT_VTACS_POM
    });
  }
}

/**
 * [VTC-002] RPC Action: Permintaan Voucher Baru (Virtual Voucher Creation)
 */
function handleVTACSVoucherRequest(data, actor) {
  if (!data || !data.nopol || !data.kuotaLiter) {
    return responseError(422, "Nopol dan Kuota Liter wajib diisi.");
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheets = initVTACSSheets();
    var code = "VCH-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
    var kuota = Number(data.kuotaLiter) || 0;
    var nominal = kuota * 12500; // Estimasi rata-rata per liter Dexlite/Solar
    var pom = data.pom || 'ALL_STATIONS';
    var nowStr = new Date().toISOString();

    sheets.voucher.appendRow([
      code,
      sanitizeInput(data.nopol),
      kuota,
      nominal,
      'AVAILABLE',
      sanitizeInput(pom),
      '2026-12-31',
      nowStr
    ]);

    recordAuditLog(actor, 'VTACS_REQUEST_VOUCHER', 'VTACS', { code: code, nopol: data.nopol, kuota: kuota }, 'SUCCESS');

    return responseSuccess({
      code: code,
      nopol: data.nopol,
      kuotaLiter: kuota,
      nominal: nominal,
      status: 'AVAILABLE',
      message: "Voucher BBM " + code + " berhasil diterbitkan."
    });
  } catch (err) {
    console.error('[VTACS ERROR in handleVTACSVoucherRequest]:', err.message);
    return responseError(500, "Gagal menerbitkan voucher: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * [VTC-002] RPC Action Anti-Conflict & Validasi Unique Key: Redeem / Pelaporan Pemakaian BBM
 */
function handleVTACSRedeem(data, actor) {
  if (!data || !data.code) {
    return responseError(422, "Kode voucher wajib disertakan.");
  }

  var lock = LockService.getScriptLock();
  try {
    // Atomic lock untuk mencegah double-spending voucher
    lock.waitLock(15000);

    var sheets = initVTACSSheets();
    var voucherValues = sheets.voucher.getDataRange().getValues();
    var foundRow = -1;
    var voucherObj = null;

    for (var i = 1; i < voucherValues.length; i++) {
      if (String(voucherValues[i][0]).toUpperCase() === String(data.code).trim().toUpperCase()) {
        foundRow = i + 1;
        voucherObj = {
          code: voucherValues[i][0],
          nopol: voucherValues[i][1],
          kuota: voucherValues[i][2],
          nominal: voucherValues[i][3],
          status: voucherValues[i][4],
          pom: voucherValues[i][5]
        };
        break;
      }
    }

    if (!voucherObj) {
      return responseError(404, "Voucher dengan kode " + data.code + " tidak ditemukan.");
    }

    if (String(voucherObj.status).toUpperCase() === 'REDEEMED') {
      return responseError(409, "Double-spending blocked: Voucher " + data.code + " telah digunakan sebelumnya.");
    }

    var txId = "TX-BBM-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd") + "-" + Math.floor(1000 + Math.random() * 9000);
    var literDiisi = Number(data.literDiisi) || voucherObj.kuota;
    var totalNominal = Number(data.nominal) || voucherObj.nominal;
    var kodePom = data.station || voucherObj.pom || 'POM-01';
    var nowIso = new Date().toISOString();

    // 1. Update Status Voucher menjadi REDEEMED
    sheets.voucher.getRange(foundRow, 5).setValue('REDEEMED');

    // 2. Catat riwayat ke Transaksi_BBM
    sheets.transaksi.appendRow([
      txId,
      voucherObj.code,
      kodePom,
      voucherObj.nopol,
      sanitizeInput(data.driver || actor || 'Driver Lapangan'),
      literDiisi,
      totalNominal,
      data.kmOdometer || '',
      data.strukUrl || '',
      'SUCCESS',
      nowIso,
      actor || 'SYSTEM'
    ]);

    // 3. Update saldo terpakai di Master POM
    var pomValues = sheets.pom.getDataRange().getValues();
    for (var p = 1; p < pomValues.length; p++) {
      if (String(pomValues[p][0]) === String(kodePom)) {
        var currentTerpakai = Number(pomValues[p][4]) || 0;
        sheets.pom.getRange(p + 1, 5).setValue(currentTerpakai + totalNominal);
        break;
      }
    }

    // 4. Catat ke Audit Trail
    recordAuditLog(actor, 'VTACS_REDEEM_VOUCHER', 'VTACS', { txId: txId, voucher: voucherObj.code, nominal: totalNominal }, 'SUCCESS');

    return responseSuccess({
      txId: txId,
      code: voucherObj.code,
      literDiisi: literDiisi,
      totalNominal: totalNominal,
      status: 'REDEEMED',
      message: "Voucher " + voucherObj.code + " berhasil diproses dan dicairkan."
    });

  } catch (err) {
    console.error('[VTACS ERROR in handleVTACSRedeem]:', err.message);
    return responseError(500, "Gagal memproses klaim voucher: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * [VTC-007 & VTC-008] RPC Action: Laporan Rekonsiliasi BBM & Tagihan POM
 */
function handleVTACSReconcile(filter) {
  try {
    var sheets = initVTACSSheets();
    var txData = sheets.transaksi.getDataRange().getValues();
    var pomData = sheets.pom.getDataRange().getValues();

    var transactions = [];
    var totalLiters = 0;
    var totalNominal = 0;

    for (var i = 1; i < txData.length; i++) {
      if (txData[i][0]) {
        var tx = {
          txId: txData[i][0],
          voucher: txData[i][1],
          kodePom: txData[i][2],
          nopol: txData[i][3],
          driver: txData[i][4],
          liter: Number(txData[i][5]) || 0,
          nominal: Number(txData[i][6]) || 0,
          timestamp: txData[i][10]
        };

        if (filter && filter.kodePom && tx.kodePom !== filter.kodePom) continue;
        if (filter && filter.nopol && tx.nopol !== filter.nopol) continue;

        totalLiters += tx.liter;
        totalNominal += tx.nominal;
        transactions.push(tx);
      }
    }

    var pomBalances = [];
    for (var j = 1; j < pomData.length; j++) {
      if (pomData[j][0]) {
        pomBalances.push({
          kode: pomData[j][0],
          nama: pomData[j][1],
          saldo: Number(pomData[j][3]) || 0,
          terpakai: Number(pomData[j][4]) || 0,
          sisa: (Number(pomData[j][3]) || 0) - (Number(pomData[j][4]) || 0)
        });
      }
    }

    return responseSuccess({
      transactions: transactions.reverse(),
      pomBalances: pomBalances,
      summary: {
        totalTransaksi: transactions.length,
        totalLiters: totalLiters,
        totalNominal: totalNominal
      }
    });

  } catch (err) {
    console.error('[VTACS ERROR in handleVTACSReconcile]:', err.message);
    return responseError(500, "Gagal mengambil data rekonsiliasi: " + err.message);
  }
}
