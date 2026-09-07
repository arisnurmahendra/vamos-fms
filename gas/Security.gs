/**
 * VAMOS FMS - Security & Middleware Layer
 * [BE-003] Auth & Role Verification Middleware
 * [BE-004] Anti-Formula Injection Sanitizer
 */

// Karakter berbahaya pemicu eksekusi formula CSV / Google Sheets
var FORMULA_INJECTION_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/**
 * [BE-004] Sanitasi masukan rekursif untuk mencegah Formula Injection
 * Menambahkan prefix single-quote (') jika string dimulai dengan =, +, -, @, \t, atau \r
 * @param {*} data Nilai primitive, array, atau object
 * @returns {*} Data yang sudah disanitasi
 */
function sanitizeInput(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    var trimmed = data.trim();
    if (trimmed.length > 0 && FORMULA_INJECTION_PREFIXES.indexOf(trimmed.charAt(0)) !== -1) {
      // Netralkan formula injection dengan prefix tanda petik tunggal (')
      return "'" + data;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(function(item) {
      return sanitizeInput(item);
    });
  }

  if (typeof data === 'object') {
    var sanitizedObj = {};
    for (var key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitizedObj[key] = sanitizeInput(data[key]);
      }
    }
    return sanitizedObj;
  }

  return data;
}

/**
 * [BE-003] Whitelist aksi publik yang tidak membutuhkan token sesi
 */
var PUBLIC_ACTIONS = {
  'ping': true,
  'auth.handshake': true,
  'system.info': true,
  'p2h.master.get': true,
  'booking.master.get': true,
  'booking.wa.approve': true
};

/**
 * [BE-003] Definisi Role dan Hak Akses Minimum per Aksi
 */
var ACTION_ROLE_MAP = {
  // Booking Module
  'booking.master.get': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER', 'DRIVER'],
  'booking.submit': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER', 'DRIVER'],
  'booking.list': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER', 'DRIVER'],
  'booking.approval.process': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2'],
  'booking.wa.approve': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER'],
  'booking.nopol.list': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER', 'DRIVER'],
  'booking.nopol.create': ['SUPER_ADMIN', 'ADMIN', 'GS1'],
  'booking.nopol.delete': ['SUPER_ADMIN', 'ADMIN'],
  'booking.user.list': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER'],
  'booking.user.create': ['SUPER_ADMIN', 'ADMIN'],
  'booking.atasan.list': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER'],
  'booking.atasan.create': ['SUPER_ADMIN', 'ADMIN'],
  'booking.outbox.list': ['SUPER_ADMIN', 'ADMIN', 'GS1', 'AM'],
  
  // Maintenance Module
  'maintenance.report.submit': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'USER', 'DRIVER', 'MECHANIC'],
  'maintenance.report.list': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'VENDOR_BENGKEL', 'MECHANIC'],
  'maintenance.spk.create': ['SUPER_ADMIN', 'ADMIN'],
  'maintenance.rab.manage': ['SUPER_ADMIN', 'ADMIN'],
  
  // P2H Module
  'p2h.kendaraan.submit': ['SUPER_ADMIN', 'ADMIN', 'USER', 'DRIVER', 'GS1'],
  'p2h.kendaraan.list': ['SUPER_ADMIN', 'ADMIN', 'USER', 'DRIVER', 'GS1', 'AM'],
  'p2h.reports.list': ['SUPER_ADMIN', 'ADMIN', 'USER', 'DRIVER', 'GS1', 'AM', 'GS_ADMIN'],
  'p2h.supervisor.followup': ['SUPER_ADMIN', 'ADMIN', 'GS1', 'AM', 'GS_ADMIN'],
  
  // V-TACS Module
  'vtacs.master.get': ['SUPER_ADMIN', 'ADMIN', 'USER', 'DRIVER', 'VENDOR_POM', 'GS_ADMIN'],
  'vtacs.voucher.list': ['SUPER_ADMIN', 'ADMIN', 'USER', 'DRIVER', 'VENDOR_POM', 'GS_ADMIN'],
  'vtacs.voucher.request': ['SUPER_ADMIN', 'ADMIN', 'USER', 'DRIVER', 'GS_ADMIN'],
  'vtacs.voucher.redeem': ['SUPER_ADMIN', 'ADMIN', 'USER', 'DRIVER', 'VENDOR_POM', 'GS_ADMIN'],
  'vtacs.voucher.report': ['SUPER_ADMIN', 'ADMIN', 'USER', 'DRIVER', 'VENDOR_POM', 'GS_ADMIN'],
  'vtacs.reconcile': ['SUPER_ADMIN', 'ADMIN', 'GS_ADMIN']
};

/**
 * [BE-003] Validasi Token Sesi Pengguna
 * @param {string} token Token sesi dari frontend
 * @returns {Object|null} Payload sesi { email, role, expiresAt } atau null jika tidak valid
 */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    var scriptProps = PropertiesService.getScriptProperties();
    var secretKey = scriptProps.getProperty('AES_ENCRYPTION_KEY') || 'VAMOS_FALLBACK_DEFAULT_SECRET_2026';
    
    // Format token: base64(email:role:timestamp:signature)
    var decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    var parts = decoded.split(':');
    
    if (parts.length < 4) {
      return null;
    }

    var email = parts[0];
    var role = parts[1];
    var expiresAt = parseInt(parts[2], 10);
    var providedSignature = parts[3];

    // Cek masa berlaku token (misal valid 24 jam)
    var now = new Date().getTime();
    if (isNaN(expiresAt) || now > expiresAt) {
      console.warn("[AUTH WARN]: Token expired for user: " + email);
      return null;
    }

    // Verifikasi HMAC signature
    var rawPayload = email + ':' + role + ':' + expiresAt;
    var expectedSigBytes = Utilities.computeHmacSha256Signature(rawPayload, secretKey);
    var expectedSignature = Utilities.base64Encode(expectedSigBytes);

    if (providedSignature !== expectedSignature) {
      console.warn("[AUTH WARN]: Invalid token signature for user: " + email);
      return null;
    }

    return {
      email: email,
      role: role,
      expiresAt: expiresAt
    };
  } catch (err) {
    console.error("[AUTH ERROR]: Token verification failed: " + err.message);
    return null;
  }
}

/**
 * [BE-003] Buat Token Sesi Baru untuk Pengguna
 * @param {string} email
 * @param {string} role
 * @param {number} durationHours
 * @returns {string} Token Base64
 */
function generateSessionToken(email, role, durationHours) {
  var hours = durationHours || 24;
  var expiresAt = new Date().getTime() + (hours * 3600 * 1000);
  var scriptProps = PropertiesService.getScriptProperties();
  var secretKey = scriptProps.getProperty('AES_ENCRYPTION_KEY') || 'VAMOS_FALLBACK_DEFAULT_SECRET_2026';
  
  var rawPayload = email + ':' + role + ':' + expiresAt;
  var sigBytes = Utilities.computeHmacSha256Signature(rawPayload, secretKey);
  var signature = Utilities.base64Encode(sigBytes);
  
  var fullTokenString = rawPayload + ':' + signature;
  return Utilities.base64Encode(Utilities.newBlob(fullTokenString).getBytes());
}

/**
 * [BE-003] Middleware Autorisasi Peran Pengguna
 * @param {string} action
 * @param {string} userRole
 * @returns {boolean} true jika diizinkan
 */
function authorizeUserRole(action, userRole) {
  var allowedRoles = ACTION_ROLE_MAP[action];
  
  // Jika aksi tidak memiliki batasan spesifik, izinkan role autentikasi apapun
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // SUPER_ADMIN memiliki akses absolut ke semua aksi
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  return allowedRoles.indexOf(userRole) !== -1;
}

/**
 * [SEC-005] Users_Roles Sheet & Schema Specification
 * Struktur skema: Email, Nama, Role, Status_Aktif, Dibuat_Pada
 */
var USERS_ROLES_SHEET_NAME = 'Users_Roles';
var USERS_ROLES_HEADERS = ['Email', 'Nama', 'Role', 'Status_Aktif', 'Dibuat_Pada'];

/**
 * [SEC-005] Inisialisasi Sheet Users_Roles jika belum ada pada Master Spreadsheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function initUsersRolesSheet() {
  var ss = DatabaseRouter.openSpreadsheet('MASTER');
  var sheet = ss.getSheetByName(USERS_ROLES_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(USERS_ROLES_SHEET_NAME);
    sheet.appendRow(USERS_ROLES_HEADERS);
    sheet.getRange(1, 1, 1, USERS_ROLES_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);

    // Tambahkan default super admin bootstrap bila baru dibuat
    sheet.appendRow([
      Session.getActiveUser().getEmail() || 'admin@vamos.com',
      'System Administrator',
      'SUPER_ADMIN',
      'AKTIF',
      new Date().toISOString()
    ]);
  }

  return sheet;
}

/**
 * [SEC-005] Cari role pengguna dari sheet Users_Roles
 * @param {string} email
 * @returns {{ role: string, nama: string, status: string }|null}
 */
function lookupUserRole(email) {
  if (!email) return null;

  try {
    var ss = DatabaseRouter.openSpreadsheet('MASTER');
    var sheet = ss.getSheetByName(USERS_ROLES_SHEET_NAME);
    if (!sheet) {
      sheet = initUsersRolesSheet();
    }

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return null;

    var targetEmail = String(email).trim().toLowerCase();
    for (var i = 1; i < data.length; i++) {
      var rowEmail = String(data[i][0]).trim().toLowerCase();
      if (rowEmail === targetEmail) {
        return {
          email: data[i][0],
          nama: data[i][1],
          role: String(data[i][2]).trim().toUpperCase(),
          status: String(data[i][3]).trim().toUpperCase()
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('[USERS_ROLES]: Lookup error: ' + err.message);
    return null;
  }
}

