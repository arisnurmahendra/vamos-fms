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
    offlineQueue: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchVouchers() {
      this.loading = true;
      try {
        const res = await apiService.call('vtacs.voucher.list');
        if (res.status === 'success') {
          this.vouchers = res.data || [];
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async redeemVoucher(payload) {
      this.loading = true;
      try {
        const res = await apiService.call('vtacs.voucher.redeem', payload);
        if (res.status === 'success') {
          await this.fetchVouchers();
          return res;
        }
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async loadOfflineQueue() {
      this.offlineQueue = await storageService.getOfflineQueue('VTACS');
    }
  }
});

export const useVtacsStore = useVTACSStore;

