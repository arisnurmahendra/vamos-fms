<template>
  <div class="access-denied container">
    <div class="card error-card">
      <div class="icon-circle">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h2>403 - Akses Ditolak</h2>
      <p class="description">
        Anda tidak memiliki izin Role yang memadai untuk mengakses modul ini. Silakan hubungi Administrator Sistem untuk peningkatan hak akses.
      </p>

      <div class="action-box">
        <router-link to="/" class="btn btn-primary">
          Kembali ke Beranda
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 1.5rem;
}
.error-card {
  max-width: 480px;
  width: 100%;
  text-align: center;
  padding: 2.5rem 2rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #fee2e2;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fee2e2;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
}
.icon {
  width: 32px;
  height: 32px;
}
h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
}
.description {
  color: #64748b;
  font-size: 0.925rem;
  line-height: 1.5;
  margin-bottom: 2rem;
}
.btn {
  display: inline-block;
  padding: 0.65rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  background-color: #2563eb;
  color: #ffffff;
  transition: background-color 0.2s;
}
.btn:hover {
  background-color: #1d4ed8;
}
</style>
