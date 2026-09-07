<template>
  <div class="module-container">
    <!-- Header Section -->
    <header class="module-header">
      <div class="header-titles">
        <h2>🚙 Vehicle Booking System (Peminjaman KR)</h2>
        <p class="subtitle">Reservasi kendaraan operasional, alur persetujuan berjenjang (Atasan & Pool), dan notifikasi WhatsApp.</p>
      </div>
      <div class="header-right">
        <button 
          class="btn btn-sm btn-secondary" 
          :disabled="bookingStore.isLoading" 
          @click="refreshData"
        >
          🔄 Refresh
        </button>
        <button 
          class="btn btn-sm btn-primary" 
          @click="activeTab = 'form'"
        >
          + Ajukan Peminjaman
        </button>
      </div>
    </header>

    <!-- Alert Notifications -->
    <div v-if="alertMessage" class="alert" :class="`alert-${alertType}`">
      <span>{{ alertMessage }}</span>
      <button class="close-btn" @click="alertMessage = ''">&times;</button>
    </div>

    <!-- Navigation Tabs -->
    <nav class="sub-nav">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'form' }" 
        @click="activeTab = 'form'"
      >
        📝 Form Pengajuan (BKG-016)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'list' }" 
        @click="switchTab('list')"
      >
        📋 Daftar Permintaan (BKG-017)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'approval' }" 
        @click="switchTab('approval')"
      >
        ✅ Dasbor Approval (BKG-018)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'wa_approve' }" 
        @click="activeTab = 'wa_approve'"
      >
        📲 Quick Approval WA (BKG-019)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'admin' }" 
        @click="switchTab('admin')"
      >
        ⚙️ Panel Admin (BKG-020)
      </button>
    </nav>

    <!-- ==================== TAB 1: FORM PENGAJUAN (BKG-016) ==================== -->
    <div v-if="activeTab === 'form'" class="tab-content">
      <div class="two-col-grid">
        <!-- Form Peminjaman -->
        <div class="card">
          <div class="card-header">
            <h3>Formulir Permohonan Peminjaman Kendaraan</h3>
            <p class="subtitle">Lengkapi formulir di bawah ini untuk mengajukan peminjaman kendaraan operasional.</p>
          </div>

          <form @submit.prevent="handleFormSubmit" class="form-body">
            <!-- Peminjam -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nama Peminjam *</label>
                <select v-model="form.peminjam" required class="form-control" @change="onUserSelected">
                  <option value="">-- Pilih Karyawan --</option>
                  <option v-for="u in bookingStore.users" :key="u.ndk" :value="u.nama">
                    {{ u.nama }} ({{ u.ndk }}) - {{ u.departemen }}
                  </option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>NDK / NPK Peminjam</label>
                <input v-model="form.ndk" type="text" readonly class="form-control bg-light" placeholder="Otomatis terisi" />
              </div>
            </div>

            <!-- Nopol -->
            <div class="form-group">
              <label>Pilih Kendaraan (Nopol) *</label>
              <select v-model="form.nopol" required class="form-control">
                <option value="">-- Pilih Kendaraan Tersedia --</option>
                <option v-for="v in bookingStore.vehicles" :key="v.nopol" :value="v.nopol">
                  {{ v.nopol }} — {{ v.jenis }} ({{ v.unit }})
                </option>
              </select>
            </div>

            <!-- Jadwal Pinjam -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Tanggal Mulai Pinjam *</label>
                <input v-model="form.tgl_pinjam" type="date" required class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label>Jam Mulai *</label>
                <input v-model="form.jam_pinjam" type="time" required class="form-control" />
              </div>
            </div>

            <!-- Jadwal Kembali -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Tanggal Rencana Kembali *</label>
                <input v-model="form.tgl_kembali" type="date" required class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label>Jam Rencana Kembali *</label>
                <input v-model="form.jam_kembali" type="time" required class="form-control" />
              </div>
            </div>

            <!-- Keperluan & Lokasi -->
            <div class="form-group">
              <label>Keperluan / Urusan Dinas *</label>
              <textarea 
                v-model="form.keperluan" 
                rows="2" 
                placeholder="Jelaskan agenda dinas / keperluan penggunaan kendaraan..." 
                required 
                class="form-control"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Jenis Keperluan</label>
                <select v-model="form.jenis_keperluan" class="form-control">
                  <option value="Operasional">Operasional</option>
                  <option value="Non Operasional">Non Operasional</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label>Lokasi Tujuan *</label>
                <input v-model="form.lokasi" type="text" placeholder="Contoh: Site Sangatta / Balikpapan" required class="form-control" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Driver / Pengemudi</label>
                <input v-model="form.driver" type="text" placeholder="Lepas Kunci / Nama Supir" class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label>Atasan Langsung (Approver 1) *</label>
                <select v-model="form.atasan" required class="form-control">
                  <option v-for="at in bookingStore.approvers" :key="at.nama" :value="at.nama">
                    {{ at.nama }} ({{ at.jabatan }})
                  </option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="resetForm">
                Reset
              </button>
              <button type="submit" class="btn btn-primary" :disabled="bookingStore.isSubmitting">
                {{ bookingStore.isSubmitting ? 'Mengirim Pengajuan...' : '🚀 Ajukan Peminjaman KR' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Bukti Pengajuan / Preview Slip -->
        <div class="card preview-card">
          <div class="card-header">
            <h3>📄 Bukti Pengajuan Terakhir</h3>
            <span class="badge" :class="submittedBooking ? 'badge-success' : 'badge-neutral'">
              {{ submittedBooking ? 'Diajukan' : 'Menunggu Form' }}
            </span>
          </div>

          <div v-if="submittedBooking" class="booking-slip">
            <div class="slip-header">
              <span class="brand">VAMOS FMS</span>
              <span class="type">FORMULIR PEMINJAMAN KR</span>
            </div>
            <div class="slip-code">
              <span class="code-label">NOMOR UID PEMINJAMAN</span>
              <span class="code-value">{{ submittedBooking.uid }}</span>
            </div>
            <div class="slip-details">
              <div class="detail-item">
                <span class="label">Nopol Kendaraan:</span>
                <span class="val font-bold text-primary">{{ submittedBooking.nopol }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Peminjam:</span>
                <span class="val">{{ submittedBooking.peminjam }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Status Pengajuan:</span>
                <span class="status-pill status-pending_am">{{ submittedBooking.status }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Notifikasi Terkirim:</span>
                <span class="val text-success">✓ WhatsApp Approver Otomatis</span>
              </div>
            </div>
            <div class="slip-actions">
              <button class="btn btn-sm btn-outline-primary" @click="copyUID(submittedBooking.uid)">
                📋 Salin UID
              </button>
              <button class="btn btn-sm btn-primary" @click="switchTab('list')">
                Lihat di Daftar
              </button>
            </div>
          </div>

          <div v-else class="empty-preview">
            <div class="empty-icon">🚙</div>
            <h4>Belum Ada Pengajuan</h4>
            <p>Silakan lengkapi formulir di samping untuk mengajukan permohonan peminjaman unit operasional.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== TAB 2: DAFTAR PERMINTAAN & STATUS (BKG-017) ==================== -->
    <div v-if="activeTab === 'list'" class="tab-content">
      <!-- Status KPI Cards -->
      <div class="stats-grid">
        <div class="stat-card" @click="bookingStore.filterStatus = 'ALL'">
          <span class="stat-label">Total Booking</span>
          <span class="stat-value">{{ bookingStore.statusCounts.total }}</span>
          <span class="stat-sub">Seluruh transaksi</span>
        </div>
        <div class="stat-card" @click="bookingStore.filterStatus = 'PENDING_AM'">
          <span class="stat-label">Menunggu Atasan (AM)</span>
          <span class="stat-value text-warning">{{ bookingStore.statusCounts.pending_am }}</span>
          <span class="stat-sub">Tahap 1 persetujuan</span>
        </div>
        <div class="stat-card" @click="bookingStore.filterStatus = 'PENDING_GS1'">
          <span class="stat-label">Siap Serah Keluar (Pool)</span>
          <span class="stat-value text-info">{{ bookingStore.statusCounts.pending_gs1 }}</span>
          <span class="stat-sub">Verifikasi pool keluar</span>
        </div>
        <div class="stat-card" @click="bookingStore.filterStatus = 'ON_TRIP'">
          <span class="stat-label">Sedang Dipinjam</span>
          <span class="stat-value text-primary">{{ bookingStore.statusCounts.on_trip }}</span>
          <span class="stat-sub">Kendaraan di luar site</span>
        </div>
        <div class="stat-card" @click="bookingStore.filterStatus = 'COMPLETED'">
          <span class="stat-label">Selesai (Kembali)</span>
          <span class="stat-value text-success">{{ bookingStore.statusCounts.completed }}</span>
          <span class="stat-sub">Peminjaman tuntas</span>
        </div>
      </div>

      <!-- Table Section -->
      <div class="card table-container">
        <div class="table-header">
          <div class="header-filter-group">
            <h3>Daftar Permohonan Peminjaman</h3>
            <div class="search-box">
              <input 
                v-model="bookingStore.searchQuery" 
                type="text" 
                placeholder="Cari UID / Peminjam / Nopol..." 
                class="form-control form-control-sm"
              />
            </div>
            <select v-model="bookingStore.filterStatus" class="form-control form-control-sm">
              <option value="ALL">Semua Status</option>
              <option value="PENDING_AM">PENDING_AM (Atasan)</option>
              <option value="PENDING_GS1">PENDING_GS1 (Pool Keluar)</option>
              <option value="ON_TRIP">ON_TRIP (Sedang Jalan)</option>
              <option value="COMPLETED">COMPLETED (Selesai)</option>
              <option value="REJECTED">REJECTED (Ditolak)</option>
            </select>
          </div>
          <button class="btn btn-sm btn-primary" @click="activeTab = 'form'">
            + Permintaan Baru
          </button>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Kendaraan</th>
              <th>Peminjam</th>
              <th>Jadwal Pinjam</th>
              <th>Jadwal Kembali</th>
              <th>Tujuan / Keperluan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="bookingStore.filteredBookings.length === 0">
              <td colspan="8" class="text-center py-4 text-muted">
                {{ bookingStore.isLoading ? 'Memuat data peminjaman...' : 'Tidak ada data booking yang sesuai filter.' }}
              </td>
            </tr>
            <tr v-for="b in bookingStore.filteredBookings" :key="b.uid">
              <td class="font-mono font-bold">{{ b.uid }}</td>
              <td>
                <strong>{{ b.nopol }}</strong>
                <div class="text-xs text-muted">{{ b.driver || 'Lepas Kunci' }}</div>
              </td>
              <td>
                {{ b.peminjam }}
                <div class="text-xs text-muted">{{ b.ndk }}</div>
              </td>
              <td>{{ b.tgl_pinjam }} <span class="text-xs text-muted">{{ b.jam_pinjam }}</span></td>
              <td>{{ b.tgl_kembali }} <span class="text-xs text-muted">{{ b.jam_kembali }}</span></td>
              <td>
                <div class="truncate-text">{{ b.keperluan }}</div>
                <span class="badge text-xs">{{ b.lokasi || 'Site' }}</span>
              </td>
              <td>
                <span :class="['status-pill', `status-${(b.status || 'draft').toLowerCase()}`]">
                  {{ b.status }}
                </span>
              </td>
              <td>
                <button class="btn btn-xs btn-outline-primary" @click="openApprovalModal(b)">
                  Proses / Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== TAB 3: DASBOR APPROVAL PER ROLE (BKG-018) ==================== -->
    <div v-if="activeTab === 'approval'" class="tab-content">
      <div class="card mb-4">
        <div class="card-header">
          <h3>✅ Dasbor Otorisasi & Alur Persetujuan Bertingkat</h3>
          <p class="subtitle">Validasi persetujuan Atasan (AM) dan verifikasi serah terima armada oleh Petugas Pool (GS).</p>
        </div>
      </div>

      <!-- Active Approval Tasks Grid -->
      <div class="two-col-grid">
        <!-- List of Pending Items -->
        <div class="card">
          <div class="card-header">
            <h3>Antrean Permintaan Menunggu Otorisasi</h3>
          </div>
          <div class="pending-list">
            <div v-if="pendingBookings.length === 0" class="text-center py-4 text-muted">
              Tidak ada antrean approval yang tertunda. Semua permohonan up-to-date!
            </div>
            <div 
              v-for="b in pendingBookings" 
              :key="b.uid" 
              class="pending-item"
              :class="{ selected: selectedBookingForApproval && selectedBookingForApproval.uid === b.uid }"
              @click="selectForApproval(b)"
            >
              <div class="item-head">
                <span class="font-mono font-bold">{{ b.uid }}</span>
                <span :class="['status-pill', `status-${b.status.toLowerCase()}`]">{{ b.status }}</span>
              </div>
              <div class="item-body">
                <div><strong>{{ b.nopol }}</strong> — {{ b.peminjam }}</div>
                <div class="text-xs text-muted">Jadwal: {{ b.tgl_pinjam }} s/d {{ b.tgl_kembali }}</div>
                <div class="text-xs text-muted mt-1">Keperluan: {{ b.keperluan }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Approval Execution Form -->
        <div class="card">
          <div class="card-header">
            <h3>Formulir Tindakan Otorisasi</h3>
            <span v-if="selectedBookingForApproval" class="badge badge-success">
              {{ selectedBookingForApproval.uid }}
            </span>
          </div>

          <div v-if="selectedBookingForApproval" class="form-body">
            <!-- Stage 1: Atasan 1 (AM) Approval -->
            <div v-if="selectedBookingForApproval.status === 'PENDING_AM'">
              <div class="alert alert-info mb-3">
                <strong>Tahap 1: Otorisasi Atasan Langsung (SM / AM)</strong><br />
                Pastikan keperluan dinas sesuai dengan penugasan kerja peminjam.
              </div>

              <div class="form-group">
                <label>Catatan Persetujuan / Alasan (Opsional jika setuju, wajib jika tolak):</label>
                <textarea v-model="approvalAction.alasan" rows="3" class="form-control" placeholder="Tuliskan catatan persetujuan..."></textarea>
              </div>

              <div class="form-actions">
                <button class="btn btn-outline-danger" @click="executeApproval('REJECT')">
                  ❌ Tolak Permintaan
                </button>
                <button class="btn btn-primary" @click="executeApproval('APPROVE')">
                  ✅ Setujui Permohonan (Kirim ke Pool)
                </button>
              </div>
            </div>

            <!-- Stage 2: Pool GS1 Serah Keluar -->
            <div v-else-if="selectedBookingForApproval.status === 'PENDING_GS1'">
              <div class="alert alert-warning mb-3">
                <strong>Tahap 2: Pemeriksaan & Serah Keluar Kendaraan (Pool GS)</strong><br />
                Lakukan inspeksi fisik dan catat kondisi armada sebelum diserahkan ke peminjam.
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Kilometer Odometer Keluar *</label>
                  <input v-model.number="approvalAction.km_keluar" type="number" placeholder="KM Odometer" class="form-control" />
                </div>
                <div class="form-group flex-1">
                  <label>Posisi BBM Keluar (Bar/Strip) *</label>
                  <select v-model="approvalAction.bbm_keluar" class="form-control">
                    <option value="Full">Full (Penuh)</option>
                    <option value="3/4">3/4 Tangki</option>
                    <option value="1/2">1/2 Tangki</option>
                    <option value="1/4">1/4 Tangki</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Kondisi Fisik Kendaraan saat Keluar *</label>
                <input v-model="approvalAction.kondisi_keluar" type="text" placeholder="Contoh: Bodi mulus, lampu fungsi normal, ban cadangan ada" class="form-control" />
              </div>

              <div class="form-actions">
                <button class="btn btn-outline-danger" @click="executeApproval('REJECT')">
                  ❌ Batalkan Peminjaman
                </button>
                <button class="btn btn-primary" @click="executeApproval('APPROVE')">
                  🚗 Serahkan Kendaraan (Status ON_TRIP)
                </button>
              </div>
            </div>

            <!-- Stage 3: Pool GS2 Serah Masuk / Kembali -->
            <div v-else-if="selectedBookingForApproval.status === 'ON_TRIP' || selectedBookingForApproval.status === 'PENDING_GS2'">
              <div class="alert alert-success mb-3">
                <strong>Tahap 3: Pengembalian Armada & Serah Masuk (Pool GS)</strong><br />
                Peminjam telah mengembalikan unit. Verifikasi KM akhir dan kelengkapan armada.
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Kilometer Odometer Kembali *</label>
                  <input v-model.number="approvalAction.km_masuk" type="number" placeholder="KM Saat Kembali" class="form-control" />
                </div>
                <div class="form-group flex-1">
                  <label>Posisi BBM Kembali *</label>
                  <select v-model="approvalAction.bbm_masuk" class="form-control">
                    <option value="Full">Full (Penuh)</option>
                    <option value="3/4">3/4 Tangki</option>
                    <option value="1/2">1/2 Tangki</option>
                    <option value="1/4">1/4 Tangki</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Kondisi Fisik Saat Pengembalian *</label>
                <input v-model="approvalAction.kondisi_masuk" type="text" placeholder="Contoh: Unit bersih, tidak ada lecet baru" class="form-control" />
              </div>

              <div class="form-actions">
                <button class="btn btn-primary" @click="executeApproval('APPROVE')">
                  🏁 Selesaikan Peminjaman (COMPLETED)
                </button>
              </div>
            </div>

            <div v-else>
              <p class="text-muted">Transaksi ini berstatus <strong>{{ selectedBookingForApproval.status }}</strong> dan tidak memerlukan otorisasi lanjutan.</p>
            </div>
          </div>

          <div v-else class="empty-preview">
            <div class="empty-icon">👈</div>
            <h4>Pilih Antrean di Samping</h4>
            <p>Klik salah satu transaksi permohonan untuk memproses persetujuan atau serah terima unit.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== TAB 4: QUICK APPROVAL WA (BKG-019) ==================== -->
    <div v-if="activeTab === 'wa_approve'" class="tab-content">
      <div class="card max-w-600 mx-auto">
        <div class="card-header">
          <h3>📲 Simulator / Landing Page Approval via Tautan WhatsApp</h3>
          <p class="subtitle">Memvalidasi token HMAC-SHA256 agar atasan dapat memberikan persetujuan tanpa perlu login penuh.</p>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label>UID Booking *</label>
            <input v-model="waQuickForm.uid" type="text" placeholder="Contoh: BKG-20260908-1001" class="form-control font-mono" />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Peran Approver</label>
              <select v-model="waQuickForm.role" class="form-control">
                <option value="AM">AM (Site Manager)</option>
                <option value="GS1">GS1 (Petugas Pool)</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>Tindakan</label>
              <select v-model="waQuickForm.act" class="form-control">
                <option value="APPROVE">APPROVE (Setujui)</option>
                <option value="REJECT">REJECT (Tolak)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Token Verifikasi HMAC-SHA256</label>
            <input v-model="waQuickForm.tok" type="text" placeholder="Token otentikasi tanda tangan" class="form-control font-mono" />
          </div>

          <div class="form-actions">
            <button class="btn btn-primary full-width" :disabled="bookingStore.isLoading" @click="handleQuickWAAction">
              {{ bookingStore.isLoading ? 'Memvalidasi Token...' : '⚡ Eksekusi Persetujuan Cepat' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== TAB 5: PANEL ADMIN BOOKING (BKG-020) ==================== -->
    <div v-if="activeTab === 'admin'" class="tab-content">
      <div class="card mb-4">
        <div class="card-header flex-between">
          <div>
            <h3>⚙️ Panel Administrasi Master Booking & Notifikasi</h3>
            <p class="subtitle">Kelola master nopol armada, pengguna peminjam, approver WA, dan pantau antrean pesan.</p>
          </div>
          <div class="admin-tabs">
            <button class="btn btn-xs" :class="adminSubTab === 'nopol' ? 'btn-primary' : 'btn-secondary'" @click="adminSubTab = 'nopol'">
              Armada Nopol
            </button>
            <button class="btn btn-xs" :class="adminSubTab === 'users' ? 'btn-primary' : 'btn-secondary'" @click="adminSubTab = 'users'">
              User Peminjam
            </button>
            <button class="btn btn-xs" :class="adminSubTab === 'approvers' ? 'btn-primary' : 'btn-secondary'" @click="adminSubTab = 'approvers'">
              Approver WA
            </button>
            <button class="btn btn-xs" :class="adminSubTab === 'outbox' ? 'btn-primary' : 'btn-secondary'" @click="loadOutboxTab">
              WA Outbox
            </button>
          </div>
        </div>
      </div>

      <!-- Sub-Tab 1: Nopol -->
      <div v-if="adminSubTab === 'nopol'" class="card table-container">
        <div class="table-header">
          <h3>Master Armada Kendaraan Roda 4</h3>
          <button class="btn btn-xs btn-primary" @click="openAddNopolPrompt">+ Tambah Nopol</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nomor Polisi</th>
              <th>Departemen / Unit</th>
              <th>Merk & Model</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in bookingStore.vehicles" :key="v.nopol">
              <td class="font-mono font-bold">{{ v.nopol }}</td>
              <td>{{ v.unit }}</td>
              <td>{{ v.jenis }}</td>
              <td><span class="status-pill status-active">{{ v.status }}</span></td>
              <td>
                <button class="btn btn-xs btn-outline-danger" @click="confirmDeleteNopol(v.nopol)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sub-Tab 2: Users -->
      <div v-if="adminSubTab === 'users'" class="card table-container">
        <div class="table-header">
          <h3>Master User Peminjam</h3>
          <button class="btn btn-xs btn-primary" @click="openAddUserPrompt">+ Tambah User</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>NDK / NPK</th>
              <th>Departemen</th>
              <th>No WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in bookingStore.users" :key="u.ndk">
              <td><strong>{{ u.nama }}</strong></td>
              <td class="font-mono">{{ u.ndk }}</td>
              <td>{{ u.departemen }}</td>
              <td>{{ u.noWa }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sub-Tab 3: Approvers -->
      <div v-if="adminSubTab === 'approvers'" class="card table-container">
        <div class="table-header">
          <h3>Master Kontak Atasan & Approver WA</h3>
          <button class="btn btn-xs btn-primary" @click="openAddApproverPrompt">+ Tambah Approver</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Atasan</th>
              <th>Jabatan</th>
              <th>No WhatsApp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in bookingStore.approvers" :key="a.nama">
              <td><strong>{{ a.nama }}</strong></td>
              <td>{{ a.jabatan }}</td>
              <td>{{ a.noWa }}</td>
              <td><span class="status-pill status-active">{{ a.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sub-Tab 4: WA Outbox -->
      <div v-if="adminSubTab === 'outbox'" class="card table-container">
        <div class="table-header">
          <h3>Antrean Pesan WhatsApp Outbox (WA_Outbox)</h3>
          <button class="btn btn-xs btn-secondary" @click="bookingStore.fetchOutbox()">🔄 Refresh Outbox</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Message ID</th>
              <th>Modul</th>
              <th>Tujuan WA</th>
              <th>Isi Pesan</th>
              <th>Status</th>
              <th>Waktu Antrean</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="bookingStore.outbox.length === 0">
              <td colspan="6" class="text-center py-4 text-muted">Belum ada antrean pesan keluar.</td>
            </tr>
            <tr v-for="m in bookingStore.outbox" :key="m.msgId">
              <td class="font-mono text-xs">{{ m.msgId }}</td>
              <td><span class="badge">{{ m.module }}</span></td>
              <td>{{ m.targetWa }}</td>
              <td><div class="truncate-text">{{ m.messageBody }}</div></td>
              <td><span class="status-pill status-active">{{ m.status }}</span></td>
              <td>{{ m.createdAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useBookingStore } from '../stores/bookingStore.js';

const bookingStore = useBookingStore();

// State
const activeTab = ref('form');
const adminSubTab = ref('nopol');
const alertMessage = ref('');
const alertType = ref('success');
const submittedBooking = ref(null);

// Form Pengajuan
const form = ref({
  peminjam: '',
  ndk: '',
  nopol: '',
  tgl_pinjam: new Date().toISOString().split('T')[0],
  jam_pinjam: '08:00',
  tgl_kembali: new Date().toISOString().split('T')[0],
  jam_kembali: '17:00',
  keperluan: '',
  jenis_keperluan: 'Operasional',
  lokasi: '',
  driver: 'Lepas Kunci',
  atasan: 'Ir. Bambang Wijaya (Site Manager)',
  atasan2: 'Rahmat Hidayat (GS)'
});

// State for Approval Dashboard
const selectedBookingForApproval = ref(null);
const approvalAction = ref({
  alasan: '',
  km_keluar: 15420,
  bbm_keluar: 'Full',
  kondisi_keluar: 'Baik & Lengkap',
  km_masuk: 15580,
  bbm_masuk: 'Full',
  kondisi_masuk: 'Lengkap'
});

// State for Quick WA Simulator
const waQuickForm = ref({
  uid: '',
  role: 'AM',
  act: 'APPROVE',
  exp: String(Date.now() + 24 * 3600 * 1000),
  tok: ''
});

onMounted(async () => {
  await bookingStore.fetchMasterData();
  await bookingStore.fetchBookings();

  // Read URL query params jika dibuka dari link approval WA (page=approve_wa)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('page') === 'approve_wa' || urlParams.get('uid')) {
    activeTab.value = 'wa_approve';
    waQuickForm.value.uid = urlParams.get('uid') || '';
    waQuickForm.value.role = urlParams.get('role') || 'AM';
    waQuickForm.value.act = urlParams.get('act') || 'APPROVE';
    waQuickForm.value.exp = urlParams.get('exp') || String(Date.now() + 24 * 3600 * 1000);
    waQuickForm.value.tok = urlParams.get('tok') || '';
  }
});

const switchTab = async (tab) => {
  activeTab.value = tab;
  if (tab === 'list' || tab === 'approval') {
    await bookingStore.fetchBookings();
  }
};

const refreshData = async () => {
  await bookingStore.fetchMasterData();
  await bookingStore.fetchBookings();
  showAlert('Data booking berhasil disegarkan.', 'success');
};

const showAlert = (msg, type = 'success') => {
  alertMessage.value = msg;
  alertType.value = type;
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = '';
  }, 6000);
};

// Auto-fill NDK when user selected
const onUserSelected = () => {
  const found = bookingStore.users.find(u => u.nama === form.value.peminjam);
  if (found) {
    form.value.ndk = found.ndk;
  }
};

// Submit Booking Form
const handleFormSubmit = async () => {
  try {
    const payload = { ...form.value };
    const res = await bookingStore.submitBooking(payload);
    submittedBooking.value = res.data;
    showAlert(`Permohonan peminjaman ${res.data.uid} berhasil diajukan!`, 'success');
    resetForm();
  } catch (err) {
    showAlert(`Gagal mengajukan booking: ${err.message}`, 'error');
  }
};

const resetForm = () => {
  form.value = {
    peminjam: '',
    ndk: '',
    nopol: '',
    tgl_pinjam: new Date().toISOString().split('T')[0],
    jam_pinjam: '08:00',
    tgl_kembali: new Date().toISOString().split('T')[0],
    jam_kembali: '17:00',
    keperluan: '',
    jenis_keperluan: 'Operasional',
    lokasi: '',
    driver: 'Lepas Kunci',
    atasan: 'Ir. Bambang Wijaya (Site Manager)',
    atasan2: 'Rahmat Hidayat (GS)'
  };
};

const copyUID = (uid) => {
  navigator.clipboard.writeText(uid);
  showAlert(`UID ${uid} berhasil disalin ke clipboard!`, 'info');
};

// Approval Computations & Actions
const pendingBookings = computed(() => {
  return bookingStore.bookings.filter(b => {
    const s = (b.status || '').toUpperCase();
    return s === 'PENDING_AM' || s === 'PENDING_GS1' || s === 'ON_TRIP' || s === 'PENDING_GS2';
  });
});

const selectForApproval = (b) => {
  selectedBookingForApproval.value = b;
};

const openApprovalModal = (b) => {
  activeTab.value = 'approval';
  selectedBookingForApproval.value = b;
};

const executeApproval = async (actionType) => {
  if (!selectedBookingForApproval.value) return;

  try {
    const payload = {
      uid: selectedBookingForApproval.value.uid,
      action: actionType,
      alasan: approvalAction.value.alasan,
      km_keluar: approvalAction.value.km_keluar,
      bbm_keluar: approvalAction.value.bbm_keluar,
      kondisi_keluar: approvalAction.value.kondisi_keluar,
      km_masuk: approvalAction.value.km_masuk,
      bbm_masuk: approvalAction.value.bbm_masuk,
      kondisi_masuk: approvalAction.value.kondisi_masuk
    };

    const res = await bookingStore.processApproval(payload);
    showAlert(`Transaksi ${res.data.uid} berhasil diperbarui menjadi ${res.data.status}!`, 'success');
    selectedBookingForApproval.value = null;
  } catch (err) {
    showAlert(`Approval gagal: ${err.message}`, 'error');
  }
};

// Quick WA Action
const handleQuickWAAction = async () => {
  if (!waQuickForm.value.uid) {
    showAlert('UID wajib diisi.', 'warning');
    return;
  }

  try {
    const res = await bookingStore.processWAApproval({ ...waQuickForm.value });
    showAlert(`Persetujuan WA berhasil: ${res.data.uid} -> ${res.data.status}`, 'success');
  } catch (err) {
    showAlert(`Verifikasi approval WA gagal: ${err.message}`, 'error');
  }
};

// Admin Sub-Tab Handlers
const loadOutboxTab = async () => {
  adminSubTab.value = 'outbox';
  await bookingStore.fetchOutbox();
};

const openAddNopolPrompt = async () => {
  const nopol = prompt('Masukkan Nomor Polisi baru (Contoh: KT 8888 ZZ):');
  if (nopol) {
    const unit = prompt('Masukkan Nama Unit / Departemen:', 'Operasional Site');
    const jenis = prompt('Masukkan Merk / Jenis Unit:', 'Toyota Hilux 4x4');
    try {
      await bookingStore.addVehicle({ nopol, unit, jenis });
      showAlert(`Nopol ${nopol} berhasil ditambahkan.`, 'success');
    } catch (err) {
      showAlert(`Gagal: ${err.message}`, 'error');
    }
  }
};

const confirmDeleteNopol = async (nopol) => {
  if (confirm(`Yakin ingin menghapus Nopol ${nopol}?`)) {
    try {
      await bookingStore.deleteVehicle(nopol);
      showAlert(`Nopol ${nopol} dihapus.`, 'success');
    } catch (err) {
      showAlert(`Gagal: ${err.message}`, 'error');
    }
  }
};

const openAddUserPrompt = async () => {
  const nama = prompt('Masukkan Nama Karyawan:');
  if (nama) {
    const ndk = prompt('Masukkan NDK / NPK:');
    const departemen = prompt('Masukkan Departemen:', 'Operasional');
    const noWa = prompt('Masukkan No WhatsApp (Contoh: 62812345678):');
    try {
      await bookingStore.addUser({ nama, ndk, departemen, noWa });
      showAlert(`User ${nama} berhasil ditambahkan.`, 'success');
    } catch (err) {
      showAlert(`Gagal: ${err.message}`, 'error');
    }
  }
};

const openAddApproverPrompt = async () => {
  const nama = prompt('Masukkan Nama Atasan Approver:');
  if (nama) {
    const jabatan = prompt('Masukkan Jabatan (SM / GS / Manager):', 'Site Manager');
    const noWa = prompt('Masukkan No WhatsApp:', '628119988771');
    try {
      await bookingStore.addApprover({ nama, jabatan, noWa });
      showAlert(`Atasan ${nama} berhasil didaftarkan.`, 'success');
    } catch (err) {
      showAlert(`Gagal: ${err.message}`, 'error');
    }
  }
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

.header-filter-group h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
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

.max-w-600 { max-width: 600px; }
.mx-auto { margin-left: auto; margin-right: auto; }
.full-width { width: 100%; }

/* Booking Slip */
.booking-slip {
  padding: 1.5rem;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: #fff;
  border-radius: 12px;
  margin: 1.5rem;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}

.slip-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed rgba(255,255,255,0.2);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.slip-header .brand { font-weight: 800; letter-spacing: 0.1em; color: #38bdf8; }
.slip-header .type { font-size: 0.75rem; opacity: 0.7; }

.slip-code {
  text-align: center;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
}

.code-label { display: block; font-size: 0.7rem; color: #94a3b8; letter-spacing: 0.1em; }
.code-value { font-family: monospace; font-size: 1.4rem; font-weight: 700; color: #38bdf8; }

.slip-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.8125rem;
  margin-bottom: 1.25rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 0.35rem;
}

.slip-actions { display: flex; gap: 0.75rem; justify-content: center; }

.empty-preview {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #64748b;
}

.empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }

/* Pending List for Approval */
.pending-list {
  display: flex;
  flex-direction: column;
  max-height: 480px;
  overflow-y: auto;
}

.pending-item {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background 0.15s ease;
}

.pending-item:hover { background: #f8fafc; }
.pending-item.selected { background: #eff6ff; border-left: 4px solid #2563eb; }

.item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

/* Status Pills */
.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pending_am { background: #fef3c7; color: #b45309; }
.status-pending_gs1 { background: #e0e7ff; color: #3730a3; }
.status-on_trip { background: #dbeafe; color: #1d4ed8; }
.status-pending_gs2 { background: #e0e7ff; color: #3730a3; }
.status-completed { background: #dcfce7; color: #15803d; }
.status-rejected { background: #fee2e2; color: #b91c1c; }
.status-active { background: #dcfce7; color: #15803d; }

.badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-success { background: #dcfce7; color: #15803d; }
.badge-neutral { background: #f1f5f9; color: #64748b; }

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
.btn-outline-danger { background: transparent; border-color: #ef4444; color: #ef4444; }
.btn-outline-danger:hover { background: #fef2f2; }
.btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8125rem; }
.btn-xs { padding: 0.25rem 0.55rem; font-size: 0.75rem; }

/* Helpers */
.font-mono { font-family: monospace; }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }
.text-muted { color: #94a3b8; }
.text-xs { font-size: 0.75rem; }
.text-primary { color: #2563eb; }
.text-success { color: #15803d; }
.text-danger { color: #b91c1c; }
.text-warning { color: #b45309; }
.text-info { color: #0284c7; }
.bg-light { background-color: #f8fafc; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-1 { margin-top: 0.25rem; }
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
  flex-wrap: wrap;
  gap: 1rem;
}
.admin-tabs {
  display: flex;
  gap: 0.35rem;
}
</style>
