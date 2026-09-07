<template>
  <div class="module-container">
    <header class="module-header">
      <div class="header-titles">
        <h2>⚙️ Maintenance Tracker (SmartServ)</h2>
        <p class="subtitle">Manajemen siklus hidup armada, riwayat servis, pembuatan SPK, dan estimasi biaya (RAB).</p>
      </div>
      <button class="btn btn-warning" @click="fetchData">Segarkan Data</button>
    </header>

    <section class="card">
      <h3>Riwayat Servis & Perbaikan</h3>
      <SkeletonLoader v-if="maintenanceStore.isLoading" type="table" :count="3" />
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>No. Laporan</th>
            <th>Nopol</th>
            <th>Keluhan / Servis</th>
            <th>Estimasi Biaya</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in maintenanceStore.reports" :key="r.no_laporan">
            <td><strong>{{ r.no_laporan }}</strong></td>
            <td>{{ r.nopol }}</td>
            <td>{{ r.keluhan }}</td>
            <td>Rp {{ Number(r.estimasi_biaya || 0).toLocaleString('id-ID') }}</td>
            <td><span class="badge" :class="r.status?.toLowerCase()">{{ r.status }}</span></td>
          </tr>
          <tr v-if="maintenanceStore.reports.length === 0">
            <td colspan="5" class="empty-state">Tidak ada catatan servis aktif.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useMaintenanceStore } from '../stores/maintenanceStore.js';
import SkeletonLoader from '../components/SkeletonLoader.vue';

const maintenanceStore = useMaintenanceStore();

const fetchData = () => {
  maintenanceStore.fetchReports();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.module-container { display: flex; flex-direction: column; gap: 1.5rem; }
.module-header {
  display: flex; justify-content: space-between; align-items: center;
  background: white; padding: 1.25rem 1.5rem; border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
.header-titles h2 { margin: 0; font-size: 1.35rem; color: #0f172a; }
.subtitle { margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #64748b; }
.card {
  background: white; padding: 1.5rem; border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th, .data-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; }
.data-table th { background: #f8fafc; color: #475569; font-size: 0.8rem; text-transform: uppercase; }
.badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; background: #e2e8f0; }
.badge.spk_terbit { background: #fed7aa; color: #9a3412; }
.badge.selesai { background: #bbf7d0; color: #166534; }
.empty-state { text-align: center; color: #94a3b8; padding: 2rem !important; }
.btn {
  padding: 0.55rem 1.15rem; border: none; border-radius: 6px;
  font-weight: 600; cursor: pointer;
}
.btn-warning { background: #f59e0b; color: white; }
.btn-warning:hover { background: #d97706; }
</style>
