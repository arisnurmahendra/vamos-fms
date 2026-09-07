<template>
  <div class="module-container">
    <header class="module-header">
      <div class="header-titles">
        <h2>📋 Daily P2H (Pemeriksaan & Perawatan Harian)</h2>
        <p class="subtitle">Checklist digital inspeksi kelayakan jalan armada sebelum beroperasi.</p>
      </div>
      <div class="header-badge" :class="{ 'bg-success': isOnline, 'bg-warning': !isOnline }">
        {{ isOnline ? '🟢 Online Sync' : '🟠 Offline Mode' }}
      </div>
    </header>

    <!-- Form Identitas Kendaraan -->
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
          <input v-model.number="form.km_kendaraan" type="number" placeholder="KM kendaraan saat ini" />
        </div>
      </div>
    </section>

    <!-- 5 Observation Areas -->
    <section class="card">
      <h3>5 Area Observasi Keselamatan</h3>
      
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

      <div class="form-actions">
        <button class="btn btn-secondary" type="button" @click="resetForm">Reset Form</button>
        <button class="btn btn-primary" type="button" :disabled="p2hStore.isSubmitting" @click="submitP2H">
          {{ p2hStore.isSubmitting ? 'Menyimpan...' : 'Simpan & Kirim Laporan P2H' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useP2HStore } from '../stores/p2hStore.js';

const p2hStore = useP2HStore();
const isOnline = ref(navigator.onLine);

const form = ref({
  observator: '',
  tanggal: new Date().toISOString().split('T')[0],
  nopol: '',
  subkon: 'INTERNAL',
  merk: '',
  jenis: '',
  km_kendaraan: '',
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

onMounted(async () => {
  await p2hStore.loadMasterData();

  // Auto-fill dari localStorage
  if (p2hStore.lastVehicleProfile) {
    form.value.observator = p2hStore.lastVehicleProfile.observator || '';
    form.value.nopol = p2hStore.lastVehicleProfile.nopol || '';
    form.value.subkon = p2hStore.lastVehicleProfile.subkon || 'INTERNAL';
    form.value.merk = p2hStore.lastVehicleProfile.merk || '';
    form.value.jenis = p2hStore.lastVehicleProfile.jenis || '';
  }

  // Set default Baik untuk semua item
  categories.forEach(cat => {
    cat.items.forEach(item => {
      if (!form.value.checklist[item.key]) {
        form.value.checklist[item.key] = 'Baik';
      }
    });
  });
});

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
    categories.forEach(cat => {
      cat.items.forEach(item => {
        form.value.checklist[item.key] = 'Baik';
      });
    });
  }
};
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
.header-badge {
  padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
}
.bg-success { background: #dcfce7; color: #166534; }
.bg-warning { background: #fef3c7; color: #92400e; }

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
.form-group input {
  padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem;
}

.category-block {
  margin-top: 1.5rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
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
  transition: all 0.15s ease;
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
</style>
