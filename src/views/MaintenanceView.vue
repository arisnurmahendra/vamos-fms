<template>
  <div class="module-container">
    <!-- Header Section -->
    <header class="module-header">
      <div class="header-titles">
        <h2>🔧 SmartServ Maintenance (Perawatan & Perbaikan)</h2>
        <p class="subtitle">Manajemen pemeliharaan armada operasional, penyusunan RAB, penerbitan SPK bengkel, dan kontrol anggaran.</p>
      </div>
      <div class="header-right">
        <button 
          class="btn btn-sm btn-secondary" 
          :disabled="maintenanceStore.isLoading" 
          @click="refreshData"
        >
          🔄 Refresh
        </button>
        <button 
          class="btn btn-sm btn-primary" 
          @click="activeTab = 'lapor'"
        >
          + Buat Laporan Kerusakan
        </button>
      </div>
    </header>

    <!-- Alert Message -->
    <div v-if="alertMessage" class="alert" :class="`alert-${alertType}`">
      <span>{{ alertMessage }}</span>
      <button class="close-btn" @click="alertMessage = ''">&times;</button>
    </div>

    <!-- Navigation Tabs -->
    <nav class="sub-nav">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'dashboard' }" 
        @click="switchTab('dashboard')"
      >
        📊 Dasbor Pemeliharaan (MTN-016)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'lapor' }" 
        @click="switchTab('lapor')"
      >
        📝 Laporan Kerusakan (MTN-017)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'rab' }" 
        @click="switchTab('rab')"
      >
        💰 Rencana Anggaran / RAB (MTN-018)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'spk' }" 
        @click="switchTab('spk')"
      >
        📑 SPK Bengkel (MTN-019)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'master' }" 
        @click="switchTab('master')"
      >
        🏷️ Katalog Harsat & Armada (MTN-020 & 021)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'profile' }" 
        @click="switchTab('profile')"
      >
        👥 Profil & Admin User (MTN-022 & 023)
      </button>
    </nav>

    <!-- ==================== TAB 1: DASBOR PEMELIHARAAN (MTN-016) ==================== -->
    <div v-if="activeTab === 'dashboard'" class="tab-content">
      <!-- KPI Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card" @click="activeTab = 'lapor'">
          <span class="stat-label">Total Laporan Kerusakan</span>
          <span class="stat-value">{{ maintenanceStore.kpiMetrics.total }}</span>
          <span class="stat-sub">Seluruh riwayat keluhan</span>
        </div>
        <div class="stat-card" @click="filterByStatus('LAPORAN_BARU')">
          <span class="stat-label">Laporan Baru (Belum SPK)</span>
          <span class="stat-value text-warning">{{ maintenanceStore.kpiMetrics.baru }}</span>
          <span class="stat-sub">Menunggu asesmen & RAB</span>
        </div>
        <div class="stat-card" @click="filterByStatus('SPK_TERBIT')">
          <span class="stat-label">SPK Aktif / Di Bengkel</span>
          <span class="stat-value text-info">{{ maintenanceStore.kpiMetrics.spk }}</span>
          <span class="stat-sub">Dalam pengerjaan bengkel</span>
        </div>
        <div class="stat-card" @click="filterByStatus('SELESAI')">
          <span class="stat-label">Perbaikan Selesai</span>
          <span class="stat-value text-success">{{ maintenanceStore.kpiMetrics.selesai }}</span>
          <span class="stat-sub">Armada siap operasi</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Estimasi Anggaran</span>
          <span class="stat-value text-primary">Rp {{ formatNumber(totalEstimasiBiaya) }}</span>
          <span class="stat-sub">Pagu anggaran diajukan</span>
        </div>
      </div>

      <!-- Quick Summary Table: Laporan Terkini -->
      <div class="card table-container">
        <div class="table-header">
          <h3>Status Perbaikan Armada Terkini</h3>
          <button class="btn btn-xs btn-outline-primary" @click="activeTab = 'lapor'">Lihat Semua</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>No Laporan</th>
              <th>Nopol Kendaraan</th>
              <th>Driver / Pelapor</th>
              <th>Keluhan / Gejala Kerusakan</th>
              <th>Kategori</th>
              <th>Estimasi Biaya</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="maintenanceStore.reports.length === 0">
              <td colspan="7" class="text-center py-4 text-muted">Belum ada riwayat laporan pemeliharaan.</td>
            </tr>
            <tr v-for="r in maintenanceStore.reports.slice(0, 5)" :key="r.no_laporan">
              <td class="font-mono font-bold">{{ r.no_laporan }}</td>
              <td><strong>{{ r.nopol }}</strong></td>
              <td>{{ r.driver }}</td>
              <td><div class="truncate-text">{{ r.keluhan }}</div></td>
              <td><span class="badge">{{ r.kategori_servis }}</span></td>
              <td class="font-bold">Rp {{ formatNumber(r.estimasi_biaya) }}</td>
              <td>
                <span :class="['status-pill', `status-${(r.status || 'laporan_baru').toLowerCase()}`]">
                  {{ r.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== TAB 2: LAPORAN KERUSAKAN (MTN-017) ==================== -->
    <div v-if="activeTab === 'lapor'" class="tab-content">
      <div class="two-col-grid">
        <!-- Form Pengajuan Laporan -->
        <div class="card">
          <div class="card-header">
            <h3>📝 Formulir Pelaporan Kerusakan / Servis Armada</h3>
            <p class="subtitle">Laporkan kendala mesin, kelistrikan, bodi, atau jadwal servis berkala.</p>
          </div>

          <form @submit.prevent="handleLaporanSubmit" class="form-body">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nomor Polisi Kendaraan *</label>
                <select v-model="laporForm.nopol" required class="form-control">
                  <option value="">-- Pilih Armada --</option>
                  <option v-for="v in maintenanceStore.vehicles" :key="v.nopol" :value="v.nopol">
                    {{ v.nopol }} — {{ v.merk_model }} ({{ v.status_operasional }})
                  </option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Driver / Pelapor *</label>
                <input v-model="laporForm.driver" type="text" placeholder="Nama pelapor" required class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>KM Odometer Saat Ini *</label>
                <input v-model.number="laporForm.km_odometer" type="number" placeholder="KM Odometer" required class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label>Kategori Servis *</label>
                <select v-model="laporForm.kategori_servis" class="form-control">
                  <option value="Perbaikan Kerusakan">Perbaikan Kerusakan (Corrective)</option>
                  <option value="Servis Berkala">Servis Berkala (Periodic PM)</option>
                  <option value="Emergency Breakdown">Emergency Breakdown</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Rincian Keluhan & Gejala Kerusakan *</label>
              <textarea 
                v-model="laporForm.keluhan" 
                rows="3" 
                placeholder="Deskripsikan bagian yang rusak, suara mencurigakan, atau komponen yang aus..." 
                required 
                class="form-control"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Lampiran Foto Kerusakan / Bukti Fisik (MTN-014)</label>
              <input type="file" accept="image/*,.pdf" @change="handleFileUpload" class="form-control" />
              <div v-if="laporForm.foto_kerusakan_url" class="text-xs text-success mt-1">
                ✓ Berkas tersimpan: <a :href="laporForm.foto_kerusakan_url" target="_blank" class="font-mono text-primary">Lihat Dokumen</a>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="resetLaporForm">Reset</button>
              <button type="submit" class="btn btn-primary" :disabled="maintenanceStore.isSubmitting">
                {{ maintenanceStore.isSubmitting ? 'Mengirim...' : '🚀 Kirim Laporan Kerusakan' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Tabel Daftar Laporan -->
        <div class="card table-container">
          <div class="table-header">
            <h3>Daftar Seluruh Laporan Kerusakan</h3>
            <div class="header-filter-group">
              <input v-model="maintenanceStore.searchQuery" type="text" placeholder="Cari nopol / no laporan..." class="form-control form-control-sm" />
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>No Laporan</th>
                <th>Kendaraan</th>
                <th>Keluhan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="maintenanceStore.filteredReports.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">Tidak ada laporan kerusakan ditemukan.</td>
              </tr>
              <tr v-for="r in maintenanceStore.filteredReports" :key="r.no_laporan">
                <td class="font-mono font-bold">{{ r.no_laporan }}</td>
                <td>
                  <strong>{{ r.nopol }}</strong>
                  <div class="text-xs text-muted">{{ r.km_odometer }} KM</div>
                </td>
                <td><div class="truncate-text">{{ r.keluhan }}</div></td>
                <td>
                  <span :class="['status-pill', `status-${(r.status || 'laporan_baru').toLowerCase()}`]">
                    {{ r.status }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-xs btn-outline-primary" @click="initRABForLaporan(r)">
                    + Buat RAB
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== TAB 3: RENCANA ANGGARAN BIAYA (RAB) (MTN-018) ==================== -->
    <div v-if="activeTab === 'rab'" class="tab-content">
      <div class="card max-w-800 mx-auto">
        <div class="card-header">
          <h3>💰 Penyusunan Rencana Anggaran Biaya (RAB) Perbaikan</h3>
          <p class="subtitle">Hitung estimasi kebutuhan suku cadang dan jasa mekanik berdasarkan acuan katalog Harsat resmi.</p>
        </div>

        <div class="form-body">
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Nomor Laporan Kerusakan *</label>
              <select v-model="rabForm.no_laporan" class="form-control" @change="onRABLaporanSelected">
                <option value="">-- Pilih Nomor Laporan --</option>
                <option v-for="r in maintenanceStore.reports" :key="r.no_laporan" :value="r.no_laporan">
                  {{ r.no_laporan }} — {{ r.nopol }} ({{ r.status }})
                </option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>Nopol Armada</label>
              <input :value="rabForm.nopol" type="text" readonly class="form-control bg-light" placeholder="Terisi otomatis" />
            </div>
          </div>

          <!-- Line Items Table -->
          <div class="rab-items-section mb-3">
            <div class="flex-between mb-2">
              <label class="font-bold">Rincian Komponen / Jasa Pekerjaan:</label>
              <button type="button" class="btn btn-xs btn-outline-primary" @click="addRABLineItem">
                + Tambah Item
              </button>
            </div>

            <table class="data-table border-table">
              <thead>
                <tr>
                  <th>Pilih dari Harsat / Nama Item</th>
                  <th width="80">Qty</th>
                  <th width="140">Harga Satuan (Rp)</th>
                  <th width="140">Subtotal (Rp)</th>
                  <th width="50"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in rabForm.items" :key="idx">
                  <td>
                    <input 
                      v-model="item.item_pekerjaan" 
                      list="harsat_options" 
                      placeholder="Ketik atau pilih item katalog" 
                      class="form-control form-control-sm"
                      @input="onHarsatSelected(item)"
                    />
                    <datalist id="harsat_options">
                      <option v-for="h in maintenanceStore.harsat" :key="h.kode_item" :value="h.deskripsi">
                        Rp {{ formatNumber(h.harga_satuan) }} ({{ h.kategori }})
                      </option>
                    </datalist>
                  </td>
                  <td>
                    <input v-model.number="item.qty" type="number" min="1" class="form-control form-control-sm" />
                  </td>
                  <td>
                    <input v-model.number="item.harga_satuan" type="number" step="1000" class="form-control form-control-sm" />
                  </td>
                  <td class="font-bold">
                    Rp {{ formatNumber(item.qty * item.harga_satuan) }}
                  </td>
                  <td class="text-center">
                    <button type="button" class="btn btn-xs text-danger" @click="removeRABLineItem(idx)">&times;</button>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="table-summary-row">
                  <td colspan="3" class="text-right font-bold">TOTAL ESTIMASI RAB:</td>
                  <td colspan="2" class="font-bold text-primary">Rp {{ formatNumber(calculateRABTotal) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="resetRABForm">Reset</button>
            <button 
              type="button" 
              class="btn btn-outline-secondary" 
              :disabled="!rabForm.no_laporan"
              @click="generateRABPDF"
            >
              📄 Cetak / Unduh PDF RAB (MTN-015)
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              :disabled="maintenanceStore.isSubmitting || !rabForm.no_laporan || rabForm.items.length === 0"
              @click="submitRABAction"
            >
              {{ maintenanceStore.isSubmitting ? 'Menyimpan RAB...' : '💰 Simpan & Ajukan RAB' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== TAB 4: SPK BENGKEL (MTN-019) ==================== -->
    <div v-if="activeTab === 'spk'" class="tab-content">
      <div class="two-col-grid">
        <!-- Form Terbitkan SPK -->
        <div class="card">
          <div class="card-header">
            <h3>📑 Penerbitan Surat Perintah Kerja (SPK)</h3>
            <p class="subtitle">Keluarkan mandat resmi perbaikan ke bengkel rekanan resmi PT VAMOS FMS.</p>
          </div>

          <form @submit.prevent="handleSPKSubmit" class="form-body">
            <div class="form-group">
              <label>Pilih Laporan / Pekerjaan Disetujui *</label>
              <select v-model="spkForm.no_laporan" required class="form-control" @change="onSPKLaporanSelected">
                <option value="">-- Pilih Laporan --</option>
                <option v-for="r in maintenanceStore.reports" :key="r.no_laporan" :value="r.no_laporan">
                  {{ r.no_laporan }} — {{ r.nopol }} (Estimasi: Rp {{ formatNumber(r.estimasi_biaya) }})
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Bengkel Rekanan Ditunjuk *</label>
                <select v-model="spkForm.nama_bengkel" required class="form-control">
                  <option value="Bengkel Resmi Toyota Auto2000">Bengkel Resmi Toyota Auto2000</option>
                  <option value="Bengkel Resmi Mitsubishi Dipo Motor">Bengkel Resmi Mitsubishi Dipo Motor</option>
                  <option value="Bengkel Mitra Mandiri Diesel">Bengkel Mitra Mandiri Diesel</option>
                  <option value="Bengkel Spesialis Kaki-Kaki & Ban">Bengkel Spesialis Kaki-Kaki & Ban</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Target Penyelesaian *</label>
                <input v-model="spkForm.target_selesai" type="date" required class="form-control" />
              </div>
            </div>

            <div class="form-group">
              <label>Pagu Plafon Biaya SPK (Rp) *</label>
              <input v-model.number="spkForm.total_nilai_spk" type="number" required class="form-control font-bold" />
            </div>

            <div class="form-group">
              <label>Instruksi & Catatan Teknis Bengkel</label>
              <textarea v-model="spkForm.catatan_teknis" rows="2" placeholder="Catatan spesifik pengerjaan..." class="form-control"></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="maintenanceStore.isSubmitting">
                {{ maintenanceStore.isSubmitting ? 'Menerbitkan SPK...' : '📑 Terbitkan SPK Resmi' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Tabel Riwayat SPK Terbit -->
        <div class="card table-container">
          <div class="table-header">
            <h3>Daftar Surat Perintah Kerja (SPK)</h3>
            <button class="btn btn-xs btn-secondary" @click="maintenanceStore.fetchSPKList()">🔄 Refresh</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>No SPK</th>
                <th>Ref Laporan / Nopol</th>
                <th>Bengkel</th>
                <th>Pagu Biaya</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="maintenanceStore.spkList.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">Belum ada SPK terbit.</td>
              </tr>
              <tr v-for="spk in maintenanceStore.spkList" :key="spk.no_spk">
                <td class="font-mono font-bold">{{ spk.no_spk }}</td>
                <td>
                  <strong>{{ spk.nopol }}</strong>
                  <div class="text-xs text-muted">{{ spk.no_laporan }}</div>
                </td>
                <td>{{ spk.nama_bengkel }}</td>
                <td class="font-bold">Rp {{ formatNumber(spk.total_nilai) }}</td>
                <td>
                  <span class="status-pill status-active">{{ spk.status_spk }}</span>
                </td>
                <td>
                  <button class="btn btn-xs btn-outline-secondary me-1" @click="generateSPKPDF(spk)">
                    📄 PDF
                  </button>
                  <button class="btn btn-xs btn-outline-success" @click="markSPKCompleted(spk)">
                    ✓ Selesai
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== TAB 5: KATALOG HARSAT & MASTER ARMADA (MTN-020 & 021) ==================== -->
    <div v-if="activeTab === 'master'" class="tab-content">
      <div class="two-col-grid">
        <!-- Katalog Harsat -->
        <div class="card table-container">
          <div class="table-header">
            <div>
              <h3>Katalog Harga Satuan (Harsat)</h3>
              <span class="text-xs text-muted">Standar harga acuan komponen & jasa perbaikan armada.</span>
            </div>
            <button class="btn btn-xs btn-primary" @click="openAddHarsatPrompt">+ Tambah Item</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Deskripsi Pekerjaan / Part</th>
                <th>Kategori</th>
                <th>Tarif Acuan</th>
                <th width="90">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in maintenanceStore.harsat" :key="h.kode_item">
                <td class="font-mono font-bold text-xs">{{ h.kode_item }}</td>
                <td>{{ h.deskripsi }}</td>
                <td><span class="badge text-xs">{{ h.kategori }}</span></td>
                <td class="font-bold">Rp {{ formatNumber(h.harga_satuan) }}</td>
                <td>
                  <button class="btn btn-xs text-primary p-0 me-2" @click="editHarsatItem(h)" title="Edit Tarif">✏️</button>
                  <button class="btn btn-xs text-danger p-0" @click="deleteHarsatItem(h)" title="Nonaktifkan">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Master Status Kendaraan -->
        <div class="card table-container">
          <div class="table-header">
            <div>
              <h3>Status Operasional & Odometer Armada</h3>
              <span class="text-xs text-muted">Pemantauan kilometer servis berkala.</span>
            </div>
            <div class="header-right-btns">
              <button class="btn btn-xs btn-primary me-1" @click="openAddVehiclePrompt">+ Tambah Armada</button>
              <button class="btn btn-xs btn-secondary" @click="maintenanceStore.fetchMasterData()">🔄 Refresh</button>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Nopol</th>
                <th>Merk & Model</th>
                <th>KM Odometer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in maintenanceStore.vehicles" :key="v.nopol">
                <td class="font-mono font-bold">{{ v.nopol }}</td>
                <td>{{ v.merk_model }}</td>
                <td><strong>{{ formatNumber(v.odometer) }} KM</strong></td>
                <td>
                  <span 
                    class="status-pill"
                    :class="v.status_operasional === 'SIAP_OPERASI' ? 'status-active' : 'status-expired'"
                  >
                    {{ v.status_operasional }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== TAB 6: PROFIL & USER MANAGER (MTN-022 & 023) ==================== -->
    <div v-if="activeTab === 'profile'" class="tab-content">
      <div class="two-col-grid">
        <!-- User Profile Card (MTN-022) -->
        <div class="card">
          <div class="card-header">
            <h3>👤 Informasi Profil Pengguna (MTN-022)</h3>
            <p class="subtitle">Data akun dan hak akses aktif VAMOS FMS.</p>
          </div>
          <div class="profile-details-body p-3">
            <div class="profile-field mb-3">
              <label class="font-bold text-xs text-muted uppercase block">Nama Lengkap</label>
              <div class="font-bold text-lg">{{ authStore.user?.nama || 'Petugas Pemeliharaan' }}</div>
            </div>
            <div class="profile-field mb-3">
              <label class="font-bold text-xs text-muted uppercase block">Email Akun (Google Identity)</label>
              <div class="font-mono text-sm">{{ authStore.user?.email || 'mechanic@vamos.internal' }}</div>
            </div>
            <div class="profile-field mb-3">
              <label class="font-bold text-xs text-muted uppercase block">Hak Akses / Peran Sistem</label>
              <div><span class="badge bg-primary text-white">{{ authStore.role || 'MECHANIC' }}</span></div>
            </div>
            <div class="profile-field mb-3">
              <label class="font-bold text-xs text-muted uppercase block">Divisi Operasional</label>
              <div class="text-sm">SmartServ Fleet Maintenance & Workshop Control</div>
            </div>
            <div class="profile-field">
              <label class="font-bold text-xs text-muted uppercase block">Status Keamanan Token Sesi</label>
              <div class="text-xs text-success font-semibold">✓ Terverifikasi via VAMOS Google Identity Handshake</div>
            </div>
          </div>
        </div>

        <!-- User Manager Panel (MTN-023) -->
        <div class="card table-container">
          <div class="table-header">
            <div>
              <h3>👥 Panel Administrator Pengguna (MTN-023)</h3>
              <span class="text-xs text-muted">Daftar pengguna dan kontrol status aktif Users_Roles.</span>
            </div>
            <button class="btn btn-xs btn-secondary" @click="maintenanceStore.fetchUsersList()">🔄 Refresh</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Nama / Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="maintenanceStore.usersList.length === 0">
                <td colspan="4" class="text-center py-4 text-muted">Belum ada data user. Klik Refresh.</td>
              </tr>
              <tr v-for="u in maintenanceStore.usersList" :key="u.email">
                <td>
                  <strong>{{ u.nama }}</strong>
                  <div class="text-xs font-mono text-muted">{{ u.email }}</div>
                </td>
                <td><span class="badge">{{ u.role }}</span></td>
                <td>
                  <span :class="['status-pill', u.status === 'AKTIF' ? 'status-active' : 'status-expired']">
                    {{ u.status }}
                  </span>
                </td>
                <td>
                  <button 
                    class="btn btn-xs" 
                    :class="u.status === 'AKTIF' ? 'btn-outline-danger' : 'btn-outline-success'"
                    @click="toggleUser(u)"
                  >
                    {{ u.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMaintenanceStore } from '../stores/maintenanceStore.js';
import { useAuthStore } from '../stores/authStore.js';

const maintenanceStore = useMaintenanceStore();
const authStore = useAuthStore();

// State
const activeTab = ref('dashboard');
const alertMessage = ref('');
const alertType = ref('success');

// Form Laporan Kerusakan
const laporForm = ref({
  nopol: '',
  driver: '',
  km_odometer: null,
  kategori_servis: 'Perbaikan Kerusakan',
  keluhan: '',
  foto_kerusakan_url: ''
});

// Form RAB
const rabForm = ref({
  no_laporan: '',
  nopol: '',
  items: [
    { item_pekerjaan: 'Ganti Oli Mesin Synthetic 10W-40 (Per Galon / 4L)', qty: 1, harga_satuan: 385000 },
    { item_pekerjaan: 'Jasa Tune Up & Gurah Mesin Diesel Commonrail', qty: 1, harga_satuan: 450000 }
  ]
});

// Form SPK
const spkForm = ref({
  no_laporan: '',
  no_rab: '',
  nopol: '',
  nama_bengkel: 'Bengkel Resmi Toyota Auto2000',
  target_selesai: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
  total_nilai_spk: 835000,
  catatan_teknis: 'Lakukan perbaikan menyeluruh sesuai RAB yang disetujui.'
});

onMounted(async () => {
  await maintenanceStore.fetchMasterData();
  await maintenanceStore.fetchReports();
  await maintenanceStore.fetchSPKList();
  await maintenanceStore.fetchSummary();
  await maintenanceStore.fetchUsersList();
});

const switchTab = async (tab) => {
  activeTab.value = tab;
  if (tab === 'dashboard' || tab === 'lapor') {
    await maintenanceStore.fetchReports();
  } else if (tab === 'profile') {
    await maintenanceStore.fetchUsersList();
  }
};

const refreshData = async () => {
  await maintenanceStore.fetchMasterData();
  await maintenanceStore.fetchReports();
  await maintenanceStore.fetchSPKList();
  await maintenanceStore.fetchSummary();
  showAlert('Data pemeliharaan berhasil disegarkan.', 'success');
};

const showAlert = (msg, type = 'success') => {
  alertMessage.value = msg;
  alertType.value = type;
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = '';
  }, 6000);
};

const totalEstimasiBiaya = computed(() => {
  return maintenanceStore.reports.reduce((acc, r) => acc + (Number(r.estimasi_biaya) || 0), 0);
});

const filterByStatus = (status) => {
  maintenanceStore.filterStatus = status;
  activeTab.value = 'lapor';
};

// ==================== TAB 2: LAPORAN ACTIONS ====================
const handleLaporanSubmit = async () => {
  try {
    const res = await maintenanceStore.submitReport({ ...laporForm.value });
    showAlert(`Laporan perbaikan ${res.data.no_laporan} berhasil dibuat!`, 'success');
    resetLaporForm();
  } catch (err) {
    showAlert(`Gagal: ${err.message}`, 'error');
  }
};

const resetLaporForm = () => {
  laporForm.value = {
    nopol: '',
    driver: '',
    km_odometer: null,
    kategori_servis: 'Perbaikan Kerusakan',
    keluhan: ''
  };
};

const initRABForLaporan = (r) => {
  rabForm.value.no_laporan = r.no_laporan;
  rabForm.value.nopol = r.nopol;
  activeTab.value = 'rab';
};

// ==================== TAB 3: RAB ACTIONS ====================
const onRABLaporanSelected = () => {
  const found = maintenanceStore.reports.find(r => r.no_laporan === rabForm.value.no_laporan);
  if (found) {
    rabForm.value.nopol = found.nopol;
  }
};

const addRABLineItem = () => {
  rabForm.value.items.push({ item_pekerjaan: '', qty: 1, harga_satuan: 0 });
};

const removeRABLineItem = (idx) => {
  rabForm.value.items.splice(idx, 1);
};

const onHarsatSelected = (item) => {
  const matched = maintenanceStore.harsat.find(h => h.deskripsi.toLowerCase() === item.item_pekerjaan.toLowerCase());
  if (matched) {
    item.harga_satuan = matched.harga_satuan;
  }
};

const calculateRABTotal = computed(() => {
  return rabForm.value.items.reduce((acc, it) => acc + ((Number(it.qty) || 0) * (Number(it.harga_satuan) || 0)), 0);
});

const submitRABAction = async () => {
  try {
    const payload = {
      no_laporan: rabForm.value.no_laporan,
      nopol: rabForm.value.nopol,
      items: rabForm.value.items
    };
    const res = await maintenanceStore.submitRAB(payload);
    showAlert(`RAB ${res.data.no_rab} berhasil disimpan!`, 'success');
    
    // Auto-fill SPK form
    spkForm.value.no_laporan = rabForm.value.no_laporan;
    spkForm.value.no_rab = res.data.no_rab;
    spkForm.value.nopol = rabForm.value.nopol;
    spkForm.value.total_nilai_spk = res.data.total_estimasi;
  } catch (err) {
    showAlert(`Gagal simpan RAB: ${err.message}`, 'error');
  }
};

const resetRABForm = () => {
  rabForm.value = {
    no_laporan: '',
    nopol: '',
    items: [{ item_pekerjaan: '', qty: 1, harga_satuan: 0 }]
  };
};

// ==================== TAB 4: SPK ACTIONS ====================
const onSPKLaporanSelected = () => {
  const found = maintenanceStore.reports.find(r => r.no_laporan === spkForm.value.no_laporan);
  if (found) {
    spkForm.value.nopol = found.nopol;
    spkForm.value.total_nilai_spk = found.estimasi_biaya || 500000;
  }
};

const handleSPKSubmit = async () => {
  try {
    const res = await maintenanceStore.createSPK({ ...spkForm.value });
    showAlert(`Surat Perintah Kerja ${res.data.no_spk} berhasil diterbitkan!`, 'success');
  } catch (err) {
    showAlert(`Gagal terbitkan SPK: ${err.message}`, 'error');
  }
};

const markSPKCompleted = async (spk) => {
  if (confirm(`Tandai SPK ${spk.no_spk} (${spk.nopol}) sebagai SELESAI?`)) {
    try {
      await maintenanceStore.updateReportStatus({
        no_laporan: spk.no_laporan,
        status: 'SELESAI',
        biaya_realisasi: spk.total_nilai
      });
      await maintenanceStore.fetchReports();
      showAlert(`Perbaikan ${spk.no_laporan} dinyatakan selesai dan armada siap beroperasi.`, 'success');
    } catch (err) {
      showAlert(`Gagal: ${err.message}`, 'error');
    }
  }
};

// ==================== TAB 5: MASTER ACTIONS ====================
const openAddHarsatPrompt = async () => {
  const deskripsi = prompt('Deskripsi Suku Cadang / Pekerjaan Mekanik:');
  if (deskripsi) {
    const harga = prompt('Harga Satuan Acuan (Rp):', '350000');
    const kategori = prompt('Kategori (Jasa Mekanik / Fast Moving Part / Oli):', 'Fast Moving Part');
    try {
      await maintenanceStore.addHarsatItem({
        deskripsi,
        harga_satuan: Number(harga) || 0,
        kategori
      });
      showAlert(`Item Harsat ${deskripsi} berhasil ditambahkan.`, 'success');
    } catch (err) {
      showAlert(`Gagal: ${err.message}`, 'error');
    }
  }
};

// ==================== FILE UPLOAD & PDF ACTIONS (MTN-014 & MTN-015) ====================
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    const base64 = evt.target.result;
    try {
      const res = await maintenanceStore.uploadDocument({
        base64,
        fileName: file.name,
        fileType: file.type
      });
      laporForm.value.foto_kerusakan_url = res.data.url;
      showAlert(`Foto kerusakan ${file.name} berhasil diunggah.`, 'success');
    } catch (err) {
      showAlert(`Gagal mengunggah foto: ${err.message}`, 'error');
    }
  };
  reader.readAsDataURL(file);
};

const generateRABPDF = async () => {
  if (!rabForm.value.no_laporan) return;
  try {
    const res = await maintenanceStore.generatePDF({
      docType: 'RAB',
      uid: rabForm.value.no_laporan
    });
    window.open(res.data.url, '_blank');
    showAlert(`Dokumen PDF RAB telah digenerate: ${res.data.fileName}`, 'success');
  } catch (err) {
    showAlert(`Gagal generate PDF: ${err.message}`, 'error');
  }
};

const generateSPKPDF = async (spk) => {
  try {
    const res = await maintenanceStore.generatePDF({
      docType: 'SPK',
      uid: spk.no_spk
    });
    window.open(res.data.url, '_blank');
    showAlert(`Dokumen PDF SPK telah digenerate: ${res.data.fileName}`, 'success');
  } catch (err) {
    showAlert(`Gagal generate PDF: ${err.message}`, 'error');
  }
};

// ==================== VEHICLES & HARSAT ACTIONS (MTN-009 & MTN-010) ====================
const openAddVehiclePrompt = async () => {
  const nopol = prompt('Nomor Polisi Armada Baru (contoh: KT 8888 ZZ):');
  if (nopol) {
    const merk = prompt('Merk & Model Armada:', 'Toyota Hilux 4x4');
    const km = prompt('KM Odometer Saat Ini:', '10000');
    try {
      await maintenanceStore.createVehicle({
        nopol,
        merk_model: merk || 'Armada Operasional',
        odometer: Number(km) || 0,
        status_operasional: 'SIAP_OPERASI'
      });
      showAlert(`Armada ${nopol} berhasil didaftarkan ke sistem.`, 'success');
    } catch (err) {
      showAlert(`Gagal daftarkan armada: ${err.message}`, 'error');
    }
  }
};

const editHarsatItem = async (h) => {
  const newHarga = prompt(`Ubah Tarif Acuan untuk "${h.deskripsi}" (Rp):`, String(h.harga_satuan));
  if (newHarga !== null) {
    try {
      await maintenanceStore.updateHarsatItem({
        kode_item: h.kode_item,
        harga_satuan: Number(newHarga) || h.harga_satuan
      });
      showAlert(`Tarif item ${h.kode_item} berhasil diperbarui.`, 'success');
    } catch (err) {
      showAlert(`Gagal perbarui tarif: ${err.message}`, 'error');
    }
  }
};

const deleteHarsatItem = async (h) => {
  if (confirm(`Nonaktifkan item "${h.deskripsi}" (${h.kode_item}) dari katalog Harsat?`)) {
    try {
      await maintenanceStore.deleteHarsatItem(h.kode_item);
      showAlert(`Item ${h.kode_item} dinonaktifkan.`, 'success');
    } catch (err) {
      showAlert(`Gagal nonaktifkan: ${err.message}`, 'error');
    }
  }
};

// ==================== USER MANAGER ACTIONS (MTN-023) ====================
const toggleUser = async (u) => {
  try {
    await maintenanceStore.toggleUserStatus({ email: u.email });
    showAlert(`Status pengguna ${u.nama} berhasil diperbarui.`, 'success');
  } catch (err) {
    showAlert(`Gagal memperbarui status user: ${err.message}`, 'error');
  }
};

// Formatting
const formatNumber = (num) => {
  return Number(num || 0).toLocaleString('id-ID');
};
</script>

<style scoped>
.module-container {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
}

/* Header */
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-titles h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  color: #0f172a;
  font-weight: 700;
}

.subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Alerts */
.alert {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
}

.alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.alert-warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.alert-info { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: inherit;
}

/* Sub Nav Tabs */
.sub-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 2px;
}

.tab-btn {
  padding: 0.65rem 1.2rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-btn:hover { color: #2563eb; }
.tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: #fff;
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0.35rem 0;
}

.stat-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Cards & Containers */
.card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
}

.table-header {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* Tables */
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

.border-table th, .border-table td {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
}

.table-summary-row td {
  background: #f8fafc;
  border-top: 2px solid #cbd5e1;
  padding: 0.75rem 1.25rem;
}

/* Forms */
.form-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.4rem;
}

.form-control {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-control-sm {
  padding: 0.4rem 0.65rem;
  font-size: 0.8125rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 { flex: 1; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 860px) {
  .two-col-grid { grid-template-columns: 1fr; }
}

.max-w-800 { max-width: 800px; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Status Pills */
.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-laporan_baru { background: #fef3c7; color: #b45309; }
.status-rab_diajukan { background: #e0e7ff; color: #3730a3; }
.status-spk_terbit { background: #fed7aa; color: #9a3412; }
.status-dalam_pengerjaan { background: #dbeafe; color: #1d4ed8; }
.status-selesai { background: #dcfce7; color: #15803d; }
.status-active { background: #dcfce7; color: #15803d; }
.status-expired { background: #fee2e2; color: #b91c1c; }

.badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary { background-color: #2563eb; color: #fff; }
.btn-primary:hover { background-color: #1d4ed8; }
.btn-secondary { background-color: #f1f5f9; color: #334155; border-color: #cbd5e1; }
.btn-secondary:hover { background-color: #e2e8f0; }
.btn-outline-primary { background: transparent; border-color: #2563eb; color: #2563eb; }
.btn-outline-primary:hover { background: #eff6ff; }
.btn-outline-success { background: transparent; border-color: #16a34a; color: #16a34a; }
.btn-outline-success:hover { background: #ecfdf5; }
.btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8125rem; }
.btn-xs { padding: 0.25rem 0.55rem; font-size: 0.75rem; }

/* Helpers */
.font-mono { font-family: monospace; }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-muted { color: #94a3b8; }
.text-xs { font-size: 0.75rem; }
.text-primary { color: #2563eb; }
.text-success { color: #15803d; }
.text-danger { color: #b91c1c; }
.text-warning { color: #b45309; }
.text-info { color: #0284c7; }
.bg-light { background-color: #f8fafc; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.truncate-text {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
