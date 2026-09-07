/**
 * VAMOS FMS - Append-Only Audit Trail System
 * [BE-006] Append-Only Audit Trail System
 */

var AUDIT_SHEET_NAME = 'Audit_Logs';

/**
 * Masking nilai sensitif pada payload agar tidak bocor ke sheet log
 * @param {Object|string} payload
 * @returns {string} String JSON yang aman
 */
function maskSensitivePayload(payload) {
  if (!payload) return '{}';
  
  try {
    var copy = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(JSON.stringify(payload));
    var sensitiveKeys = ['token', 'secret', 'password', 'key', 'auth', 'aes_key', 'crypto_key', 'signature'];

    function recursiveMask(obj) {
      if (!obj || typeof obj !== 'object') return;
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          var lower = k.toLowerCase();
          var isSensitive = sensitiveKeys.some(function(s) { return lower.indexOf(s) !== -1; });
          if (isSensitive) {
            obj[k] = '***REDACTED***';
          } else if (typeof obj[k] === 'object') {
            recursiveMask(obj[k]);
          }
        }
      }
    }

    recursiveMask(copy);
    return JSON.stringify(copy);
  } catch (e) {
    return String(payload).substring(0, 500);
  }
}

/**
 * [BE-006] Catat log transaksi mutasi atau event keamanan ke sheet Audit_Logs
 * Silent failsafe: error logging tidak akan menggagalkan flow utama aplikasi.
 * 
 * @param {string} actor Email pengguna atau sistem
 * @param {string} action Nama aksi (misal: 'booking.submit', 'UNAUTHORIZED_ACCESS', 'INSERT')
 * @param {string} target Modul atau entitas target ('BOOKING', 'MAINTENANCE', dll.)
 * @param {*} payload Data transaksi
 * @param {string} [status='SUCCESS'] 'SUCCESS' | 'FAILED' | 'DENIED' | 'ERROR'
 */
function recordAuditLog(actor, action, target, payload, status) {
  try {
    var nowIso = new Date().toISOString();
    var safeActor = actor || 'ANONYMOUS';
    var safeStatus = status || 'SUCCESS';
    var safePayload = maskSensitivePayload(payload);

    // Ambil sheet Audit_Logs pada MASTER spreadsheet
    var ss = DatabaseRouter.openSpreadsheet('MASTER');
    var sheet = ss.getSheetByName(AUDIT_SHEET_NAME);

    // Inisialisasi sheet jika belum ada
    if (!sheet) {
      sheet = ss.insertSheet(AUDIT_SHEET_NAME);
      sheet.appendRow(['Timestamp', 'Actor', 'Action', 'Target', 'Status', 'Payload']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f3f3f3');
      
      // Lindungi baris header dari edit
      try {
        var protection = sheet.protect().setDescription('Audit Logs Immutable Protection');
        protection.setWarningOnly(true);
      } catch (pErr) {
        console.warn("[AUDIT WARN]: Sheet protection notice: " + pErr.message);
      }
    }

    // Append baris log baru (Append-Only)
    sheet.appendRow([
      nowIso,
      safeActor,
      action,
      target,
      safeStatus,
      safePayload
    ]);

  } catch (err) {
    // Silent failsafe: kegagalan audit log tidak boleh menggagalkan request pengguna
    console.error("[AUDIT LOG ERROR SILENT FAILSAFE]: " + err.message);
  }
}
