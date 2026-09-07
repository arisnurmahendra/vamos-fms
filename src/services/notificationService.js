/**
 * VAMOS FMS - Global Notification & Toast Service
 * [JOB-003] Toast & Snackbar Notification System Integration
 */

import { reactive, readonly } from 'vue';

const state = reactive({
  toasts: []
});

let toastCounter = 0;

export const notificationService = {
  // Readonly access to current toasts
  toasts: readonly(state.toasts),

  /**
   * Menambahkan toast baru
   * @param {Object} options
   * @param {string} options.message Pesan notifikasi
   * @param {'success'|'error'|'warning'|'info'} [options.type='info'] Varian notifikasi
   * @param {string} [options.title] Judul opsional
   * @param {number} [options.duration=4000] Durasi tayang (ms)
   * @returns {number} Toast ID
   */
  notify({ message, type = 'info', title = '', duration = 4500 }) {
    const id = ++toastCounter;
    const toast = {
      id,
      message,
      type,
      title: title || (type === 'success' ? 'Sukses' : type === 'error' ? 'Peringatan / Error' : type === 'warning' ? 'Perhatian' : 'Informasi'),
      timestamp: Date.now(),
      timer: null
    };

    state.toasts.push(toast);

    if (duration > 0) {
      toast.timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  },

  dismiss(id) {
    const idx = state.toasts.findIndex(t => t.id === id);
    if (idx !== -1) {
      if (state.toasts[idx].timer) clearTimeout(state.toasts[idx].timer);
      state.toasts.splice(idx, 1);
    }
  },

  success(message, title = '') {
    return this.notify({ message, type: 'success', title });
  },

  error(message, title = '') {
    return this.notify({ message, type: 'error', title, duration: 6000 });
  },

  warning(message, title = '') {
    return this.notify({ message, type: 'warning', title });
  },

  info(message, title = '') {
    return this.notify({ message, type: 'info', title });
  },

  clearAll() {
    state.toasts.forEach(t => { if (t.timer) clearTimeout(t.timer); });
    state.toasts.splice(0, state.toasts.length);
  }
};

export default notificationService;
