/**
 * VAMOS - Backend Core Dispatcher (Google Apps Script)
 * Arsitektur RPC (Remote Procedure Call) Single Endpoint
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
  try {
    // Validasi awal payload
    if (!payload || !payload.action) {
      return responseError(400, "Invalid payload structure.");
    }

    // Routing aksi berdasarkan action
    switch (payload.action) {
      case 'ping':
        return responseSuccess({ message: "VAMOS Backend is online!", timestamp: new Date() });
      
      default:
        return responseError(404, "Action not found: " + payload.action);
    }

  } catch (error) {
    // Global Try-Catch Backend Failsafe
    console.error("[FATAL ERROR]:", error.message);
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