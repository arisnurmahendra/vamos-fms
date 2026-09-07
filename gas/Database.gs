/**
 * VAMOS FMS - Multi-Spreadsheet Router & Data Access Layer (DAL)
 * [BE-005] Multi-Spreadsheet Router & Data Access Layer
 */

var DatabaseRouter = (function() {
  // Mapping ID spreadsheet default dari kontrak lama / master plan
  var DEFAULT_SS_IDS = {
    'MASTER': '13n6sw4pk9Sus1WK1WV8i_Xsx3Yo8lVE2UDVycaKFaFE',
    'BOOKING': '14eq-5xgFnf5fEetkZ6AfmIxeppcKR1sjKawYnTQ8bOA',
    'MAINTENANCE': '1RWmQc_V-VlVxD8bV6WAJM2mzeXzq42yizzCc502DI3I',
    'P2H': '',
    'VTACS': ''
  };

  /**
   * Mengambil Spreadsheet ID terkonfigurasi dari Script Properties dengan fallback
   * @param {string} moduleKey 'MASTER' | 'BOOKING' | 'MAINTENANCE' | 'P2H' | 'VTACS'
   * @returns {string} Spreadsheet ID
   */
  function getSpreadsheetId(moduleKey) {
    var key = (moduleKey || 'MASTER').toUpperCase();
    var propName = key + '_SPREADSHEET_ID';
    if (key === 'MASTER') propName = 'MAIN_SPREADSHEET_ID';

    var scriptProps = PropertiesService.getScriptProperties();
    var id = scriptProps.getProperty(propName) || scriptProps.getProperty(key + '_SS_ID');
    
    if (id && id.trim().length > 0) {
      return id.trim();
    }

    // Gunakan fallback default jika property belum diset
    return DEFAULT_SS_IDS[key] || '';
  }

  /**
   * Membuka Spreadsheet target secara aman
   * @param {string} moduleKey
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
   */
  function openSpreadsheet(moduleKey) {
    var id = getSpreadsheetId(moduleKey);
    if (!id) {
      throw new Error("Spreadsheet ID untuk modul '" + moduleKey + "' belum dikonfigurasi.");
    }

    try {
      return SpreadsheetApp.openById(id);
    } catch (err) {
      console.error("[DB ERROR]: Gagal membuka Spreadsheet '" + moduleKey + "' (ID: " + id + "): " + err.message);
      throw new Error("Spreadsheet '" + moduleKey + "' tidak dapat diakses atau izin ditolak.");
    }
  }

  /**
   * Mengambil Sheet tertentu dari modul target
   * @param {string} moduleKey
   * @param {string} sheetName
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function getSheet(moduleKey, sheetName) {
    var ss = openSpreadsheet(moduleKey);
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Sheet '" + sheetName + "' tidak ditemukan pada modul '" + moduleKey + "'.");
    }
    return sheet;
  }

  /**
   * Membaca data tabel sebagai array of objects (Header baris pertama)
   * @param {string} moduleKey
   * @param {string} sheetName
   * @param {Function} [filterFn] Opsional filter function
   * @returns {Array<Object>}
   */
  function readData(moduleKey, sheetName, filterFn) {
    var sheet = getSheet(moduleKey, sheetName);
    var data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return [];
    }

    var headers = data[0].map(function(h) { return String(h).trim(); });
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var record = { _rowIndex: i + 1 };
      var isEmptyRow = true;

      for (var j = 0; j < headers.length; j++) {
        var val = row[j];
        if (val !== '' && val !== null && val !== undefined) {
          isEmptyRow = false;
        }
        record[headers[j]] = val;
      }

      if (!isEmptyRow) {
        if (!filterFn || filterFn(record)) {
          results.push(record);
        }
      }
    }

    return results;
  }

  /**
   * Menambahkan baris data dengan sanitasi anti formula injection otomatis
   * @param {string} moduleKey
   * @param {string} sheetName
   * @param {Object|Array} rowData
   * @returns {number} Nomor baris yang ditambahkan
   */
  function appendRowSafe(moduleKey, sheetName, rowData) {
    var sheet = getSheet(moduleKey, sheetName);
    var sanitized = sanitizeInput(rowData);

    if (Array.isArray(sanitized)) {
      sheet.appendRow(sanitized);
      return sheet.getLastRow();
    }

    // Jika rowData berupa object, petakan sesuai urutan header di sheet
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowValues = headers.map(function(h) {
      var key = String(h).trim();
      return sanitized[key] !== undefined ? sanitized[key] : '';
    });

    sheet.appendRow(rowValues);
    return sheet.getLastRow();
  }

  return {
    getSpreadsheetId: getSpreadsheetId,
    openSpreadsheet: openSpreadsheet,
    getSheet: getSheet,
    readData: readData,
    appendRowSafe: appendRowSafe
  };
})();
