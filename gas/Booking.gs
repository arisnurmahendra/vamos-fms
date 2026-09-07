/**
 * VAMOS FMS - Backend Booking (Peminjaman Kendaraan Roda 4)
 * Refactored dari old_apps/Booking/Code.js (3.097 baris monolith)
 * Ground Truth Schema: docs/BOOKING_SCHEMA.md
 * State Machine: docs/BOOKING_APPROVAL_FLOW.md
 */

var BOOKING_MODULE_KEY = 'BOOKING';
var BOOKING_SHEET_DATADB = 'datadb';
var BOOKING_SHEET_NOPOL = 'nopol';
var BOOKING_SHEET_USER = 'user';
var BOOKING_SHEET_ATASAN = 'atasan_wa';
var BOOKING_SHEET_OUTBOX = 'WA_Outbox';

// Canonical Schema Headers
var BOOKING_DATADB_HEADERS = [
  'UID', 'Nopol', 'Peminjam', 'NDK', 'Tanggal_Pinjam', 'Jam_Pinjam',
  'Tanggal_Kembali', 'Jam_Kembali', 'Keperluan', 'Jenis_Keperluan',
  'Lokasi_Tujuan', 'Driver', 'Atasan_1', 'Atasan_2', 'Status',
  'KM_Keluar', 'BBM_Keluar', 'Kondisi_Keluar', 'Petugas_Keluar', 'Tgl_Keluar',
  'KM_Masuk', 'BBM_Masuk', 'Kondisi_Masuk', 'Petugas_Masuk', 'Tgl_Masuk',
  'Catatan_Admin', 'Created_At', 'Updated_At'
];

var BOOKING_NOPOL_HEADERS = ['Nopol', 'Unit', 'Jenis_Unit', 'Status_Aktif'];
var BOOKING_USER_HEADERS = ['Nama', 'NDK', 'Departemen', 'No_WA', 'Signature_URL'];
var BOOKING_ATASAN_HEADERS = ['Nama_Atasan', 'Jabatan', 'No_WA', 'Status_Aktif'];
var BOOKING_OUTBOX_HEADERS = ['Message_ID', 'Module', 'Target_WA', 'Message_Body', 'Status', 'Retry_Count', 'Created_At', 'Sent_At'];

// Default Seed Data
var DEFAULT_BOOKING_NOPOL = [
  ['KT 1234 AB', 'Operasional Site', 'Toyota Hilux 4x4 Double Cabin', 'AKTIF'],
  ['KT 5678 CD', 'Management Site', 'Mitsubishi Triton 4x4', 'AKTIF'],
  ['KT 9012 EF', 'HSE / Safety Patrol', 'Toyota Hilux Single Cabin', 'AKTIF'],
  ['KT 3456 GH', 'General Affairs', 'Toyota Avanza 1.5G', 'AKTIF']
];

var DEFAULT_BOOKING_USER = [
  ['Budi Santoso', 'NPK-10021', 'Engineering', '6281234567890', ''],
  ['Agus Prayitno', 'NPK-10022', 'Operasional', '6281234567891', ''],
  ['Siti Aminah', 'NPK-10023', 'HSE Safety', '6281234567892', '']
];

var DEFAULT_BOOKING_ATASAN = [
  ['Ir. Bambang Wijaya', 'Site Manager (SM)', '628119988771', 'AKTIF'],
  ['Rahmat Hidayat', 'General Services Head (GS)', '628119988772', 'AKTIF'],
  ['Dwi Prasetyo', 'Kepala Pool Kendaraan', '628119988773', 'AKTIF']
];

/**
 * Inisialisasi Database Sheet Booking
 */
function initBookingSheets() {
  var ss;
  try {
    ss = DatabaseRouter.openSpreadsheet(BOOKING_MODULE_KEY);
  } catch (e) {
    ss = DatabaseRouter.openSpreadsheet('MASTER');
  }

  // 1. datadb
  var datadbSheet = ss.getSheetByName(BOOKING_SHEET_DATADB);
  if (!datadbSheet) {
    datadbSheet = ss.insertSheet(BOOKING_SHEET_DATADB);
    datadbSheet.appendRow(BOOKING_DATADB_HEADERS);
    datadbSheet.getRange(1, 1, 1, BOOKING_DATADB_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1e3a8a')
      .setFontColor('#ffffff');
    datadbSheet.setFrozenRows(1);
  }

  // 2. nopol
  var nopolSheet = ss.getSheetByName(BOOKING_SHEET_NOPOL);
  if (!nopolSheet) {
    nopolSheet = ss.insertSheet(BOOKING_SHEET_NOPOL);
    nopolSheet.appendRow(BOOKING_NOPOL_HEADERS);
    nopolSheet.getRange(1, 1, 1, BOOKING_NOPOL_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    nopolSheet.setFrozenRows(1);
    for (var i = 0; i < DEFAULT_BOOKING_NOPOL.length; i++) {
      nopolSheet.appendRow(DEFAULT_BOOKING_NOPOL[i]);
    }
  }

  // 3. user
  var userSheet = ss.getSheetByName(BOOKING_SHEET_USER);
  if (!userSheet) {
    userSheet = ss.insertSheet(BOOKING_SHEET_USER);
    userSheet.appendRow(BOOKING_USER_HEADERS);
    userSheet.getRange(1, 1, 1, BOOKING_USER_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    userSheet.setFrozenRows(1);
    for (var j = 0; j < DEFAULT_BOOKING_USER.length; j++) {
      userSheet.appendRow(DEFAULT_BOOKING_USER[j]);
    }
  }

  // 4. atasan_wa
  var atasanSheet = ss.getSheetByName(BOOKING_SHEET_ATASAN);
  if (!atasanSheet) {
    atasanSheet = ss.insertSheet(BOOKING_SHEET_ATASAN);
    atasanSheet.appendRow(BOOKING_ATASAN_HEADERS);
    atasanSheet.getRange(1, 1, 1, BOOKING_ATASAN_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    atasanSheet.setFrozenRows(1);
    for (var k = 0; k < DEFAULT_BOOKING_ATASAN.length; k++) {
      atasanSheet.appendRow(DEFAULT_BOOKING_ATASAN[k]);
    }
  }

  // 5. WA_Outbox
  var outboxSheet = ss.getSheetByName(BOOKING_SHEET_OUTBOX);
  if (!outboxSheet) {
    outboxSheet = ss.insertSheet(BOOKING_SHEET_OUTBOX);
    outboxSheet.appendRow(BOOKING_OUTBOX_HEADERS);
    outboxSheet.getRange(1, 1, 1, BOOKING_OUTBOX_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#065f46')
      .setFontColor('#ffffff');
    outboxSheet.setFrozenRows(1);
  }

  return {
    datadb: datadbSheet,
    nopol: nopolSheet,
    user: userSheet,
    atasan: atasanSheet,
    outbox: outboxSheet
  };
}

/**
 * Normalisasi nomor polisi (B1234ABC -> B 1234 ABC)
 */
function normalizeNopolString(nopol) {
  if (!nopol) return '';
  return String(nopol).toUpperCase().replace(/\s+/g, ' ').trim();
}

/**
 * Normalisasi nomor telepon WhatsApp (0812... -> 62812...)
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  var clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.substring(1);
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Mengambil master data booking (Nopol, Users, Approver)
 */
function handleBookingMasterGet() {
  try {
    var sheets = initBookingSheets();
    
    // Nopol
    var nopolData = sheets.nopol.getDataRange().getValues();
    var nopolList = [];
    for (var i = 1; i < nopolData.length; i++) {
      if (nopolData[i][0]) {
        nopolList.push({
          nopol: nopolData[i][0],
          unit: nopolData[i][1],
          jenis: nopolData[i][2],
          status: nopolData[i][3] || 'AKTIF'
        });
      }
    }

    // User
    var userData = sheets.user.getDataRange().getValues();
    var userList = [];
    for (var j = 1; j < userData.length; j++) {
      if (userData[j][0]) {
        userList.push({
          nama: userData[j][0],
          ndk: userData[j][1],
          departemen: userData[j][2],
          noWa: userData[j][3],
          signatureUrl: userData[j][4] || ''
        });
      }
    }

    // Atasan WA
    var atasanData = sheets.atasan.getDataRange().getValues();
    var atasanList = [];
    for (var k = 1; k < atasanData.length; k++) {
      if (atasanData[k][0]) {
        atasanList.push({
          nama: atasanData[k][0],
          jabatan: atasanData[k][1],
          noWa: atasanData[k][2],
          status: atasanData[k][3] || 'AKTIF'
        });
      }
    }

    return responseSuccess({
      nopolList: nopolList,
      userList: userList,
      atasanList: atasanList,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[BOOKING ERROR in handleBookingMasterGet]:', err.message);
    return responseSuccess({
      nopolList: DEFAULT_BOOKING_NOPOL.map(function(r) { return { nopol: r[0], unit: r[1], jenis: r[2], status: r[3] }; }),
      userList: DEFAULT_BOOKING_USER.map(function(r) { return { nama: r[0], ndk: r[1], departemen: r[2], noWa: r[3] }; }),
      atasanList: DEFAULT_BOOKING_ATASAN.map(function(r) { return { nama: r[0], jabatan: r[1], noWa: r[2], status: r[3] }; })
    });
  }
}

/**
 * [BKG-005] HMAC SHA-256 Approval Token Generator & Verifier
 */
function getBookingWATokenSecret() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('WA_APPROVAL_SECRET') || 'vamos_bkg_secret_token_default_2026';
}

function generateBookingWAToken(uid, role, action, expiryTimestamp) {
  var secret = getBookingWATokenSecret();
  var message = String(uid) + '|' + String(role) + '|' + String(action) + '|' + String(expiryTimestamp);
  var signatureBytes = Utilities.computeHmacSha256Signature(message, secret);
  return Utilities.base64Encode(signatureBytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function verifyBookingWAToken(uid, role, action, expiryTimestamp, token) {
  if (Date.now() > Number(expiryTimestamp)) {
    return { valid: false, reason: 'EXPIRED' };
  }
  var expected = generateBookingWAToken(uid, role, action, expiryTimestamp);
  if (expected === token) {
    return { valid: true };
  }
  return { valid: false, reason: 'INVALID_SIGNATURE' };
}

/**
 * Enqueue WhatsApp Notification to WA_Outbox
 */
function enqueueBookingWA(targetWa, messageBody, moduleTag) {
  try {
    var sheets = initBookingSheets();
    var msgId = 'MSG-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
    sheets.outbox.appendRow([
      msgId,
      moduleTag || 'BOOKING',
      normalizePhoneNumber(targetWa),
      messageBody,
      'PENDING',
      0,
      new Date().toISOString(),
      ''
    ]);
    return msgId;
  } catch (err) {
    console.error('[BOOKING WARN in enqueueBookingWA]:', err.message);
    return null;
  }
}

/**
 * [BKG-006] RPC Action: booking.submit (Buat Permintaan Baru)
 */
function handleBookingSubmit(data, actor) {
  if (!data) {
    return responseError(422, "Data formulir tidak boleh kosong.");
  }

  // Validasi kolom wajib
  if (!data.nopol || !data.peminjam || !data.tgl_pinjam || !data.keperluan) {
    return responseError(422, "EMPTY_FIELD: Nopol, Nama Peminjam, Tanggal Pinjam, dan Keperluan wajib diisi.");
  }

  var normalizedNopol = normalizeNopolString(data.nopol);
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);
    var sheets = initBookingSheets();
    var datadbValues = sheets.datadb.getDataRange().getValues();

    // 1. Collision & Schedule Check (NOPOL_BUSY)
    var reqStart = new Date(data.tgl_pinjam + 'T' + (data.jam_pinjam || '08:00')).getTime();
    var reqEnd = new Date((data.tgl_kembali || data.tgl_pinjam) + 'T' + (data.jam_kembali || '17:00')).getTime();

    for (var i = 1; i < datadbValues.length; i++) {
      var row = datadbValues[i];
      var rowNopol = normalizeNopolString(row[1]);
      var rowStatus = String(row[14]).toUpperCase();

      if (rowNopol === normalizedNopol && (rowStatus === 'PENDING_AM' || rowStatus === 'PENDING_GS1' || rowStatus === 'ON_TRIP')) {
        var activeStart = new Date(row[4] + 'T' + (row[5] || '08:00')).getTime();
        var activeEnd = new Date((row[6] || row[4]) + 'T' + (row[7] || '17:00')).getTime();

        // Cek overlap waktu
        if (reqStart <= activeEnd && reqEnd >= activeStart) {
          return responseError(409, "NOPOL_BUSY: Kendaraan " + normalizedNopol + " sedang aktif digunakan atau dijadwalkan pada rentang waktu ini (Ref: " + row[0] + ").");
        }
      }
    }

    // 2. Generate Atomic UID
    var todayStr = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
    var uid = 'BKG-' + todayStr + '-' + Math.floor(1000 + Math.random() * 9000);
    var nowIso = new Date().toISOString();

    // 3. Simpan ke sheet datadb
    sheets.datadb.appendRow([
      uid,
      normalizedNopol,
      sanitizeInput(data.peminjam),
      sanitizeInput(data.ndk || '-'),
      data.tgl_pinjam,
      data.jam_pinjam || '08:00',
      data.tgl_kembali || data.tgl_pinjam,
      data.jam_kembali || '17:00',
      sanitizeInput(data.keperluan),
      data.jenis_keperluan || 'Operasional',
      sanitizeInput(data.lokasi || 'Site Operasional'),
      sanitizeInput(data.driver || 'Lepas Kunci'),
      sanitizeInput(data.atasan || 'Site Manager'),
      sanitizeInput(data.atasan2 || '-'),
      'PENDING_AM', // Status awal: Menunggu Persetujuan Atasan 1
      '', '', '', '', '', // Keluar: KM, BBM, Kondisi, Petugas, Tgl
      '', '', '', '', '', // Masuk: KM, BBM, Kondisi, Petugas, Tgl
      sanitizeInput(data.catatan || ''),
      nowIso,
      nowIso
    ]);

    // 4. Buat token approval WA cepat untuk Atasan 1 (24 jam)
    var expiry = Date.now() + 24 * 3600 * 1000;
    var tokenApprove = generateBookingWAToken(uid, 'AM', 'APPROVE', expiry);
    var tokenReject = generateBookingWAToken(uid, 'AM', 'REJECT', expiry);

    // Enqueue WA notification ke Atasan
    var atasanWa = data.atasan_wa || '628119988771';
    var waBody = "📢 *VAMOS FMS - Permohonan Peminjaman KR*\n\n" +
      "Telah diajukan peminjaman kendaraan baru:\n" +
      "• UID: *" + uid + "*\n" +
      "• Peminjam: *" + data.peminjam + "* (" + (data.ndk || '-') + ")\n" +
      "• Unit: *" + normalizedNopol + "*\n" +
      "• Jadwal: " + data.tgl_pinjam + " (" + (data.jam_pinjam || '08:00') + ") s/d " + (data.tgl_kembali || data.tgl_pinjam) + " (" + (data.jam_kembali || '17:00') + ")\n" +
      "• Keperluan: " + data.keperluan + "\n\n" +
      "Persetujuan instan (One-Click Approval):\n" +
      "✅ Setujui: https://script.google.com/macros/s/exec?page=approve_wa&uid=" + uid + "&role=AM&act=APPROVE&exp=" + expiry + "&tok=" + tokenApprove + "\n" +
      "❌ Tolak: https://script.google.com/macros/s/exec?page=approve_wa&uid=" + uid + "&role=AM&act=REJECT&exp=" + expiry + "&tok=" + tokenReject;

    enqueueBookingWA(atasanWa, waBody, 'BOOKING');

    recordAuditLog(actor || data.peminjam, 'BOOKING_CREATE', 'BOOKING', { uid: uid, nopol: normalizedNopol }, 'SUCCESS');

    return responseSuccess({
      uid: uid,
      nopol: normalizedNopol,
      status: 'PENDING_AM',
      message: "Permohonan peminjaman KR " + uid + " berhasil diajukan dan menunggu persetujuan Atasan."
    });

  } catch (err) {
    console.error('[BOOKING ERROR in handleBookingSubmit]:', err.message);
    return responseError(500, "Gagal memproses peminjaman: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * [BKG-010] RPC Action: booking.list (Daftar Permintaan & Filter)
 */
function handleBookingList(filter, actor, role) {
  try {
    var sheets = initBookingSheets();
    var values = sheets.datadb.getDataRange().getValues();
    var bookings = [];

    var statusFilter = filter && filter.status ? String(filter.status).toUpperCase() : 'ALL';
    var search = filter && filter.search ? String(filter.search).toLowerCase() : '';

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue;

      var bkgObj = {
        uid: row[0],
        nopol: row[1],
        peminjam: row[2],
        ndk: row[3],
        tgl_pinjam: row[4],
        jam_pinjam: row[5],
        tgl_kembali: row[6],
        jam_kembali: row[7],
        keperluan: row[8],
        jenis_keperluan: row[9],
        lokasi: row[10],
        driver: row[11],
        atasan: row[12],
        atasan2: row[13],
        status: row[14],
        km_keluar: row[15],
        bbm_keluar: row[16],
        petugas_keluar: row[18],
        tgl_keluar: row[19],
        km_masuk: row[20],
        bbm_masuk: row[21],
        petugas_masuk: row[23],
        tgl_masuk: row[24],
        created_at: row[26]
      };

      // Filter status
      if (statusFilter !== 'ALL' && bkgObj.status.toUpperCase() !== statusFilter) {
        continue;
      }

      // Filter text
      if (search) {
        var match = String(bkgObj.uid).toLowerCase().includes(search) ||
          String(bkgObj.peminjam).toLowerCase().includes(search) ||
          String(bkgObj.nopol).toLowerCase().includes(search);
        if (!match) continue;
      }

      bookings.push(bkgObj);
    }

    return responseSuccess(bookings.reverse());
  } catch (err) {
    console.error('[BOOKING ERROR in handleBookingList]:', err.message);
    return responseSuccess([]);
  }
}

/**
 * [BKG-012] RPC Action: booking.approval.process (Unified State Machine Approval)
 */
function handleBookingApprovalProcess(data, actor, role) {
  if (!data || !data.uid || !data.action) {
    return responseError(422, "UID dan Aksi (APPROVE / REJECT) wajib disertakan.");
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var sheets = initBookingSheets();
    var values = sheets.datadb.getDataRange().getValues();
    var foundRow = -1;
    var currentRecord = null;

    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).toUpperCase() === String(data.uid).trim().toUpperCase()) {
        foundRow = i + 1;
        currentRecord = values[i];
        break;
      }
    }

    if (foundRow === -1 || !currentRecord) {
      return responseError(404, "Data booking " + data.uid + " tidak ditemukan.");
    }

    var currentStatus = String(currentRecord[14]).toUpperCase();
    var newStatus = currentStatus;
    var nowIso = new Date().toISOString();

    if (data.action.toUpperCase() === 'REJECT') {
      newStatus = 'REJECTED';
      sheets.datadb.getRange(foundRow, 15).setValue('REJECTED');
      sheets.datadb.getRange(foundRow, 26).setValue(sanitizeInput(data.alasan || 'Ditolak oleh atasan/admin'));
      sheets.datadb.getRange(foundRow, 28).setValue(nowIso);

      recordAuditLog(actor, 'BOOKING_REJECT', 'BOOKING', { uid: data.uid, reason: data.alasan }, 'SUCCESS');
      return responseSuccess({
        uid: data.uid,
        status: 'REJECTED',
        message: "Permohonan booking " + data.uid + " telah ditolak."
      });
    }

    // APPROVE flow via State Machine
    if (currentStatus === 'PENDING_AM') {
      // Atasan 1 approve -> PENDING_GS1 (Pool Serah Keluar)
      newStatus = 'PENDING_GS1';
      sheets.datadb.getRange(foundRow, 15).setValue(newStatus);
      sheets.datadb.getRange(foundRow, 28).setValue(nowIso);

      // Notifikasi ke Pool GS
      enqueueBookingWA('628119988772', "🚗 *VAMOS FMS - Jadwal Serah Keluar KR*\n\nBooking *" + data.uid + "* telah disetujui Atasan. Mohon petugas Pool melakukan pemeriksaan kendaraan keluar.", 'BOOKING');

    } else if (currentStatus === 'PENDING_GS1') {
      // Pool GS serah keluar kendaraan -> ON_TRIP
      newStatus = 'ON_TRIP';
      sheets.datadb.getRange(foundRow, 15).setValue(newStatus);
      sheets.datadb.getRange(foundRow, 16).setValue(Number(data.km_keluar) || 0);
      sheets.datadb.getRange(foundRow, 17).setValue(data.bbm_keluar || 'Full');
      sheets.datadb.getRange(foundRow, 18).setValue(sanitizeInput(data.kondisi_keluar || 'Baik & Bersih'));
      sheets.datadb.getRange(foundRow, 19).setValue(sanitizeInput(actor || 'Petugas Pool GS'));
      sheets.datadb.getRange(foundRow, 20).setValue(nowIso);
      sheets.datadb.getRange(foundRow, 28).setValue(nowIso);

    } else if (currentStatus === 'ON_TRIP' || currentStatus === 'PENDING_GS2') {
      // Pengembalian kendaraan & verifikasi akhir -> COMPLETED
      newStatus = 'COMPLETED';
      sheets.datadb.getRange(foundRow, 15).setValue(newStatus);
      sheets.datadb.getRange(foundRow, 21).setValue(Number(data.km_masuk) || 0);
      sheets.datadb.getRange(foundRow, 22).setValue(data.bbm_masuk || 'Normal');
      sheets.datadb.getRange(foundRow, 23).setValue(sanitizeInput(data.kondisi_masuk || 'Lengkap & Baik'));
      sheets.datadb.getRange(foundRow, 24).setValue(sanitizeInput(actor || 'Petugas Pool GS'));
      sheets.datadb.getRange(foundRow, 25).setValue(nowIso);
      sheets.datadb.getRange(foundRow, 28).setValue(nowIso);

    } else {
      return responseError(400, "Tidak dapat melakukan approval pada status saat ini: " + currentStatus);
    }

    recordAuditLog(actor, 'BOOKING_APPROVE', 'BOOKING', { uid: data.uid, from: currentStatus, to: newStatus }, 'SUCCESS');

    return responseSuccess({
      uid: data.uid,
      status: newStatus,
      message: "Status booking " + data.uid + " berhasil diperbarui menjadi " + newStatus
    });

  } catch (err) {
    console.error('[BOOKING ERROR in handleBookingApprovalProcess]:', err.message);
    return responseError(500, "Gagal memproses approval: " + err.message);
  } finally {
    lock.releaseLock();
  }
}

/**
 * [BKG-005] & [BKG-019] One-Click WhatsApp Quick Approval Entrypoint
 */
function handleBookingWAApprove(data) {
  if (!data || !data.uid || !data.tok || !data.exp || !data.role || !data.act) {
    return responseError(422, "Parameter tautan approval WhatsApp tidak lengkap.");
  }

  var verify = verifyBookingWAToken(data.uid, data.role, data.act, data.exp, data.tok);
  if (!verify.valid) {
    if (verify.reason === 'EXPIRED') {
      return responseError(410, "Tautan approval telah kadaluarsa (melebihi 24 jam). Silakan buka dasbor aplikasi.");
    }
    return responseError(403, "Token tanda tangan approval tidak sah.");
  }

  return handleBookingApprovalProcess({
    uid: data.uid,
    action: data.act,
    alasan: 'Disetujui via tautan cepat WhatsApp'
  }, 'WA_APPROVER_' + data.role, data.role);
}

/**
 * [BKG-007] Nopol CRUD Handlers
 */
function handleBookingNopolCRUD(data, action) {
  var sheets = initBookingSheets();
  var nopolSheet = sheets.nopol;

  if (action === 'booking.nopol.create') {
    if (!data.nopol) return responseError(422, "Nopol wajib diisi.");
    var cleanNopol = normalizeNopolString(data.nopol);

    var existing = nopolSheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (normalizeNopolString(existing[i][0]) === cleanNopol) {
        return responseError(409, "Nopol " + cleanNopol + " sudah terdaftar.");
      }
    }

    nopolSheet.appendRow([cleanNopol, sanitizeInput(data.unit || 'Umum'), sanitizeInput(data.jenis || 'LV'), 'AKTIF']);
    return responseSuccess({ nopol: cleanNopol, message: "Nopol berhasil ditambahkan." });
  }

  if (action === 'booking.nopol.delete') {
    if (!data.nopol) return responseError(422, "Nopol wajib disertakan.");
    var cleanTarget = normalizeNopolString(data.nopol);
    var rows = nopolSheet.getDataRange().getValues();
    for (var j = 1; j < rows.length; j++) {
      if (normalizeNopolString(rows[j][0]) === cleanTarget) {
        nopolSheet.deleteRow(j + 1);
        return responseSuccess({ message: "Nopol " + cleanTarget + " berhasil dihapus." });
      }
    }
    return responseError(404, "Nopol tidak ditemukan.");
  }

  return handleBookingMasterGet();
}

/**
 * [BKG-008] User CRUD Handlers
 */
function handleBookingUserCRUD(data, action) {
  var sheets = initBookingSheets();
  var userSheet = sheets.user;

  if (action === 'booking.user.create') {
    if (!data.nama || !data.ndk) return responseError(422, "Nama dan NDK wajib diisi.");
    userSheet.appendRow([
      sanitizeInput(data.nama),
      sanitizeInput(data.ndk),
      sanitizeInput(data.departemen || 'Operasional'),
      normalizePhoneNumber(data.noWa || ''),
      data.signatureUrl || ''
    ]);
    return responseSuccess({ message: "User peminjam baru berhasil ditambahkan." });
  }

  return handleBookingMasterGet();
}

/**
 * [BKG-009] Atasan WA CRUD Handlers
 */
function handleBookingAtasanCRUD(data, action) {
  var sheets = initBookingSheets();
  var atasanSheet = sheets.atasan;

  if (action === 'booking.atasan.create') {
    if (!data.nama || !data.noWa) return responseError(422, "Nama dan No WhatsApp wajib diisi.");
    atasanSheet.appendRow([
      sanitizeInput(data.nama),
      sanitizeInput(data.jabatan || 'Approver'),
      normalizePhoneNumber(data.noWa),
      'AKTIF'
    ]);
    return responseSuccess({ message: "Kontak Atasan Approver berhasil ditambahkan." });
  }

  return handleBookingMasterGet();
}

/**
 * [BKG-014] WA Outbox List & Sync Handlers
 */
function handleBookingOutboxList() {
  try {
    var sheets = initBookingSheets();
    var values = sheets.outbox.getDataRange().getValues();
    var outbox = [];
    for (var i = 1; i < values.length; i++) {
      if (values[i][0]) {
        outbox.push({
          msgId: values[i][0],
          module: values[i][1],
          targetWa: values[i][2],
          messageBody: values[i][3],
          status: values[i][4],
          retryCount: values[i][5],
          createdAt: values[i][6],
          sentAt: values[i][7]
        });
      }
    }
    return responseSuccess(outbox.reverse());
  } catch (err) {
    return responseSuccess([]);
  }
}
