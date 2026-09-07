/**
 * VAMOS FMS - SmartServ Maintenance Pinia Store
 * [MTN-005] Design Maintenance Pinia Store Schema
 * Ground Truth Schema: docs/MAINTENANCE_SCHEMA.md
 */

import { defineStore } from 'pinia';
import apiService from '../services/apiService.js';
import storageService from '../services/storageService.js';
import logger from '../utils/logger.js';

export const useMaintenanceStore = defineStore('maintenance', {
  state: () => ({
    /** @type {Array<Object>} Daftar laporan kerusakan & servis */
    reports: [],
    /** @type {Array<Object>} Katalog harga satuan jasa & suku cadang */
    harsat: [],
    /** @type {Array<Object>} Master armada & jadwal servis */
    vehicles: [],
    /** @type {Array<Object>} Daftar Surat Perintah Kerja (SPK) */
    spkList: [],
    /** @type {Array<Object>} Daftar Rencana Anggaran Biaya (RAB) */
    rabList: [],
    /** @type {Array<Object>} Daftar Pengguna & Role untuk User Manager */
    usersList: [],
    /** @type {Object} Ringkasan metrik maintenance */
    summary: {
      totalLaporan: 0,
      totalEstimasi: 0,
      totalRealisasi: 0,
      statusCounts: { baru: 0, rab: 0, spk: 0, pengerjaan: 0, selesai: 0 },
      bengkelRekananCount: 5
    },
    /** @type {string} Filter status laporan */
    filterStatus: 'ALL',
    /** @type {string} Pencarian nomor laporan, nopol, keluhan */
    searchQuery: '',
    /** @type {boolean} Flag loading data */
    isLoading: false,
    /** @type {boolean} Flag submitting form */
    isSubmitting: false,
    /** @type {string|null} Pesan error */
    error: null
  }),

  getters: {
    filteredReports: (state) => {
      return state.reports.filter(r => {
        const matchStatus = state.filterStatus === 'ALL' ||
          (r.status && r.status.toUpperCase() === state.filterStatus.toUpperCase());
        const query = state.searchQuery.toLowerCase();
        const matchSearch = !state.searchQuery ||
          (r.no_laporan && r.no_laporan.toLowerCase().includes(query)) ||
          (r.nopol && r.nopol.toLowerCase().includes(query)) ||
          (r.keluhan && r.keluhan.toLowerCase().includes(query)) ||
          (r.bengkel_rekanan && r.bengkel_rekanan.toLowerCase().includes(query));
        return matchStatus && matchSearch;
      });
    },

    kpiMetrics: (state) => {
      const counts = {
        total: state.reports.length,
        baru: 0,
        spk: 0,
        pengerjaan: 0,
        selesai: 0
      };

      state.reports.forEach(r => {
        const s = (r.status || '').toUpperCase();
        if (s === 'LAPORAN_BARU') counts.baru++;
        else if (s === 'SPK_TERBIT' || s === 'RAB_DIAJUKAN') counts.spk++;
        else if (s === 'DALAM_PENGERJAAN') counts.pengerjaan++;
        else if (s === 'SELESAI') counts.selesai++;
      });

      return counts;
    }
  },

  actions: {
    /**
     * Memuat master katalog Harsat & Master Kendaraan
     */
    async fetchMasterData() {
      this.isLoading = true;
      try {
        const cached = await storageService.getItem('MAINTENANCE_MASTER_CACHE');
        if (cached) {
          this.harsat = cached.harsat || [];
          this.vehicles = cached.vehicles || [];
        }

        const [harsatRes, vehiclesRes] = await Promise.all([
          apiService.call('maintenance.harsat.list'),
          apiService.call('maintenance.vehicles.list')
        ]);

        if (harsatRes.status === 'success') this.harsat = harsatRes.data || [];
        if (vehiclesRes.status === 'success') this.vehicles = vehiclesRes.data || [];

        await storageService.setItem('MAINTENANCE_MASTER_CACHE', {
          harsat: this.harsat,
          vehicles: this.vehicles
        });
      } catch (err) {
        logger.warn('Failed to fetch maintenance master data:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Memuat daftar laporan servis aktif
     */
    async fetchReports(filter = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await apiService.call('maintenance.report.list', filter);
        if (res.status === 'success') {
          this.reports = res.data || [];
        }
      } catch (err) {
        this.error = err.message;
        logger.error('Failed to fetch maintenance reports:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Submit laporan kerusakan armada baru (MTN-008)
     */
    async submitReport(payload) {
      this.isSubmitting = true;
      this.error = null;
      try {
        const res = await apiService.call('maintenance.report.submit', payload);
        if (res.status === 'success') {
          await this.fetchReports();
          return res;
        }
        throw new Error(res.message || 'Gagal mengajukan laporan perbaikan');
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isSubmitting = false;
      }
    },

    /**
     * Update status laporan perbaikan (MTN-004 & MTN-008)
     */
    async updateReportStatus(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await apiService.call('maintenance.report.update', payload);
        if (res.status === 'success') {
          await this.fetchReports();
          return res;
        }
        throw new Error(res.message || 'Gagal memperbarui status');
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Submit Rencana Anggaran Biaya (RAB) perbaikan (MTN-011)
     */
    async submitRAB(payload) {
      this.isSubmitting = true;
      this.error = null;
      try {
        const res = await apiService.call('maintenance.rab.submit', payload);
        if (res.status === 'success') {
          await this.fetchReports();
          return res;
        }
        throw new Error(res.message || 'Gagal membuat RAB');
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isSubmitting = false;
      }
    },

    /**
     * Terbitkan Surat Perintah Kerja (SPK) ke Bengkel (MTN-012)
     */
    async createSPK(payload) {
      this.isSubmitting = true;
      this.error = null;
      try {
        const res = await apiService.call('maintenance.spk.create', payload);
        if (res.status === 'success') {
          await this.fetchSPKList();
          await this.fetchReports();
          return res;
        }
        throw new Error(res.message || 'Gagal menerbitkan SPK');
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isSubmitting = false;
      }
    },

    /**
     * Memuat daftar SPK aktif
     */
    async fetchSPKList() {
      try {
        const res = await apiService.call('maintenance.spk.list');
        if (res.status === 'success') {
          this.spkList = res.data || [];
        }
      } catch (err) {
        logger.warn('Failed to fetch SPK list:', err);
      }
    },

    /**
     * Tambah item katalog Harsat baru (MTN-009)
     */
    async addHarsatItem(payload) {
      const res = await apiService.call('maintenance.harsat.create', payload);
      if (res.status === 'success') {
        const harsatRes = await apiService.call('maintenance.harsat.list');
        if (harsatRes.status === 'success') this.harsat = harsatRes.data || [];
      }
      return res;
    },

    /**
     * Memuat daftar RAB yang pernah dibuat (MTN-011)
     */
    async fetchRABList() {
      try {
        const res = await apiService.call('maintenance.rab.list');
        if (res.status === 'success') {
          this.rabList = res.data || [];
        }
      } catch (err) {
        logger.warn('Failed to fetch RAB list:', err);
      }
    },

    /**
     * Upload Dokumen Foto / PDF ke Google Drive (MTN-014)
     */
    async uploadDocument(payload) {
      this.isSubmitting = true;
      try {
        const res = await apiService.call('maintenance.document.upload', payload);
        return res;
      } finally {
        this.isSubmitting = false;
      }
    },

    /**
     * Generate Dokumen Resmi PDF RAB / SPK (MTN-015)
     */
    async generatePDF(payload) {
      this.isLoading = true;
      try {
        const res = await apiService.call('maintenance.pdf.generate', payload);
        return res;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Perbarui item katalog Harsat (MTN-009)
     */
    async updateHarsatItem(payload) {
      const res = await apiService.call('maintenance.harsat.update', payload);
      if (res.status === 'success') {
        const harsatRes = await apiService.call('maintenance.harsat.list');
        if (harsatRes.status === 'success') this.harsat = harsatRes.data || [];
      }
      return res;
    },

    /**
     * Nonaktifkan item katalog Harsat (MTN-009)
     */
    async deleteHarsatItem(kodeItem) {
      const res = await apiService.call('maintenance.harsat.delete', { kode_item: kodeItem });
      if (res.status === 'success') {
        const harsatRes = await apiService.call('maintenance.harsat.list');
        if (harsatRes.status === 'success') this.harsat = harsatRes.data || [];
      }
      return res;
    },

    /**
     * Daftarkan armada baru (MTN-010)
     */
    async createVehicle(payload) {
      const res = await apiService.call('maintenance.vehicles.create', payload);
      if (res.status === 'success') {
        const vRes = await apiService.call('maintenance.vehicles.list');
        if (vRes.status === 'success') this.vehicles = vRes.data || [];
      }
      return res;
    },

    /**
     * Memuat daftar pengguna untuk User Manager (MTN-007 & MTN-023)
     */
    async fetchUsersList() {
      try {
        const res = await apiService.call('maintenance.users.list');
        if (res.status === 'success') {
          this.usersList = res.data || [];
        }
      } catch (err) {
        logger.warn('Failed to fetch users list:', err);
      }
    },

    /**
     * Toggle status aktif / nonaktif pengguna (MTN-023)
     */
    async toggleUserStatus(payload) {
      const res = await apiService.call('maintenance.users.toggle', payload);
      if (res.status === 'success') {
        await this.fetchUsersList();
      }
      return res;
    }
  }
});
