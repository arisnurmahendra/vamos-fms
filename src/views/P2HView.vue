<template>
  <div class="module-container">
    <header class="module-header">
      <div class="header-titles">
        <h2>📋 Daily P2H (Pemeriksaan & Perawatan Harian)</h2>
        <p class="subtitle">Checklist digital inspeksi kelayakan armada, dasbor pemantauan GA, dan validasi supervisor.</p>
      </div>
      <div class="header-right">
        <div class="header-badge" :class="{ 'bg-success': isOnline, 'bg-warning': !isOnline }">
          {{ isOnline ? '🟢 Online' : '🟠 Offline Mode' }}
        </div>
        <button 
          v-if="p2hStore.offlineQueue.length > 0" 
          class="btn btn-sm btn-outline-warning" 
          :disabled="!isOnline || p2hStore.isSyncing"
          @click="p2hStore.syncOfflineQueue()"
        >
          {{ p2hStore.isSyncing ? 'Syncing...' : `Sync (${p2hStore.offlineQueue.length})` }}
        </button>
      </div>
    </header>

    <!-- Tab Navigation -->
    <nav class="sub-nav">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'form' }" 
        @click="activeTab = 'form'"
      >
        📝 Form Checklist
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'dashboard' }" 
        @click="switchTab('dashboard')"
      >
        📊 Dasbor GA
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'supervisor' }" 
        @click="switchTab('supervisor')"
      >
        🔍 Validasi Supervisor
      </button>
    </nav>

    <!-- TAB 1: FORM CHECKLIST (P2H-005 & P2H-006) -->
    <div v-if="activeTab === 'form'" class="tab-content">
      <!-- Identitas Kendaraan -->
      <section class="card">
        <h3>Identitas Kendaraan & Observator</h3>
        <div class="grid-form">
          <div class="form-group">
            <label>Nama Observator / Driver *</label>
            <input v-model="form.observator" type="text" placeholder="Nama lengkap driver" required />
          </div>
          <div class="form-group">
            <label>Tanggal Inspeksi *</label>
            <input v-model="form.tanggal" type="date" required />
          </div>
          <div class="form-group">
            <label>Nomor Polisi (Nopol) *</label>
            <input v-model="form.nopol" list="nopol_list" placeholder="Pilih atau ketik nopol" required />
            <datalist id="nopol_list">
              <option v-for="k in p2hStore.kendaraanList" :key="k.nopol" :value="k.nopol">{{ k.merk }} - {{ k.subkon }}</option>
            </datalist>
          </div>
          <div class="form-group">
            <label>Subkontraktor</label>
            <input v-model="form.subkon" list="subkon_list" placeholder="Subkontraktor" />
            <datalist id="subkon_list">
              <option v-for="s in p2hStore.subkonList" :key="s" :value="s"></option>
            </datalist>
          </div>
          <div class="form-group">
            <label>Kilometer (Odometer)</label>
            <input v-model.number="form.km_kendaraan" type="number" placeholder="KM saat ini" />
          </div>
        </div>
      </section>

      <!-- 5 Observation Areas -->
      <section class="card">
        <div class="checklist-header">
          <h3>5 Area Observasi Keselamatan</h3>
          <div class="quick-actions">
            <button class="btn btn-sm btn-ghost" type="button" @click="setAllStatus('Baik')">Semua Baik</button>
            <button class="btn btn-sm btn-ghost" type="button" @click="resetForm">Reset</button>
          </div>
        </div>
        
        <div v-for="cat in categories" :key="cat.id" class="category-block">
          <h4 class="category-title">{{ cat.title }}</h4>
          <div class="checklist-grid">
            <div v-for="item in cat.items" :key="item.key" class="checklist-row">
              <span class="item-name">{{ item.label }}</span>
              <div class="button-group">
                <button 
                  type="button" 
                  class="choice-btn baik" 
                  :class="{ active: form.checklist[item.key] === 'Baik' }"
                  @click="form.checklist[item.key] = 'Baik'"
                >
                  Baik
                </button>
                <button 
                  type="button" 
                  class="choice-btn t-baik" 
                  :class="{ active: form.checklist[item.key] === 'T.Baik' }"
                  @click="form.checklist[item.key] = 'T.Baik'"
                >
                  T.Baik
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group catatan-group">
          <label>Catatan Tambahan (Opsional)</label>
          <textarea v-model="form.catatan" rows="3" placeholder="Tuliskan catatan keluhan jika ada item T.Baik..."></textarea>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" type="button" @click="resetForm">Reset Form</button>
          <button 
            class="btn btn-primary" 
            type="button" 
            :disabled="p2hStore.isSubmitting" 
            @click="submitP2H"
          >
            {{ p2hStore.isSubmitting ? 'Menyimpan...' : 'Simpan & Kirim Laporan P2H' }}
          </button>
        </div>
      </section>
    </div>

    <!-- TAB 2: DASBOR GA P2H (P2H-007) -->
    <div v-else-if="activeTab === 'dashboard'" class="tab-content">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Total Inspeksi</span>
          <span class="stat-value">{{ p2hStore.summary.total }}</span>
        </div>
        <div class="stat-card stat-fit">
          <span class="stat-label">Layak Operasi (FIT)</span>
          <span class="stat-value">{{ p2hStore.summary.fit }}</span>
        </div>
        <div class="stat-card stat-unfit">
          <span class="stat-label">Temuan Rusak (UNFIT)</span>
          <span class="stat-value">{{ p2hStore.summary.unfit }}</span>
        </div>
      </div>

      <div class="card table-container">
        <div class="table-header">
          <h3>Log Riwayat Inspeksi Harian Armada</h3>
          <button class="btn btn-sm btn-secondary" @click="p2hStore.fetchReports()">Muat Ulang</button>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>UID Laporan</th>
              <th>Tanggal</th>
              <th>Nopol</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Temuan NOK</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="p2hStore.reports.length === 0">
              <td colspan="7" class="text-center py-4">Belum ada riwayat inspeksi tercatat.</td>
            </tr>
            <tr v-for="r in p2hStore.reports" :key="r.UID">
              <td class="font-mono font-bold">{{ r.UID }}</td>
              <td>{{ r.Tanggal }}</td>
              <td><strong>{{ r.Nopol }}</strong></td>
              <td>{{ r.Observator }}</td>
              <td>
                <span :class="['status-pill', r.Status_Kelayakan === 'FIT' ? 'status-fit' : 'status-unfit']">
                  {{ r.Status_Kelayakan }}
                </span>
              </td>
              <td>{{ r.Total_Item_NOK > 0 ? `${r.Total_Item_NOK} Item` : '-' }}</td>
              <td class="text-truncate">{{ r.Catatan_Tambahan || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: VALIDASI SUPERVISOR (P2H-008) -->
    <div v-else-if="activeTab === 'supervisor'" class="tab-content">
      <div class="card table-container">
        <div class="table-header">
          <div>
            <h3>Daftar Temuan Kendaraan Tidak Baik (NOK)</h3>
            <p class="subtitle">Tindak lanjut laporan kelayakan kendaraan sebelum armada diizinkan beroperasi.</p>
          </div>
          <button class="btn btn-sm btn-secondary" @click="p2hStore.fetchReports({ status: 'UNFIT' })">Filter Temuan</button>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Nopol</th>
              <th>Driver</th>
              <th>Temuan NOK</th>
              <th>Catatan Terkini</th>
              <th>Aksi Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="unfitReports.length === 0">
              <td colspan="6" class="text-center py-4">Tidak ada temuan rusak (UNFIT) yang memerlukan tindakan.</td>
            </tr>
            <tr v-for="r in unfitReports" :key="r.UID">
              <td class="font-mono font-bold">{{ r.UID }}</td>
              <td><strong>{{ r.Nopol }}</strong></td>
              <td>{{ r.Observator }}</td>
              <td><span class="badge-unfit">{{ r.Total_Item_NOK }} NOK</span></td>
              <td>{{ r.Catatan_Tambahan || '-' }}</td>
              <td>
                <div class="action-btn-group">
                  <button class="btn btn-sm btn-warning" @click="handleFollowUp(r.UID, 'PERBAIKAN')">Kirim ke Bengkel</button>
                  <button class="btn btn-sm btn-success" @click="handleFollowUp(r.UID, 'CLEAR')">Clear / Disetujui</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useP2HStore } from '../stores/p2hStore.js';

const p2hStore = useP2HStore();
const isOnline = ref(navigator.onLine);
const activeTab = ref('form');

const form = ref({
  observator: '',
  tanggal: new Date().toISOString().split('T')[0],
  nopol: '',
  subkon: 'INTERNAL',
  merk: '',
  jenis: '',
  km_kendaraan: '',
  catatan: '',
  checklist: {}
});

const categories = [
  {
    id: 'luar',
    title: '1. Bagian Luar Kendaraan',
    items: [
      { key: 'luar_01', label: 'Body kendaraan secara keseluruhan' },
      { key: 'luar_02', label: 'Kondisi dan kebersihan kaca' },
      { key: 'luar_03', label: 'Spion luar (kanan dan kiri)' },
      { key: 'luar_04', label: 'Kondisi wiper' },
      { key: 'luar_05', label: 'Kondisi roda & baut' }
    ]
  },
  {
    id: 'dalam',
    title: '2. Bagian Dalam Kendaraan (Kabin)',
    items: [
      { key: 'dalam_01', label: 'STNK berlaku' },
      { key: 'dalam_02', label: 'SIM driver berlaku' },
      { key: 'dalam_03', label: 'APAR & Kotak P3K' },
      { key: 'dalam_04', label: 'Sabuk pengaman (Safety Belt)' },
      { key: 'dalam_05', label: 'Rem tangan & Rem kaki' }
    ]
  },
  {
    id: 'listrik',
    title: '3. Likuid & Kelistrikan',
    items: [
      { key: 'listrik_01', label: 'Oli Mesin & Oli Rem' },
      { key: 'listrik_02', label: 'Air Radiator & Air Wiper' },
      { key: 'listrik_03', label: 'Lampu utama (jauh / dekat)' },
      { key: 'listrik_04', label: 'Lampu sein & hazard' }
    ]
  },
  {
    id: 'udara',
    title: '4. Tekanan Udara & Ban',
    items: [
      { key: 'udara_01', label: 'Tekanan seluruh ban utama' },
      { key: 'udara_02', label: 'Kondisi ban cadangan' }
    ]
  },
  {
    id: 'servis',
    title: '5. Servis & Perawatan',
    items: [
      { key: 'servis_01', label: 'Jadwal Servis Berkala' }
    ]
  }
];

const unfitReports = computed(() => {
  return p2hStore.reports.filter(r => String(r.Status_Kelayakan).toUpperCase() === 'UNFIT');
});

onMounted(async () => {
  window.addEventListener('online', () => { isOnline.value = true; p2hStore.syncOfflineQueue(); });
  window.addEventListener('offline', () => { isOnline.value = false; });

  await p2hStore.loadMasterData();
  await p2hStore.loadOfflineQueue();

  if (p2hStore.lastVehicleProfile) {
    form.value.observator = p2hStore.lastVehicleProfile.observator || '';
    form.value.nopol = p2hStore.lastVehicleProfile.nopol || '';
    form.value.subkon = p2hStore.lastVehicleProfile.subkon || 'INTERNAL';
    form.value.merk = p2hStore.lastVehicleProfile.merk || '';
    form.value.jenis = p2hStore.lastVehicleProfile.jenis || '';
  }

  setAllStatus('Baik');
});

const switchTab = async (tab) => {
  activeTab.value = tab;
  if (tab === 'dashboard' || tab === 'supervisor') {
    await p2hStore.fetchReports();
  }
};

const setAllStatus = (status) => {
  categories.forEach(cat => {
    cat.items.forEach(item => {
      form.value.checklist[item.key] = status;
    });
  });
};

const submitP2H = async () => {
  if (!form.value.nopol || !form.value.observator) {
    alert('Harap lengkapi Nopol dan Nama Observator terlebih dahulu.');
    return;
  }

  try {
    const res = await p2hStore.submitP2H(form.value);
    alert(res.message || 'Laporan P2H berhasil disimpan!');
  } catch (err) {
    alert('Gagal mengirim: ' + err.message);
  }
};

const resetForm = () => {
  if (confirm('Reset seluruh checklist ke kondisi awal?')) {
    setAllStatus('Baik');
    form.value.catatan = '';
  }
};

const handleFollowUp = async (uid, status) => {
  const notes = prompt(`Masukkan catatan tindak lanjut untuk status "${status}":`, '');
  if (notes !== null) {
    try {
      await p2hStore.followUpReport(uid, status, notes);
      alert(`Status temuan ${uid} berhasil diubah ke ${status}.`);
    } catch (err) {
      alert(`Gagal memproses follow-up: ${err.message}`);
    }
  }
};
</script>

<style scoped>
.module-container { display: flex; flex-direction: column; gap: 1.5rem; max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
.module-header {
  display: flex; justify-content: space-between; align-items: center;
  background: white; padding: 1.25rem 1.5rem; border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
.header-titles h2 { margin: 0; font-size: 1.35rem; color: #0f172a; }
.subtitle { margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #64748b; }
.header-right { display: flex; align-items: center; gap: 0.75rem; }
.header-badge {
  padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
}
.bg-success { background: #dcfce7; color: #166534; }
.bg-warning { background: #fef3c7; color: #92400e; }

.sub-nav { display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.25rem; }
.tab-btn {
  padding: 0.6rem 1.25rem; border: none; background: transparent; font-weight: 600;
  color: #64748b; cursor: pointer; border-radius: 6px; transition: all 0.2s;
}
.tab-btn:hover { background: #f1f5f9; color: #0f172a; }
.tab-btn.active { background: #eff6ff; color: #2563eb; }

.card {
  background: white; padding: 1.5rem; border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}
.grid-form {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem; margin-top: 1rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.825rem; font-weight: 600; color: #475569; }
.form-group input, .form-group textarea {
  padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;
}
.catatan-group { margin-top: 1.25rem; }

.checklist-header { display: flex; justify-content: space-between; align-items: center; }
.checklist-header h3 { margin: 0; }
.category-block {
  margin-top: 1.25rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
}
.category-title {
  background: #f8fafc; margin: 0; padding: 0.75rem 1rem;
  font-size: 0.95rem; color: #1e293b; border-bottom: 1px solid #e2e8f0;
}
.checklist-grid { display: flex; flex-direction: column; }
.checklist-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9;
}
.checklist-row:last-child { border-bottom: none; }
.item-name { font-size: 0.9rem; color: #334155; }
.button-group { display: flex; gap: 0.5rem; }
.choice-btn {
  padding: 0.35rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px;
  background: white; font-weight: 600; font-size: 0.8rem; cursor: pointer;
}
.choice-btn.baik.active { background: #16a34a; color: white; border-color: #16a34a; }
.choice-btn.t-baik.active { background: #dc2626; color: white; border-color: #dc2626; }

.form-actions {
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;
}
.btn {
  padding: 0.65rem 1.25rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;
}
.btn-primary { background: #2563eb; color: white; }
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary { background: #e2e8f0; color: #334155; }
.btn-sm { padding: 0.35rem 0.65rem; font-size: 0.8rem; }
.btn-ghost { background: transparent; color: #2563eb; border: 1px solid #bfdbfe; }
.btn-outline-warning { background: transparent; color: #d97706; border: 1px solid #d97706; }
.btn-warning { background: #f59e0b; color: white; }
.btn-success { background: #10b981; color: white; }

.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem; margin-bottom: 1.5rem;
}
.stat-card {
  background: white; padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0;
  display: flex; flex-direction: column;
}
.stat-card.stat-fit { border-left: 4px solid #10b981; }
.stat-card.stat-unfit { border-left: 4px solid #ef4444; }
.stat-label { font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 600; }
.stat-value { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem; }

.table-header {
  padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #e2e8f0;
}
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th {
  background: #f8fafc; color: #475569; font-size: 0.75rem; text-transform: uppercase;
  font-weight: 600; padding: 0.75rem 1.25rem; border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 0.875rem 1.25rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155;
}
.status-pill {
  padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;
}
.status-fit { background: #dcfce7; color: #15803d; }
.status-unfit { background: #fee2e2; color: #b91c1c; }
.badge-unfit { background: #fee2e2; color: #b91c1c; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem; }
.action-btn-group { display: flex; gap: 0.5rem; }
.font-mono { font-family: monospace; }
.text-truncate { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>

