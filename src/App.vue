<template>
  <div class="app-layout">
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
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from './stores/authStore.js'

const authStore = useAuthStore()

const appMode = computed(() => {
  return import.meta.env.VITE_APP_MODE || 'development'
})

onMounted(async () => {
  await authStore.performHandshake()
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
