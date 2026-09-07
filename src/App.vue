<template>
  <div class="app-layout">
    <!-- [JOB-004] Offline Network State Alert Banner -->
    <div v-if="isOffline" class="offline-banner" role="alert">
      <div class="offline-content">
        <span class="offline-icon">⚠️</span>
        <div class="offline-text">
          <strong>Mode Offline Aktif:</strong> Koneksi internet terputus. Data formulir dan transaksi Anda akan disimpan otomatis ke IndexedDB lokal dan disinkronkan saat koneksi pulih kembali.
        </div>
      </div>
      <div class="offline-actions">
        <span v-if="pendingOfflineCount > 0" class="offline-counter">
          {{ pendingOfflineCount }} Menunggu Sinkron
        </span>
        <button class="btn btn-xs btn-sync-offline" @click="checkSync">
          🔄 Cek & Sinkron
        </button>
      </div>
    </div>

    <header class="app-header">
      <div class="brand">
        <span class="logo-icon">🚗</span>
        <h1>VAMOS FMS</h1>
        <span class="badge mode-badge" :class="appMode">{{ appMode }}</span>
      </div>
      <nav class="nav-links">
        <router-link to="/booking" class="nav-item">Booking</router-link>
        <router-link to="/maintenance" class="nav-item">Maintenance</router-link>
        <router-link to="/p2h" class="nav-item">P2H Checklist</router-link>
        <router-link to="/vtacs" class="nav-item">VTACS Fuel</router-link>
      </nav>
      <div class="user-badge" v-if="authStore.user">
        <span class="user-role">{{ authStore.user.role }}</span>
        <span class="user-email">{{ authStore.user.email }}</span>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <!-- [JOB-003] Global Toast & Snackbar Notification Component -->
    <ToastNotification />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/authStore.js'
import ToastNotification from './components/ToastNotification.vue'
import notificationService from './services/notificationService.js'
import storageService from './services/storageService.js'

const authStore = useAuthStore()

const appMode = computed(() => {
  return import.meta.env.VITE_APP_MODE || 'development'
})

// [JOB-004] Network State Detection
const isOffline = ref(!navigator.onLine)
const pendingOfflineCount = ref(0)

const updateOnlineStatus = async () => {
  const wasOffline = isOffline.value
  isOffline.value = !navigator.onLine

  if (wasOffline && !isOffline.value) {
    notificationService.success('Koneksi internet pulih kembali! Memulai sinkronisasi antrean otomatis...', 'Jaringan Pulih')
    await syncPendingQueue()
  } else if (isOffline.value) {
    notificationService.warning('Perangkat beralih ke mode offline. Penyimpanan transaksi dialihkan ke IndexedDB lokal.', 'Mode Offline Aktif')
    await refreshPendingCount()
  }
}

const refreshPendingCount = async () => {
  try {
    const tasks = await storageService.getPendingOfflineTasks()
    pendingOfflineCount.value = tasks ? tasks.length : 0
  } catch (e) {
    pendingOfflineCount.value = 0
  }
}

const syncPendingQueue = async () => {
  try {
    await refreshPendingCount()
    if (pendingOfflineCount.value > 0) {
      await storageService.syncOfflineQueue()
      notificationService.success(`Berhasil menyinkronkan transaksi offline ke server.`, 'Sinkronisasi Selesai')
      await refreshPendingCount()
    }
  } catch (err) {
    notificationService.error(`Gagal sinkronisasi antrean: ${err.message}`, 'Sinkronisasi Gagal')
  }
}

const checkSync = async () => {
  await updateOnlineStatus()
  if (!isOffline.value) {
    await syncPendingQueue()
  } else {
    notificationService.warning('Jaringan internet masih belum tersedia. Data tersimpan aman di lokal.', 'Offline')
  }
}

onMounted(async () => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  await authStore.performHandshake()
  await refreshPendingCount()
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style>
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f8fafc;
  color: #1e293b;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Offline Banner (JOB-004) */
.offline-banner {
  background: #fffbeb;
  border-bottom: 2px solid #f59e0b;
  color: #92400e;
  padding: 0.65rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
  z-index: 60;
}
.offline-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.offline-icon {
  font-size: 1.2rem;
}
.offline-text {
  line-height: 1.35;
}
.offline-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}
.offline-counter {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fcd34d;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.btn-sync-offline {
  background: #f59e0b;
  color: #ffffff;
  border: none;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.75rem;
}
.btn-sync-offline:hover {
  background: #d97706;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 50;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.logo-icon {
  font-size: 1.25rem;
}
.brand h1 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.025em;
  color: #0f172a;
}
.mode-badge {
  font-size: 0.6875rem;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
}
.mode-badge.demo {
  background: #fef3c7;
  color: #b45309;
}
.mode-badge.production {
  background: #dcfce7;
  color: #15803d;
}
.nav-links {
  display: flex;
  gap: 0.5rem;
}
.nav-item {
  text-decoration: none;
  color: #64748b;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}
.nav-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.nav-item.router-link-active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}
.user-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}
.user-role {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.6875rem;
}
.user-email {
  color: #64748b;
}
.main-content {
  flex: 1;
  padding-bottom: 3rem;
}
</style>
