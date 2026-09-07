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
  'p2h.master.get': true
};

/**
 * [BE-003] Definisi Role dan Hak Akses Minimum per Aksi
 */
var ACTION_ROLE_MAP = {
  // Booking Module
  'booking.submit': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER'],
  'booking.list': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2', 'USER'],
  'booking.approval.process': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2'],
  'booking.nopol.manage': ['SUPER_ADMIN', 'ADMIN'],
  
  // Maintenance Module
  'maintenance.report.submit': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'USER'],
  'maintenance.report.list': ['SUPER_ADMIN', 'ADMIN', 'AM', 'GS1', 'VENDOR_BENGKEL'],
  'maintenance.spk.create': ['SUPER_ADMIN', 'ADMIN'],
  'maintenance.rab.manage': ['SUPER_ADMIN', 'ADMIN'],
  
  // P2H Module
  'p2h.kendaraan.submit': ['SUPER_ADMIN', 'ADMIN', 'USER', 'GS1'],
  'p2h.kendaraan.list': ['SUPER_ADMIN', 'ADMIN', 'GS1', 'AM'],
  
  // V-TACS Module
  'vtacs.voucher.request': ['SUPER_ADMIN', 'ADMIN', 'USER'],
  'vtacs.voucher.report': ['SUPER_ADMIN', 'ADMIN', 'USER', 'VENDOR_POM'],
  'vtacs.reconcile': ['SUPER_ADMIN', 'ADMIN']
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
