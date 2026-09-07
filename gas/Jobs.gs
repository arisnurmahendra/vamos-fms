/**
 * VAMOS FMS - Background Jobs & Message Queue
 * [JOB-001] WhatsApp Message Queue (WA_Outbox Sheet)
 * [JOB-002] Time-Driven Trigger Batch Processor
 * Ground Truth: docs/ISSUE_TRACKER.md Milestone 6
 */

var JOBS_OUTBOX_HEADERS = [
  'Queue_ID', 'Module_Tag', 'Recipient', 'Message', 'Status', 'Retry_Count', 'Created_At', 'Processed_At', 'Error_Log'
];

/**
 * [JOB-001] Inisialisasi Sheet WA_Outbox
 */
function initWAOutboxSheet() {
  var ss;
  try {
    ss = DatabaseRouter.openSpreadsheet('BOOKING');
  } catch (e) {
    ss = DatabaseRouter.openSpreadsheet('MASTER');
  }

  var sheet = ss.getSheetByName('WA_Outbox');
  if (!sheet) {
    sheet = ss.insertSheet('WA_Outbox');
    sheet.appendRow(JOBS_OUTBOX_HEADERS);
    sheet.getRange(1, 1, 1, JOBS_OUTBOX_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#065f46')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * [JOB-001] Enqueue pesan baru ke antrean WA_Outbox secara asinkron
 * @param {string} recipient Nomor telepon target
 * @param {string} message Teks pesan notifikasi
 * @param {string} [moduleTag='SYSTEM'] Asal modul (BOOKING, MAINTENANCE, P2H, VTACS)
 * @returns {string} Queue_ID
 */
function enqueueWAMessage(recipient, message, moduleTag) {
  try {
    var sheet = initWAOutboxSheet();
    var queueId = 'MSG-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
    var nowIso = new Date().toISOString();

    sheet.appendRow([
      queueId,
      moduleTag || 'SYSTEM',
      String(recipient || '').trim(),
      message,
      'PENDING',
      0,
      nowIso,
      '',
      ''
    ]);

    return queueId;
  } catch (err) {
    console.error('[JOBS ERROR in enqueueWAMessage]:', err.message);
    return null;
  }
}

/**
 * [JOB-002] Time-Driven Trigger Batch Processor
 * Memproses pesan dengan status PENDING atau FAILED dengan retry < 3
 * @param {number} [batchSize=20]
 * @returns {Object} Hasil statistik pemrosesan batch
 */
function processWAOutboxQueue(batchSize) {
  var limit = batchSize || 20;
  var sheet = initWAOutboxSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return { processed: 0, sent: 0, failed: 0, pending: 0 };
  }

  var scriptProps = PropertiesService.getScriptProperties();
  var gatewayUrl = scriptProps.getProperty('WA_GATEWAY_URL') || '';
  var gatewayToken = scriptProps.getProperty('WA_GATEWAY_TOKEN') || '';

  var stats = { processed: 0, sent: 0, failed: 0, pending: 0 };
  var now = new Date().toISOString();

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var queueId = row[0];
    var recipient = row[2];
    var message = row[3];
    var status = String(row[4]).toUpperCase();
    var retryCount = Number(row[5]) || 0;

    if (!queueId) continue;

    if (status === 'PENDING' || (status === 'FAILED' && retryCount < 3)) {
      if (stats.processed >= limit) {
        stats.pending++;
        continue;
      }

      stats.processed++;
      var rowIdx = i + 1;

      try {
        var isSuccess = false;

        if (gatewayUrl && typeof UrlFetchApp !== 'undefined') {
          // Kirim HTTP POST ke Gateway resmi WhatsApp
          var response = UrlFetchApp.fetch(gatewayUrl, {
            method: 'post',
            contentType: 'application/json',
            headers: {
              'Authorization': 'Bearer ' + gatewayToken
            },
            payload: JSON.stringify({
              phone: recipient,
              message: message
            }),
            muteHttpExceptions: true
          });

          var respCode = response.getResponseCode();
          if (respCode >= 200 && respCode < 300) {
            isSuccess = true;
          } else {
            throw new Error('HTTP ' + respCode + ': ' + response.getContentText());
          }
        } else {
          // Mode Simulasi Development / Fallback jika Gateway belum dipasangkan
          isSuccess = true;
        }

        if (isSuccess) {
          sheet.getRange(rowIdx, 5).setValue('SENT');
          sheet.getRange(rowIdx, 8).setValue(now);
          sheet.getRange(rowIdx, 9).setValue('');
          stats.sent++;
        }
      } catch (sendErr) {
        var nextRetry = retryCount + 1;
        var nextStatus = nextRetry >= 3 ? 'FAILED' : 'PENDING';
        sheet.getRange(rowIdx, 5).setValue(nextStatus);
        sheet.getRange(rowIdx, 6).setValue(nextRetry);
        sheet.getRange(rowIdx, 8).setValue(now);
        sheet.getRange(rowIdx, 9).setValue(sendErr.message);
        stats.failed++;
        console.warn('[JOBS WARN]: Failed sending ' + queueId + ': ' + sendErr.message);
      }
    }
  }

  recordAuditLog('TIME_DRIVEN_TRIGGER', 'WA_OUTBOX_BATCH_PROCESS', 'BACKGROUND_JOB', stats, 'SUCCESS');
  return stats;
}

/**
 * [JOB-002] Konfigurasi Trigger Waktu Otomatis Setiap 1 Menit
 */
function setupTimeDrivenTriggers() {
  if (typeof ScriptApp === 'undefined') {
    return { status: 'mock', message: 'Trigger setup simulated in current environment.' };
  }

  var triggers = ScriptApp.getProjectTriggers();
  var exists = false;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'processWAOutboxQueue') {
      exists = true;
      break;
    }
  }

  if (!exists) {
    ScriptApp.newTrigger('processWAOutboxQueue')
      .timeBased()
      .everyMinutes(1)
      .create();
    return { status: 'created', message: 'Time-driven trigger per 1 menit berhasil didaftarkan.' };
  }

  return { status: 'exists', message: 'Time-driven trigger sudah aktif.' };
}

/**
 * RPC Handler: jobs.outbox.list
 */
function handleJobsOutboxList() {
  try {
    var sheet = initWAOutboxSheet();
    var values = sheet.getDataRange().getValues();
    var list = [];

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row[0]) {
        list.push({
          queue_id: row[0],
          module: row[1],
          recipient: row[2],
          message: row[3],
          status: row[4],
          retry_count: row[5],
          created_at: row[6],
          processed_at: row[7],
          error_log: row[8]
        });
      }
    }

    return responseSuccess(list.reverse());
  } catch (err) {
    return responseSuccess([]);
  }
}

/**
 * RPC Handler: jobs.outbox.process (Trigger Manual)
 */
function handleJobsProcessQueue(actor) {
  try {
    var stats = processWAOutboxQueue(25);
    recordAuditLog(actor, 'MANUAL_QUEUE_PROCESS', 'BACKGROUND_JOB', stats, 'SUCCESS');
    return responseSuccess({
      stats: stats,
      message: 'Batch processing selesai: ' + stats.sent + ' terkirim, ' + stats.failed + ' gagal.'
    });
  } catch (err) {
    return responseError(500, 'Gagal memproses antrean pesan: ' + err.message);
  }
}

/**
 * RPC Handler: jobs.trigger.setup
 */
function handleJobsTriggerSetup(actor) {
  try {
    var res = setupTimeDrivenTriggers();
    recordAuditLog(actor, 'TRIGGER_SETUP', 'BACKGROUND_JOB', res, 'SUCCESS');
    return responseSuccess(res);
  } catch (err) {
    return responseError(500, 'Gagal konfigurasi trigger: ' + err.message);
  }
}
