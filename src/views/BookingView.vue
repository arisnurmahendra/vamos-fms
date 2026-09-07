<template>
  <div class="module-container">
    <header class="module-header">
      <div class="header-titles">
        <h2>🚙 Vehicle Booking (Peminjaman KR)</h2>
        <p class="subtitle">Reservasi kendaraan operasional, persetujuan berjenjang, dan notifikasi WhatsApp.</p>
      </div>
      <button class="btn btn-primary" @click="showForm = !showForm">
        {{ showForm ? 'Tutup Form' : '+ Pengajuan Peminjaman' }}
      </button>
    </header>

    <!-- Form Section -->
    <section v-if="showForm" class="card form-card">
      <h3>Formulir Pengajuan Baru</h3>
      <form @submit.prevent="handleSubmit" class="grid-form">
        <div class="form-group">
          <label>Nama Peminjam</label>
          <input v-model="form.peminjam" type="text" required placeholder="Masukkan nama lengkap" />
        </div>
        <div class="form-group">
          <label>Nomor Polisi (Nopol)</label>
          <input v-model="form.nopol" type="text" required placeholder="Contoh: KT 1234 AB" />
        </div>
        <div class="form-group">
          <label>Tanggal Peminjaman</label>
          <input v-model="form.tgl_pinjam" type="date" required />
        </div>
        <div class="form-group">
          <label>Keperluan / Tujuan</label>
          <input v-model="form.keperluan" type="text" required placeholder="Urusan operasional / dinas" />
        </div>
        <div class="form-actions full-width">
          <button type="submit" class="btn btn-success" :disabled="isSubmitting">
            {{ isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Data List Section -->
    <section class="card list-card">
      <div class="list-toolbar">
        <h3>Daftar Permintaan Aktif</h3>
        <input 
          v-model="bookingStore.searchQuery" 
          type="search" 
          placeholder="Cari peminjam / nopol..." 
          class="search-input"
        />
      </div>

      <SkeletonLoader v-if="bookingStore.isLoading" type="table" :count="4" />

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>UID</th>
            <th>Peminjam</th>
            <th>Nopol</th>
            <th>Tanggal</th>
            <th>Status Approval</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookingStore.filteredBookings" :key="b.uid">
            <td><strong>{{ b.uid }}</strong></td>
            <td>{{ b.peminjam }}</td>
            <td><span class="badge nopol">{{ b.nopol }}</span></td>
            <td>{{ b.tgl_pinjam }}</td>
            <td><span class="badge status" :class="b.status?.toLowerCase()">{{ b.status }}</span></td>
          </tr>
          <tr v-if="bookingStore.filteredBookings.length === 0">
            <td colspan="5" class="empty-state">Belum ada data peminjaman ditemukan.</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useBookingStore } from '../stores/bookingStore.js';
import SkeletonLoader from '../components/SkeletonLoader.vue';

const bookingStore = useBookingStore();
const showForm = ref(false);
const isSubmitting = ref(false);

const form = ref({
  peminjam: '',
  nopol: '',
  tgl_pinjam: new Date().toISOString().split('T')[0],
  keperluan: ''
});

onMounted(() => {
  bookingStore.fetchBookings();
});

const handleSubmit = async () => {
  isSubmitting.value = true;
  setTimeout(() => {
    alert(`Pengajuan berhasil dikirim untuk Nopol ${form.value.nopol}`);
    showForm.value = false;
    isSubmitting.value = false;
  }, 600);
};
</script>

<style scoped>
.module-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.25rem 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
.header-titles h2 { margin: 0; font-size: 1.35rem; color: #0f172a; }
.subtitle { margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #64748b; }

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
.grid-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.825rem; font-weight: 600; color: #475569; }
.form-group input {
  padding: 0.55rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
}
.full-width { grid-column: 1 / -1; }
.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.search-input {
  padding: 0.45rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  width: 240px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.data-table th, .data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}
.data-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.8rem;
  text-transform: uppercase;
}
.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge.nopol { background: #e0e7ff; color: #3730a3; }
.badge.status.completed { background: #dcfce7; color: #15803d; }
.badge.status.pending_am { background: #fef3c7; color: #b45309; }
.empty-state { text-align: center; color: #94a3b8; padding: 2rem !important; }
.btn {
  padding: 0.55rem 1.15rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary { background: #2563eb; color: white; }
.btn-primary:hover { background: #1d4ed8; }
.btn-success { background: #16a34a; color: white; }
.btn-success:hover { background: #15803d; }
</style>
