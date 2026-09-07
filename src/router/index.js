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

export default router