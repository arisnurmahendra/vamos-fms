/**
 * VAMOS FMS - Maintenance Pinia Store
 * [FE-003] Pinia Stores Setup
 */

import { defineStore } from 'pinia';
import apiService from '../services/apiService.js';
import logger from '../utils/logger.js';

export const useMaintenanceStore = defineStore('maintenance', {
  state: () => ({
    reports: [],
    filterStatus: 'ALL',
    searchQuery: '',
    isLoading: false,
    error: null
  }),

  actions: {
    async fetchReports() {
      this.isLoading = true;
      this.error = null;
      try {
        const res = await apiService.call('maintenance.report.list');
        if (res.status === 'success') {
          this.reports = res.data || [];
        }
      } catch (err) {
        this.error = err.message;
        logger.error('Failed to fetch maintenance reports:', err);
      } finally {
        this.isLoading = false;
      }
    }
  }
});
