/**
 * VAMOS FMS - V-TACS Pinia Store
 * [FE-003] Pinia Stores Setup
 * Mengelola voucher BBM, saldo SPBU, dan offline queue
 */

import { defineStore } from 'pinia';
import apiService from '../services/apiService.js';
import storageService from '../services/storageService.js';

export const useVTACSStore = defineStore('vtacs', {
  state: () => ({
    vouchers: [],
    pomList: [],
    reconcileData: { transactions: [], pomBalances: [], summary: { totalTransaksi: 0, totalLiters: 0, totalNominal: 0 } },
    offlineQueue: [],
    loading: false,
    isSyncing: false,
    error: null
  }),

  actions: {
    /**
     * Memuat master voucher & daftar POM SPBU dengan caching IndexedDB
     */
    async fetchMasterData() {
      this.loading = true;
      try {
        const cached = await storageService.getItem('VTACS_MASTER_CACHE');
        if (cached) {
          this.vouchers = cached.vouchers || [];
          this.pomList = cached.pomList || [];
        }

        const res = await apiService.call('vtacs.master.get');
        if (res.status === 'success' && res.data) {
          this.vouchers = res.data.vouchers || [];
          this.pomList = res.data.pomList || [];
          await storageService.setItem('VTACS_MASTER_CACHE', res.data);
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchVouchers() {
      await this.fetchMasterData();
    },

    /**
     * Permintaan voucher virtual baru
     */
    async requestVoucher(payload) {
      this.loading = true;
      try {
        const res = await apiService.call('vtacs.voucher.request', payload);
        if (res.status === 'success') {
          await this.fetchMasterData();
          return res;
        }
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Pelaporan klaim pemakaian BBM / redeem voucher
     */
    async redeemVoucher(payload) {
      this.loading = true;
      try {
        if (!navigator.onLine) {
          const taskId = await storageService.enqueueOfflineTask('VTACS', 'vtacs.voucher.redeem', payload);
          // Optimistic local update agar voucher terlihat redeemed saat offline
          const targetCode = payload.code || payload.voucherCode;
          const v = this.vouchers.find(item => item.code === targetCode);
          if (v) {
            v.status = 'REDEEMED';
          }
          await this.loadOfflineQueue();
          return {
            status: 'offline_queued',
            code: 202,
            taskId,
            message: 'Mode Offline: Transaksi redeem dicatat dalam antrean lokal IndexedDB dan akan disinkronkan saat online.'
          };
        }

        const res = await apiService.call('vtacs.voucher.redeem', payload);
        if (res.status === 'success' || res.code === 202) {
          await this.loadOfflineQueue();
          await this.fetchMasterData();
          return res;
        }
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Mengambil data rekonsiliasi finansial BBM (GA & Vendor POM)
     */
    async fetchReconcile(filter = {}) {
      this.loading = true;
      try {
        const res = await apiService.call('vtacs.reconcile', filter);
        if (res.status === 'success' && res.data) {
          this.reconcileData = res.data;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Memuat antrean transaksi BBM offline dari IndexedDB
     */
    async loadOfflineQueue() {
      this.offlineQueue = await storageService.getOfflineQueue('VTACS');
    },

    /**
     * Sinkronisasi antrean transaksi offline saat online kembali
     */
    async syncOfflineQueue() {
      if (!navigator.onLine) return;
      this.isSyncing = true;
      try {
        const queue = await storageService.getOfflineQueue('VTACS');
        for (const task of queue) {
          if (task.status === 'PENDING') {
            try {
              const res = await apiService.call(task.action, task.payload);
              if (res.status === 'success') {
                await storageService.updateQueueStatus('VTACS', task.id, 'SYNCED');
              }
            } catch (syncErr) {
              console.warn(`Failed syncing VTACS task ${task.id}:`, syncErr);
            }
          }
        }
        await storageService.clearSyncedQueue('VTACS');
        await this.loadOfflineQueue();
        await this.fetchMasterData();
      } catch (err) {
        console.error('VTACS sync failed:', err);
      } finally {
        this.isSyncing = false;
      }
    }
  }
});

export const useVtacsStore = useVTACSStore;


