/**
 * VAMOS FMS - Storage & Offline Cache Service (IndexedDB)
 * [FE-006] Offline Cache Layer via localForage (IndexedDB)
 */

import localForage from 'localforage';
import logger from '../utils/logger.js';

// Konfigurasi instance localForage untuk VAMOS FMS
const dbStore = localForage.createInstance({
  name: 'VAMOS_FMS_DB',
  storeName: 'offline_cache',
  description: 'Offline-first cache and transaction queue for VAMOS FMS'
});

export const storageService = {
  /**
   * Menyimpan data referensi ke IndexedDB
   * @param {string} key
   * @param {*} value
   */
  async setItem(key, value) {
    try {
      return await dbStore.setItem(key, value);
    } catch (err) {
      logger.error('Failed to set item in storageService:', err);
      // Fallback ke localStorage
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        logger.error('LocalStorage fallback also failed:', e);
      }
    }
  },

  /**
   * Mengambil data dari IndexedDB dengan fallback
   * @param {string} key
   * @param {*} defaultValue
   */
  async getItem(key, defaultValue = null) {
    try {
      const val = await dbStore.getItem(key);
      if (val !== null && val !== undefined) {
        return val;
      }
    } catch (err) {
      logger.warn('Failed to get item from IndexedDB, trying localStorage fallback:', err);
    }

    try {
      const fallback = localStorage.getItem(key);
      if (fallback !== null) {
        return JSON.parse(fallback);
      }
    } catch (e) {
      // ignore
    }

    return defaultValue;
  },

  /**
   * Menghapus item dari cache
   * @param {string} key
   */
  async removeItem(key) {
    try {
      await dbStore.removeItem(key);
      localStorage.removeItem(key);
    } catch (err) {
      logger.error('Failed to remove item:', err);
    }
  },

  /**
   * Menyimpan antrean transaksi offline dengan flag status
   * @param {string} module 'P2H' | 'VTACS' | 'BOOKING' | 'MAINTENANCE'
   * @param {string} action
   * @param {Object} payload
   * @returns {string} Task ID
   */
  async enqueueOfflineTask(module, action, payload) {
    const queueKey = `QUEUE_${module.toUpperCase()}`;
    const queue = (await this.getItem(queueKey, [])) || [];
    
    const taskId = `OFFLINE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const task = {
      id: taskId,
      module: module.toUpperCase(),
      action: action,
      payload: payload,
      status: 'PENDING', // PENDING | DIRTY | SYNCED
      createdAt: new Date().toISOString()
    };

    queue.push(task);
    await this.setItem(queueKey, queue);
    logger.info(`Offline task enqueued [${taskId}]:`, task);
    return taskId;
  },

  /**
   * Mengambil seluruh antrean offline untuk modul tertentu
   * @param {string} module
   * @returns {Array<Object>}
   */
  async getOfflineQueue(module) {
    const queueKey = `QUEUE_${module.toUpperCase()}`;
    return (await this.getItem(queueKey, [])) || [];
  },

  /**
   * Mengubah status item antrean offline
   * @param {string} module
   * @param {string} taskId
   * @param {'PENDING'|'DIRTY'|'SYNCED'} newStatus
   */
  async updateQueueStatus(module, taskId, newStatus) {
    const queueKey = `QUEUE_${module.toUpperCase()}`;
    const queue = (await this.getItem(queueKey, [])) || [];
    const item = queue.find(q => q.id === taskId);
    if (item) {
      item.status = newStatus;
      item.updatedAt = new Date().toISOString();
      await this.setItem(queueKey, queue);
    }
  },

  /**
   * Membersihkan antrean yang sudah berhasil disinkronkan
   * @param {string} module
   */
  async clearSyncedQueue(module) {
    const queueKey = `QUEUE_${module.toUpperCase()}`;
    const queue = (await this.getItem(queueKey, [])) || [];
    const remaining = queue.filter(q => q.status !== 'SYNCED');
    await this.setItem(queueKey, remaining);
  }
};

export default storageService;
