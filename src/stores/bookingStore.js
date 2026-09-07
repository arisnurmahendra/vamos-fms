/**
 * VAMOS FMS - Booking Pinia Store
 * [BKG-002] Design Booking Pinia Store Schema
 * Ground Truth Schema: docs/BOOKING_SCHEMA.md
 * State Machine: docs/BOOKING_APPROVAL_FLOW.md
 */

import { defineStore } from 'pinia';
import apiService from '../services/apiService.js';
import storageService from '../services/storageService.js';
import logger from '../utils/logger.js';

export const useBookingStore = defineStore('booking', {
  state: () => ({
    /** @type {Array<Object>} Daftar transaksi peminjaman */
    bookings: [],
    /** @type {Array<Object>} Master Nopol kendaraan roda 4 */
    vehicles: [],
    /** @type {Array<Object>} Master User peminjam */
    users: [],
    /** @type {Array<Object>} Master Atasan approver & no WA */
    approvers: [],
    /** @type {Array<Object>} Antrean pesan WA Outbox */
    outbox: [],
    /** @type {Object|null} Booking terpilih untuk modal/detail */
    currentBooking: null,
    /** @type {string} Filter status booking */
    filterStatus: 'ALL',
    /** @type {string} Pencarian nopol/peminjam/UID */
    searchQuery: '',
    /** @type {boolean} Flag loading data */
    isLoading: false,
    /** @type {boolean} Flag submitting form */
    isSubmitting: false,
    /** @type {string|null} Pesan error */
    error: null
  }),

  getters: {
    /**
     * Menyaring daftar booking berdasarkan status dan kata kunci
     */
    filteredBookings: (state) => {
      return state.bookings.filter(b => {
        const matchesStatus = state.filterStatus === 'ALL' || 
          (b.status && b.status.toUpperCase() === state.filterStatus.toUpperCase());
        const query = state.searchQuery.toLowerCase();
        const matchesSearch = !state.searchQuery || 
          (b.uid && b.uid.toLowerCase().includes(query)) ||
          (b.nopol && b.nopol.toLowerCase().includes(query)) ||
          (b.peminjam && b.peminjam.toLowerCase().includes(query)) ||
          (b.keperluan && b.keperluan.toLowerCase().includes(query));
        return matchesStatus && matchesSearch;
      });
    },

    /**
     * Hitung total per status untuk KPI dasbor
     */
    statusCounts: (state) => {
      const counts = {
        total: state.bookings.length,
        pending_am: 0,
        pending_gs1: 0,
        on_trip: 0,
        completed: 0,
        rejected: 0
      };

      state.bookings.forEach(b => {
        const s = (b.status || '').toUpperCase();
        if (s === 'PENDING_AM') counts.pending_am++;
        else if (s === 'PENDING_GS1') counts.pending_gs1++;
        else if (s === 'ON_TRIP' || s === 'PENDING_GS2') counts.on_trip++;
        else if (s === 'COMPLETED') counts.completed++;
        else if (s === 'REJECTED') counts.rejected++;
      });

      return counts;
    }
  },

  actions: {
    /**
     * Memuat master data Nopol, User, dan Approver dengan cache IndexedDB
     */
    async fetchMasterData() {
      this.isLoading = true;
      try {
        const cached = await storageService.getItem('BOOKING_MASTER_CACHE');
        if (cached) {
          this.vehicles = cached.nopolList || [];
          this.users = cached.userList || [];
          this.approvers = cached.atasanList || [];
        }

        const res = await apiService.call('booking.master.get');
        if (res.status === 'success' && res.data) {
          this.vehicles = res.data.nopolList || [];
          this.users = res.data.userList || [];
          this.approvers = res.data.atasanList || [];
          await storageService.setItem('BOOKING_MASTER_CACHE', res.data);
        }
      } catch (err) {
        logger.warn('Failed to fetch booking master data, using fallback:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Memuat daftar seluruh booking aktif
     */
    async fetchBookings(filter = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await apiService.call('booking.list', filter);
        if (res.status === 'success') {
          this.bookings = res.data || [];
        }
      } catch (err) {
        this.error = err.message;
        logger.error('Failed to fetch bookings:', err);
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Submit permohonan peminjaman kendaraan baru (BKG-006)
     */
    async submitBooking(payload) {
      this.isSubmitting = true;
      this.error = null;
      try {
        const res = await apiService.call('booking.submit', payload);
        if (res.status === 'success') {
          await this.fetchBookings();
          return res;
        }
        throw new Error(res.message || 'Gagal mengajukan booking');
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isSubmitting = false;
      }
    },

    /**
     * Memproses persetujuan (Approve/Reject) pada state machine (BKG-012)
     */
    async processApproval(payload) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await apiService.call('booking.approval.process', payload);
        if (res.status === 'success') {
          await this.fetchBookings();
          return res;
        }
        throw new Error(res.message || 'Gagal memproses approval');
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Eksekusi Quick Approval via tautan WhatsApp (BKG-005 & BKG-019)
     */
    async processWAApproval(params) {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await apiService.call('booking.wa.approve', params);
        if (res.status === 'success') {
          await this.fetchBookings();
          return res;
        }
        throw new Error(res.message || 'Verifikasi approval WA gagal');
      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Manajemen Nopol CRUD
     */
    async addVehicle(payload) {
      const res = await apiService.call('booking.nopol.create', payload);
      if (res.status === 'success') await this.fetchMasterData();
      return res;
    },

    async deleteVehicle(nopol) {
      const res = await apiService.call('booking.nopol.delete', { nopol });
      if (res.status === 'success') await this.fetchMasterData();
      return res;
    },

    /**
     * Manajemen User CRUD
     */
    async addUser(payload) {
      const res = await apiService.call('booking.user.create', payload);
      if (res.status === 'success') await this.fetchMasterData();
      return res;
    },

    /**
     * Manajemen Atasan Approver CRUD
     */
    async addApprover(payload) {
      const res = await apiService.call('booking.atasan.create', payload);
      if (res.status === 'success') await this.fetchMasterData();
      return res;
    },

    /**
     * Memuat antrean WhatsApp Outbox
     */
    async fetchOutbox() {
      try {
        const res = await apiService.call('booking.outbox.list');
        if (res.status === 'success') {
          this.outbox = res.data || [];
        }
      } catch (err) {
        logger.warn('Failed to fetch WA outbox:', err);
      }
    }
  }
});
