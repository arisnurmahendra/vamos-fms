<template>
  <div class="toast-container" aria-live="polite" aria-atomic="true">
    <transition-group name="toast-slide">
      <div 
        v-for="t in toasts" 
        :key="t.id" 
        class="toast-card" 
        :class="`toast-${t.type}`"
        role="alert"
      >
        <div class="toast-icon">
          <span v-if="t.type === 'success'">✅</span>
          <span v-else-if="t.type === 'error'">🚨</span>
          <span v-else-if="t.type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-content">
          <strong class="toast-title">{{ t.title }}</strong>
          <p class="toast-message">{{ t.message }}</p>
        </div>
        <button class="toast-close" @click="dismiss(t.id)" aria-label="Tutup notifikasi">
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { notificationService } from '../services/notificationService.js';

const toasts = notificationService.toasts;

const dismiss = (id) => {
  notificationService.dismiss(id);
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 9999;
  max-width: 420px;
  width: calc(100% - 3rem);
  pointer-events: none;
}

.toast-card {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  background: #ffffff;
  border-left: 5px solid #64748b;
  animation: fadeIn 0.2s ease-out;
}

.toast-card.toast-success {
  border-left-color: #10b981;
  background: #f0fdf4;
}
.toast-card.toast-error {
  border-left-color: #ef4444;
  background: #fef2f2;
}
.toast-card.toast-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}
.toast-card.toast-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.toast-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.toast-content {
  flex: 1;
}

.toast-title {
  display: block;
  font-size: 0.875rem;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.toast-message {
  font-size: 0.8125rem;
  color: #334155;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: #94a3b8;
  padding: 0;
  margin-left: 0.5rem;
}
.toast-close:hover {
  color: #334155;
}

/* Animations */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.95);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
