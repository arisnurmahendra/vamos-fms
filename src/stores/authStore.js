/**
 * VAMOS FMS - Auth Pinia Store
 * [FE-003] Pinia Stores Setup
 */

import { defineStore } from 'pinia';
import apiService from '../services/apiService.js';
import logger from '../utils/logger.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('VAMOS_USER_PROFILE') || 'null'),
    token: localStorage.getItem('VAMOS_AUTH_TOKEN') || null,
    role: localStorage.getItem('VAMOS_USER_ROLE') || 'GUEST',
    isLoading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userEmail: (state) => state.user?.email || 'Tamu',
    isAdmin: (state) => state.role === 'SUPER_ADMIN' || state.role === 'ADMIN'
  },

  actions: {
    /**
     * Melakukan initial handshake untuk mendapatkan token sesi
     */
    async performHandshake() {
      this.isLoading = true;
      this.error = null;

      try {
        const res = await apiService.call('auth.handshake');
        if (res.status === 'success' && res.data) {
          this.token = res.data.token;
          this.role = res.data.role || 'USER';
          this.user = { email: res.data.email, role: this.role };

          localStorage.setItem('VAMOS_AUTH_TOKEN', this.token);
          localStorage.setItem('VAMOS_USER_ROLE', this.role);
          localStorage.setItem('VAMOS_USER_PROFILE', JSON.stringify(this.user));
          logger.info('Handshake success:', this.user);
        }
      } catch (err) {
        this.error = err.message || 'Gagal melakukan autentikasi sesi.';
        logger.error('Handshake failed:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async checkAuth() {
      if (this.token && this.user) {
        return this.user;
      }
      return await this.performHandshake();
    },

    logout() {
      this.user = null;
      this.token = null;
      this.role = 'GUEST';
      localStorage.removeItem('VAMOS_AUTH_TOKEN');
      localStorage.removeItem('VAMOS_USER_ROLE');
      localStorage.removeItem('VAMOS_USER_PROFILE');
    }
  }
});
