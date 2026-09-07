# 🎨 Panduan Frontend — VAMOS FMS

## Stack Teknologi

| Teknologi                | Versi     | Kegunaan                            |
| ------------------------ | --------- | ----------------------------------- |
| Vue.js 3                 | ^3.5.42   | Framework UI (Composition API)      |
| Vue Router               | —         | Client-side routing (Hash mode)     |
| Pinia                    | —         | State management                    |
| Vite                     | ^8.2.2    | Build tool & dev server             |
| vite-plugin-singlefile   | ^2.3.3    | Bundle semua ke satu index.html     |
| localForage              | ^1.10.0   | IndexedDB wrapper (offline cache)   |
| CryptoJS                 | ^4.2.0    | Enkripsi data sensitif (AES-256)    |
| lodash-es                | ^4.18.1   | Utilitas (debounce, throttle, dll.) |

---

## Konvensi & Aturan

### Struktur Komponen

```
src/
├── views/              # Page-level components (1 per route)
│   ├── BookingView.vue
│   ├── MaintenanceView.vue
│   ├── P2HView.vue
│   ├── VTACSView.vue
│   └── AccessDenied.vue
├── components/         # Reusable UI components
│   ├── layout/         # Sidebar, Navbar, Footer
│   ├── common/         # Button, Modal, Toast, Skeleton
│   └── forms/          # Input fields, Select, DatePicker
├── stores/             # Pinia stores
│   ├── authStore.js
│   ├── bookingStore.js
│   ├── maintenanceStore.js
│   ├── p2hStore.js
│   └── vtacsStore.js
├── services/           # Business logic layer
│   ├── ApiService.js   # Abstraksi Demo vs Production
│   ├── GasRepository.js
│   └── MockRepository.js
├── utils/              # Helper functions
│   ├── logger.js       # Smart Logger
│   ├── crypto.js       # CryptoJS wrapper
│   └── gasCall.js      # Promise Wrapper google.script.run
└── mock/               # Mock data untuk demo mode
    └── *.json
```

### Penamaan File

| Tipe                  | Convention     | Contoh                    |
| --------------------- | -------------- | ------------------------- |
| View components       | PascalCase     | `BookingView.vue`         |
| Reusable components   | PascalCase     | `SidebarNav.vue`          |
| Stores                | camelCase      | `authStore.js`            |
| Services / Utils      | camelCase      | `apiService.js`           |
| Mock data             | kebab-case     | `booking-data.json`       |
| CSS classes           | kebab-case     | `.card-header`            |

### Komponen Vue

Semua komponen **WAJIB** menggunakan `<script setup>` (Composition API):

```vue
<template>
  <div class="booking-card">
    <h2>{{ title }}</h2>
    <slot />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true }
})
</script>

<style scoped>
.booking-card {
  /* scoped styles */
}
</style>
```

---

## Routing

### Konfigurasi Aktif

Router menggunakan **Hash Mode** (`createWebHashHistory`) karena GAS menyajikan app dalam iframe — URL path standar tidak tersedia.

```javascript
const routes = [
  { path: '/booking',      component: BookingView,      meta: { requiresAuth: true, role: 'user' } },
  { path: '/maintenance',  component: MaintenanceView,  meta: { requiresAuth: true, role: 'mechanic' } },
  { path: '/p2h',          component: P2HView,          meta: { requiresAuth: true, role: 'driver' } },
  { path: '/vtacs',        component: VTACSView,        meta: { requiresAuth: true, role: 'gs_admin' } },
  { path: '/access-denied', component: AccessDenied },
  { path: '/',             redirect: '/booking' }
]
```

### Role-Based Route Guard (Planned)

```javascript
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/access-denied')
  } else if (to.meta.role && authStore.role !== to.meta.role) {
    next('/access-denied')
  } else {
    next()
  }
})
```

---

## State Management (Pinia)

### Contoh Store Pattern

```javascript
// stores/authStore.js
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('vamos_token') || null,
    email: null,
    role: null,
    isAuthenticated: false
  }),

  actions: {
    setSession({ token, email, role }) {
      this.token = token
      this.email = email
      this.role = role
      this.isAuthenticated = true
      localStorage.setItem('vamos_token', token)
    },

    clearSession() {
      this.$reset()
      localStorage.removeItem('vamos_token')
    }
  }
})
```

---

## Dual-Mode API Layer

### ApiService.js (Planned)

```javascript
// services/ApiService.js
import { GasRepository } from './GasRepository.js'
import { MockRepository } from './MockRepository.js'

const isDemo = import.meta.env.VITE_APP_MODE === 'demo'

export const api = isDemo ? MockRepository : GasRepository
```

Komponen Vue hanya berinteraksi dengan `api`:

```javascript
import { api } from '@/services/ApiService.js'

const bookings = await api.getBookings({ month: '2026-09' })
```

---

## Offline Caching (localForage)

### Sync Status Pattern

```javascript
// Setiap record di IndexedDB memiliki sync metadata:
{
  id: 'booking-001',
  data: { ... },
  syncStatus: 'SYNCED',    // SYNCED | DIRTY | DELETED
  lastModifiedAt: '2026-09-07T10:00:00Z'
}
```

| Status    | Arti                                                |
| --------- | --------------------------------------------------- |
| `SYNCED`  | Data sama dengan server                             |
| `DIRTY`   | Data diubah secara lokal, belum sync ke server      |
| `DELETED` | Data dihapus lokal, menunggu konfirmasi penghapusan |

---

## Smart Logger

```javascript
// utils/logger.js
const isDev = import.meta.env.DEV
const viewLog = import.meta.env.VITE_VIEW_LOG === 'true'

export const logger = {
  log: (...args) => (isDev || viewLog) && console.log('[VAMOS]', ...args),
  warn: (...args) => (isDev || viewLog) && console.warn('[VAMOS]', ...args),
  error: (...args) => console.error('[VAMOS]', ...args) // Error selalu tampil
}
```
