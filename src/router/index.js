// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import BookingView from '../views/BookingView.vue'
import MaintenanceView from '../views/MaintenanceView.vue'
import P2HView from '../views/P2HView.vue'
import VTACSView from '../views/VTACSView.vue'
import AccessDenied from '../views/AccessDenied.vue'

const routes = [
  { path: '/booking', component: BookingView, meta: { requiresAuth: true, role: 'user' } },
  { path: '/maintenance', component: MaintenanceView, meta: { requiresAuth: true, role: 'mechanic' } },
  { path: '/p2h', component: P2HView, meta: { requiresAuth: true, role: 'driver' } },
  { path: '/vtacs', component: VTACSView, meta: { requiresAuth: true, role: 'gs_admin' } },
  { path: '/access-denied', component: AccessDenied },
  { path: '/', redirect: '/booking' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// [SEC-002] Route Guarding (Frontend Layer 1)
router.beforeEach(async (to, from, next) => {
  // Rute publik / penolakan akses bebas diakses
  if (!to.meta.requiresAuth || to.path === '/access-denied') {
    return next()
  }

  // Cek token dan role dari localStorage atau handshake
  let token = localStorage.getItem('VAMOS_AUTH_TOKEN')
  let role = (localStorage.getItem('VAMOS_USER_ROLE') || 'GUEST').toUpperCase()

  // Jika belum ada token sesi, redirect ke access-denied
  if (!token) {
    return next({ path: '/access-denied', query: { reason: 'unauthenticated' } })
  }

  // SUPER_ADMIN dan ADMIN memiliki hak akses universal ke seluruh modul
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return next()
  }

  // Normalisasi pemetaan role route
  const requiredRole = (to.meta.role || '').toUpperCase()
  const roleMapping = {
    'USER': ['USER', 'AM', 'GS1', 'GS2', 'ADM1', 'ADM2'],
    'MECHANIC': ['MECHANIC', 'VENDOR_BENGKEL', 'GS1'],
    'DRIVER': ['DRIVER', 'USER', 'GS1'],
    'GS_ADMIN': ['GS_ADMIN', 'GS1', 'GS2', 'ADMIN']
  }

  const allowedRoles = roleMapping[requiredRole] || [requiredRole]
  if (allowedRoles.includes(role)) {
    return next()
  }

  // Jika role tidak memadai, redirect ke halaman AccessDenied secara instan
  return next({ path: '/access-denied', query: { reason: 'insufficient_role' } })
})

export default router