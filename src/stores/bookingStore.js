/**
 * VAMOS FMS - Booking Pinia Store
 * [FE-003] Pinia Stores Setup
 */

import { defineStore } from 'pinia';
import apiService from '../services/apiService.js';
import logger from '../utils/logger.js';

export const useBookingStore = defineStore('booking', {
  state: () => ({
    bookings: [],
    vehicles: [],
    filterStatus: 'ALL',
    searchQuery: '',
    isLoading: false,
    error: null
  }),

  getters: {
    filteredBookings: (state) => {
      return state.bookings.filter(b => {
        const matchesStatus = state.filterStatus === 'ALL' || b.status === state.filterStatus;
        const matchesSearch = !state.searchQuery || 
          b.nopol?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          b.peminjam?.toLowerCase().includes(state.searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      });
    }
  },

  actions: {
    async fetchBookings() {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await apiService.call('booking.list');
        if (res.status === 'success') {
          this.bookings = res.data || [];
        }
      } catch (err) {
        this.error = err.message;
        logger.error('Failed to fetch bookings:', err);
      } finally {
        this.isLoading = false;
      }
    }
  }
});
