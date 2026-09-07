<template>
  <div class="vtacs-view container">
    <div class="header-section">
      <div class="title-group">
        <h2>VTACS - Voucher & Fuel Tracking</h2>
        <p class="subtitle">Vehicle Tracking, Allocation & Control System with POM Offline Redemption</p>
      </div>
      <div class="actions">
        <button class="btn btn-primary" @click="openClaimModal">
          <span class="btn-icon">+</span> Redeem Voucher
        </button>
        <button class="btn btn-secondary" @click="vtacsStore.fetchVouchers()" :disabled="vtacsStore.loading">
          {{ vtacsStore.loading ? 'Syncing...' : 'Sync Quota' }}
        </button>
      </div>
    </div>

    <!-- Offline Queue Alert -->
    <div v-if="vtacsStore.offlineQueue.length > 0" class="offline-badge">
      <span class="pulse-dot"></span>
      {{ vtacsStore.offlineQueue.length }} Voucher redemption(s) pending sync in local storage.
    </div>

    <!-- Error Alert -->
    <div v-if="vtacsStore.error" class="alert alert-error">
      {{ vtacsStore.error }}
      <button class="close-btn" @click="vtacsStore.error = null">&times;</button>
    </div>

    <!-- Loading Skeleton -->
    <SkeletonLoader v-if="vtacsStore.loading && vtacsStore.vouchers.length === 0" type="table" :rows="4" />

    <!-- Summary Metrics -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Active Vouchers</span>
        <span class="stat-value">{{ activeVouchersCount }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Fuel Allocated (Liters)</span>
        <span class="stat-value">{{ totalFuelLiters }} L</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">POM Station Network</span>
        <span class="stat-value">6 Stations</span>
      </div>
    </div>

    <!-- Vouchers List Table -->
    <div class="card table-container">
      <div class="table-header">
        <h3>Voucher Ledger</h3>
        <span class="badge">{{ vtacsStore.vouchers.length }} Entries</span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Voucher Code</th>
            <th>Vehicle / Unit</th>
            <th>Quota (Liters)</th>
            <th>Status</th>
            <th>Assigned Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="vtacsStore.vouchers.length === 0">
            <td colspan="6" class="text-center py-4">No vouchers found or redeemed.</td>
          </tr>
          <tr v-for="voucher in vtacsStore.vouchers" :key="voucher.id">
            <td class="font-mono font-bold">{{ voucher.code }}</td>
            <td>{{ voucher.vehicleNumber }}</td>
            <td><strong>{{ voucher.fuelQuota }} L</strong></td>
            <td>
              <span :class="['status-pill', `status-${voucher.status.toLowerCase()}`]">
                {{ voucher.status }}
              </span>
            </td>
            <td>{{ voucher.date }}</td>
            <td>
              <button 
                v-if="voucher.status === 'Active'" 
                class="btn btn-sm btn-outline" 
                @click="redeemQuick(voucher)"
              >
                Redeem
              </button>
              <span v-else class="text-muted">Redeemed</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useVtacsStore } from '../stores/vtacsStore.js';
import SkeletonLoader from '../components/SkeletonLoader.vue';

const vtacsStore = useVtacsStore();

onMounted(async () => {
  await vtacsStore.fetchVouchers();
});

const activeVouchersCount = computed(() => {
  return vtacsStore.vouchers.filter(v => v.status === 'Active').length;
});

const totalFuelLiters = computed(() => {
  return vtacsStore.vouchers.reduce((acc, v) => acc + (Number(v.fuelQuota) || 0), 0);
});

const openClaimModal = async () => {
  const code = prompt('Enter Voucher Code to redeem at POM station:');
  if (code) {
    try {
      await vtacsStore.redeemVoucher({ code, station: 'POM-Central-01', timestamp: new Date().toISOString() });
      alert(`Voucher ${code} successfully processed!`);
    } catch (err) {
      alert(`Failed to redeem: ${err.message}`);
    }
  }
};

const redeemQuick = async (voucher) => {
  if (confirm(`Confirm redemption of voucher ${voucher.code} (${voucher.fuelQuota} L)?`)) {
    try {
      await vtacsStore.redeemVoucher({ code: voucher.code, station: 'POM-Central-01' });
    } catch (err) {
      alert(`Redemption error: ${err.message}`);
    }
  }
};
</script>

<style scoped>
.container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.title-group h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}
.subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}
.actions {
  display: flex;
  gap: 0.75rem;
}
.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.btn-primary {
  background-color: #2563eb;
  color: #fff;
}
.btn-primary:hover {
  background-color: #1d4ed8;
}
.btn-secondary {
  background-color: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1;
}
.btn-secondary:hover {
  background-color: #e2e8f0;
}
.btn-outline {
  background: transparent;
  border-color: #2563eb;
  color: #2563eb;
}
.btn-outline:hover {
  background: #eff6ff;
}
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
.offline-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #fef3c7;
  color: #92400e;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
}
.pulse-dot {
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: #fff;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}
.stat-label {
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-top: 0.25rem;
}
.card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.table-container {
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.table-header {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}
.table-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}
.badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.data-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 0.875rem;
}
.font-mono {
  font-family: monospace;
}
.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.status-active {
  background: #dcfce7;
  color: #15803d;
}
.status-redeemed {
  background: #f1f5f9;
  color: #64748b;
}
.status-expired {
  background: #fee2e2;
  color: #b91c1c;
}
.text-muted {
  color: #94a3b8;
  font-size: 0.8125rem;
}
</style>
