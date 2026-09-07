<template>
  <main class="container">
    <h1>VAMOS FMS</h1>
    <p>Vehicle Administration, Maintenance, and Operations System</p>
    <div class="status-box">
      <span
        >Status Mode: <strong>{{ appMode }}</strong></span
      >
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue'

const appMode = computed(() => {
  return import.meta.env.VITE_APP_MODE || 'development'
})
</script>

<style>
body {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  background-color: #f4f6f8;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}
.container {
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.status-box {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #eef2ff;
  border-radius: 6px;
  display: inline-block;
  color: #4f46e5;
}
</style>
