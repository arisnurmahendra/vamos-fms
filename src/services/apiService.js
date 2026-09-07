/**
 * VAMOS FMS - Dual-Mode ApiService & Async Promise Wrapper
 * [FE-004] Dual-Mode ApiService.js Abstraction Layer
 * [FE-005] Async Promise Wrapper for google.script.run
 */

import logger from '../utils/logger.js';
import storageService from './storageService.js';

// Mock Data lokal untuk mode DEMO (Strict Isolated)
const MOCK_DB = {
  'system.info': {
    app: 'VAMOS FMS (Demo Mode)',
    version: '1.0.0-demo',
    environment: 'demo'
  },
  'auth.handshake': {
    email: 'demo.admin@vamos.com',
    role: 'SUPER_ADMIN',
    token: 'DEMO_SESSION_TOKEN_SUPER_ADMIN_2026'
  },
  'booking.list': [
    { uid: 'BKG-2026-001', peminjam: 'Ahmad Fauzi', nopol: 'KT 1234 AB', status: 'COMPLETED', tgl_pinjam: '2026-09-01' },
    { uid: 'BKG-2026-002', peminjam: 'Rudi Hermawan', nopol: 'KT 5678 CD', status: 'PENDING_AM', tgl_pinjam: '2026-09-07' }
  ],
  'maintenance.report.list': [
    { no_laporan: 'MNT-2026-001', nopol: 'KT 1234 AB', keluhan: 'Rem bunyi derit', status: 'SPK_TERBIT', estimasi_biaya: 750000 },
    { no_laporan: 'MNT-2026-002', nopol: 'KT 9012 EF', keluhan: 'Ganti Oli 10.000 KM', status: 'SELESAI', estimasi_biaya: 450000 }
  ],
  'p2h.master.get': {
    subkon: ['INTERNAL', 'PT MAJU JAYA', 'PT TRANS LOGISTIK', 'CV ANUGERAH'],
    kendaraan: [
      { nopol: 'KT 1234 AB', merk: 'Toyota Hilux', jenis: 'Light Vehicle (LV)', subkon: 'INTERNAL' },
      { nopol: 'KT 5678 CD', merk: 'Mitsubishi Triton', jenis: 'Light Vehicle (LV)', subkon: 'INTERNAL' },
      { nopol: 'KT 9012 EF', merk: 'Toyota Hiace', jenis: 'Minibus / Commuter', subkon: 'PT TRANS LOGISTIK' }
    ]
  },
  'vtacs.voucher.list': [
    { voucher_no: 'VCH-001', nopol: 'KT 1234 AB', nominal: 250000, status: 'REDEEMED', pom: 'SPBU 61.751.01' },
    { voucher_no: 'VCH-002', nopol: 'KT 5678 CD', nominal: 300000, status: 'AVAILABLE', pom: '-' }
  ]
};

const APP_MODE = import.meta.env.VITE_APP_MODE || 'demo';
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

/**
 * [FE-005] Membungkus google.script.run dalam Promise dengan Timeout & Auto-Retry
 * @param {Object} payload
 * @param {number} attempt
 * @returns {Promise<Object>}
 */
function callGasRpc(payload, attempt = 1) {
  return new Promise((resolve, reject) => {
    // Jika google.script.run tidak tersedia di browser (bukan runtime GAS)
    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      logger.warn('[GAS BRIDGE]: google.script.run tidak tersedia. Beralih ke fallback simulasi respon.');
      return resolve({
        status: 'success',
        code: 200,
        message: 'Simulated response (GAS not detected in environment)',
        data: MOCK_DB[payload.action] || { success: true, payload: payload.data }
      });
    }

    let isSettled = false;

    // Timer Timeout (Circuit Breaker)
    const timeoutTimer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        const err = new Error(`Request timeout (${DEFAULT_TIMEOUT_MS}ms) for action '${payload.action}'`);
        logger.error(`[RPC TIMEOUT] Attempt ${attempt}:`, err.message);

        // Mekanisme Auto-Retry jika belum melebihi MAX_RETRIES
        if (attempt < MAX_RETRIES) {
          logger.info(`Retrying RPC '${payload.action}' (Attempt ${attempt + 1} of ${MAX_RETRIES})...`);
          resolve(callGasRpc(payload, attempt + 1));
        } else {
          reject({
            status: 'error',
            code: 408,
            message: 'Request Timeout: Koneksi ke server Google Apps Script melebihi batas waktu 15 detik.',
            data: null
          });
        }
      }
    }, DEFAULT_TIMEOUT_MS);

    google.script.run
      .withSuccessHandler((response) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeoutTimer);
          resolve(response);
        }
      })
      .withFailureHandler((error) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeoutTimer);
          logger.error(`[RPC FAILURE] Action '${payload.action}' Attempt ${attempt}:`, error);

          if (attempt < MAX_RETRIES) {
            logger.info(`Retrying on failure '${payload.action}' (Attempt ${attempt + 1})...`);
            resolve(callGasRpc(payload, attempt + 1));
          } else {
            reject({
              status: 'error',
              code: 500,
              message: error.message || 'Kegagalan eksekusi Google Apps Script.',
              data: null
            });
          }
        }
      })
      .apiDispatcher(payload);
  });
}

/**
 * [FE-004] API Service Utama dengan Pemisahan Mode Demo vs Production
 */
export const apiService = {
  /**
   * Panggilan API terpadu tanpa percabangan di level komponen Vue
   * @param {string} action Nama aksi RPC (misal: 'p2h.kendaraan.submit')
   * @param {Object} [data={}] Payload data
   * @param {string} [token=null] Token sesi pengguna
   * @returns {Promise<Object>} Respon terstandarisasi JSend
   */
  async call(action, data = {}, token = null) {
    logger.info(`[API CALL] Action: '${action}' | Mode: ${APP_MODE}`, data);

    // MODE DEMO (Strict Isolated — Tanpa Request Server)
    if (APP_MODE === 'demo') {
      await new Promise(r => setTimeout(r, 200)); // Simulasi jeda latensi jaringan 200ms

      // Cek apakah ada mock handler khusus
      if (action === 'p2h.kendaraan.submit') {
        const uid = `P2H-DEMO-${Date.now()}`;
        return {
          status: 'success',
          code: 200,
          message: 'Laporan P2H berhasil disimpan (Demo Mock).',
          data: { uid, statusKelayakan: 'FIT', totalNOK: 0 }
        };
      }

      if (action === 'p2h.reports.list') {
        return {
          status: 'success',
          code: 200,
          message: 'Success (Demo Mock Data)',
          data: {
            reports: [
              {
                UID: 'P2H-DEMO-001',
                Tanggal: new Date().toISOString().split('T')[0],
                Observator: 'Budi Santoso',
                Nopol: 'KT 1234 AB',
                Merk: 'Toyota Hilux',
                Status_Kelayakan: 'FIT',
                Total_Item_NOK: 0,
                Catatan_Tambahan: 'Kondisi kendaraan sangat prima'
              },
              {
                UID: 'P2H-DEMO-002',
                Tanggal: new Date().toISOString().split('T')[0],
                Observator: 'Agus Prayitno',
                Nopol: 'KT 5678 CD',
                Merk: 'Mitsubishi Triton',
                Status_Kelayakan: 'UNFIT',
                Total_Item_NOK: 2,
                Catatan_Tambahan: 'Wiper karet sobek dan lampu sein kiri mati'
              }
            ],
            summary: { total: 2, fit: 1, unfit: 1 }
          }
        };
      }

      if (action === 'p2h.supervisor.followup') {
        return {
          status: 'success',
          code: 200,
          message: `Tindak lanjut supervisor berhasil dicatat (Demo Mock).`,
          data: { uid: data.uid, status: data.actionStatus }
        };
      }

      if (action === 'vtacs.master.get') {
        return {
          status: 'success',
          code: 200,
          message: 'Success (Demo Mock Data)',
          data: {
            vouchers: [
              { code: 'VCH-2026-001', nopol: 'KT 1234 AB', fuelQuota: 50, nominal: 500000, status: 'AVAILABLE', pom: 'POM-01' },
              { code: 'VCH-2026-002', nopol: 'KT 5678 CD', fuelQuota: 60, nominal: 600000, status: 'AVAILABLE', pom: 'POM-02' },
              { code: 'VCH-2026-003', nopol: 'KT 9012 EF', fuelQuota: 40, nominal: 400000, status: 'REDEEMED', pom: 'POM-01' }
            ],
            pomList: [
              { kode: 'POM-01', nama: 'SPBU 61.751.01 Ring Road', lokasi: 'Samarinda', saldo: 15000000, terpakai: 2500000, status: 'AKTIF' },
              { kode: 'POM-02', nama: 'SPBU 64.752.02 Loa Janan', lokasi: 'Kutai Kartanegara', saldo: 20000000, terpakai: 4100000, status: 'AKTIF' },
              { kode: 'POM-03', nama: 'SPBU 61.753.03 Balikpapan KM 13', lokasi: 'Balikpapan', saldo: 18000000, terpakai: 3200000, status: 'AKTIF' }
            ]
          }
        };
      }

      if (action === 'vtacs.voucher.request') {
        const newCode = `VCH-DEMO-${Date.now()}`;
        return {
          status: 'success',
          code: 200,
          message: `Voucher ${newCode} berhasil diterbitkan (Demo Mock).`,
          data: {
            code: newCode,
            nopol: data.nopol,
            fuelQuota: data.kuotaLiter,
            nominal: data.kuotaLiter * 12500,
            status: 'AVAILABLE'
          }
        };
      }

      if (action === 'vtacs.voucher.redeem') {
        const voucherCode = data.code || data.voucherCode || 'VCH-UNKNOWN';
        return {
          status: 'success',
          code: 200,
          message: `Voucher ${voucherCode} berhasil dicairkan/diredeem di ${data.station || 'POM-01'} (Demo Mock).`,
          data: {
            txId: `TX-BBM-${Date.now()}`,
            voucherCode: voucherCode,
            liter: data.literDiisi || 50,
            nominal: data.nominal || 500000,
            station: data.station || 'POM-01'
          }
        };
      }

      if (action === 'vtacs.reconcile') {
        return {
          status: 'success',
          code: 200,
          message: 'Success (Demo Mock Reconcile)',
          data: {
            transactions: [
              { txId: 'TX-BBM-001', voucher: 'VCH-2026-003', kodePom: 'POM-01', nopol: 'KT 9012 EF', driver: 'Budi Santoso', liter: 40, nominal: 400000, timestamp: '2026-09-07T14:30:00Z' },
              { txId: 'TX-BBM-002', voucher: 'VCH-2026-001', kodePom: 'POM-01', nopol: 'KT 1234 AB', driver: 'Agus Prayitno', liter: 50, nominal: 500000, timestamp: '2026-09-08T09:15:00Z' }
            ],
            pomBalances: [
              { kode: 'POM-01', nama: 'SPBU 61.751.01 Ring Road', saldo: 15000000, terpakai: 2500000, sisa: 12500000 },
              { kode: 'POM-02', nama: 'SPBU 64.752.02 Loa Janan', saldo: 20000000, terpakai: 4100000, sisa: 15900000 }
            ],
            summary: {
              totalTransaksi: 2,
              totalLiters: 90,
              totalNominal: 900000
            }
          }
        };
      }

      if (MOCK_DB[action]) {
        return {
          status: 'success',
          code: 200,
          message: 'Success (Demo Mock Data)',
          data: MOCK_DB[action]
        };
      }

      return {
        status: 'success',
        code: 200,
        message: 'Mock Action Acknowledged',
        data: { action, receivedData: data }
      };
    }

    // MODE PRODUCTION (Live Connection ke Google Apps Script)
    const payload = {
      action: action,
      token: token || localStorage.getItem('VAMOS_AUTH_TOKEN') || '',
      data: data
    };

    try {
      const response = await callGasRpc(payload);
      return response;
    } catch (err) {
      // Jika offline dan aksi adalah submit atau redeem, simpan ke antrean IndexedDB otomatis
      if (!navigator.onLine && (action.includes('.submit') || action.includes('.redeem'))) {
        const moduleKey = action.split('.')[0].toUpperCase();
        await storageService.enqueueOfflineTask(moduleKey, action, data);
        return {
          status: 'success',
          code: 202,
          message: 'Koneksi offline: Data telah disimpan ke antrean lokal dan akan disinkronkan saat online.',
          data: { offlineQueued: true }
        };
      }
      throw err;
    }
  }
};

export default apiService;
