/**
 * VAMOS FMS - P2H Pinia Store
 * [FE-003] Pinia Stores Setup
 * Mengelola form inspeksi harian, master data, dan auto-fill localStorage
 */

import { defineStore } from 'pinia';
import apiService from '../services/apiService.js';
import storageService from '../services/storageService.js';
import logger from '../utils/logger.js';

export const useP2HStore = defineStore('p2h', {
  state: () => ({
    subkonList: [],
    kendaraanList: [],
    lastVehicleProfile: JSON.parse(localStorage.getItem('VAMOS_P2H_LAST_VEHICLE') || 'null'),
    reports: [],
    summary: { total: 0, fit: 0, unfit: 0 },
    offlineQueue: [],
    isLoading: false,
    isSubmitting: false,
    isSyncing: false,
    error: null,
    lastSubmitResult: null
  }),

  actions: {
    /**
     * Memuat master dropdown subkon dan kendaraan dengan caching IndexedDB
     */
    async loadMasterData() {
      this.isLoading = true;
      try {
        // Cek cache lokal terlebih dahulu
        const cached = await storageService.getItem('P2H_MASTER_CACHE');
        if (cached) {
          this.subkonList = cached.subkon || [];
          this.kendaraanList = cached.kendaraan || [];
        }

        // Ambil data terbaru dari server
        const res = await apiService.call('p2h.master.get');
        if (res.status === 'success' && res.data) {
          this.subkonList = res.data.subkon || [];
          this.kendaraanList = res.data.kendaraan || [];
          await storageService.setItem('P2H_MASTER_CACHE', res.data);
        }
      } catch (err) {
        logger.warn('Using offline master data cache for P2H:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Menyimpan profil kendaraan terakhir ke localStorage untuk auto-fill
     */
    saveLastVehicleProfile(profile) {
      this.lastVehicleProfile = profile;
      localStorage.setItem('VAMOS_P2H_LAST_VEHICLE', JSON.stringify(profile));
    },

    /**
     * Mengambil daftar laporan inspeksi P2H untuk dasbor GA & SPV
     */
    async fetchReports(filter = {}) {
      this.isLoading = true;
      try {
        const res = await apiService.call('p2h.reports.list', filter);
        if (res.status === 'success' && res.data) {
          this.reports = res.data.reports || [];
          this.summary = res.data.summary || { total: 0, fit: 0, unfit: 0 };
        }
      } catch (err) {
        this.error = err.message;
        logger.error('Failed to fetch P2H reports:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Memuat antrean offline P2H dari IndexedDB
     */
    async loadOfflineQueue() {
      this.offlineQueue = await storageService.getOfflineQueue('P2H');
    },

    /**
     * Sinkronisasi antrean offline P2H ke backend saat sinyal internet kembali
     */
    async syncOfflineQueue() {
      if (!navigator.onLine) return;
      this.isSyncing = true;
      try {
        const queue = await storageService.getOfflineQueue('P2H');
        for (const task of queue) {
          if (task.status === 'PENDING') {
            try {
              const res = await apiService.call(task.action, task.payload);
              if (res.status === 'success') {
                await storageService.updateQueueStatus('P2H', task.id, 'SYNCED');
              }
            } catch (syncErr) {
              logger.warn(`Failed syncing task ${task.id}:`, syncErr);
            }
          }
        }
        await storageService.clearSyncedQueue('P2H');
        await this.loadOfflineQueue();
      } catch (err) {
        logger.error('Sync offline queue failed:', err);
      } finally {
        this.isSyncing = false;
      }
    },

    /**
     * Follow up temuan NOK supervisor
     */
    async followUpReport(uid, actionStatus, followUpNotes) {
      this.isSubmitting = true;
      try {
        const res = await apiService.call('p2h.supervisor.followup', {
          uid,
          actionStatus,
          followUpNotes
        });
        if (res.status === 'success') {
          await this.fetchReports();
          return res;
        }
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isSubmitting = false;
      }
    },

    /**
     * Mengirimkan formulir P2H ke backend
     */
    async submitP2H(formData) {
      this.isSubmitting = true;
      this.error = null;

      try {
        const res = await apiService.call('p2h.kendaraan.submit', formData);
        if (res.status === 'success' || res.code === 202) {
          this.lastSubmitResult = res.data;
          this.saveLastVehicleProfile({
            observator: formData.observator,
            subkon: formData.subkon,
            merk: formData.merk,
            nopol: formData.nopol,
            jenis: formData.jenis
          });
          await this.loadOfflineQueue();
          return res;
        } else {
          throw new Error(res.message || 'Gagal menyimpan laporan.');
        }
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isSubmitting = false;
      }
    }
  }
});
