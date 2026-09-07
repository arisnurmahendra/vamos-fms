/**
 * VAMOS - Backend Core Dispatcher (Google Apps Script)
 * Arsitektur RPC (Remote Procedure Call) Single Endpoint
 * Dilengkapi Middleware: Auth, Role Authorization, Anti-Formula Injection, & Audit Trail
 */

function doGet(e) {
  // Melayani file index.html hasil build Vite Singlefile
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('VAMOS - Fleet Management System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Pintu masuk utama RPC dari Frontend Vue
 * @param {Object} payload Berisi action, token, dan data
 */
function apiDispatcher(payload) {
  var action = '';
  var actor = 'ANONYMOUS';

  try {
    // 1. Validasi struktur payload
    if (!payload || typeof payload !== 'object' || !payload.action) {
      return responseError(400, "Invalid payload structure. 'action' is required.");
    }

    action = String(payload.action).trim();

    // 2. [BE-004] Sanitasi input otomatis dari potensi Formula Injection
    var sanitizedData = sanitizeInput(payload.data || {});

    // 3. [BE-003] Autentikasi & Verifikasi Token Sesi
    var isPublicAction = !!PUBLIC_ACTIONS[action];
    var sessionUser = null;

    if (!isPublicAction) {
      sessionUser = verifySessionToken(payload.token);
      if (!sessionUser) {
        // Catat insiden keamanan ke Audit Trail
        recordAuditLog(actor, 'UNAUTHORIZED_ACCESS', action, payload, 'DENIED');
        return responseError(401, "Unauthorized: Invalid or expired session token.");
      }

      actor = sessionUser.email;

      // 4. [BE-003] Otorisasi Peran Pengguna (Role-Based Access Control)
      var isAuthorized = authorizeUserRole(action, sessionUser.role);
      if (!isAuthorized) {
        recordAuditLog(actor, 'FORBIDDEN_ROLE_ACCESS', action, { role: sessionUser.role }, 'DENIED');
        return responseError(403, "Forbidden: Insufficient role permissions for this action.");
      }
    }

    // 5. Routing Eksekusi Aksi
    switch (action) {
      case 'ping':
        return responseSuccess({ 
          message: "VAMOS Backend is online!", 
          timestamp: new Date().toISOString() 
        });

      case 'auth.handshake':
        // Initial handshake: membaca email pengguna aktif GAS dan generate token sesi
        var activeEmail = Session.getActiveUser().getEmail() || 'demo.user@app.com';
        var assignedRole = 'USER'; // Default role, dapat divalidasi dengan Users_Roles sheet
        var newToken = generateSessionToken(activeEmail, assignedRole, 24);
        recordAuditLog(activeEmail, 'LOGIN_HANDSHAKE', 'AUTH', { role: assignedRole }, 'SUCCESS');
        return responseSuccess({
          email: activeEmail,
          role: assignedRole,
          token: newToken
        });

      case 'system.info':
        return responseSuccess({
          app: "VAMOS FMS",
          version: "1.0.0",
          serverTime: new Date().toISOString(),
          timezone: "Asia/Jakarta"
        });

      default:
        return responseError(404, "Action not found: " + action);
    }

  } catch (error) {
    // Global Try-Catch Backend Failsafe
    console.error("[FATAL ERROR in apiDispatcher]:", error.message);
    recordAuditLog(actor, action || 'UNKNOWN', 'SYSTEM_ERROR', { error: error.message }, 'ERROR');
    return responseError(500, "Internal Server Error: " + error.message);
  }
}

// Helper Kontrak Data (JSend Pattern)
function responseSuccess(data) {
  return {
    status: "success",
    code: 200,
    message: "Success",
    data: data
  };
}

function responseError(code, message) {
  return {
    status: "error",
    code: code,
    message: message,
    data: null
  };
}