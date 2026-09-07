<template>
  <div class="module-container">
    <!-- Header Section -->
    <header class="module-header">
      <div class="header-titles">
        <h2>⛽ VTACS - Voucher & Fuel Tracking</h2>
        <p class="subtitle">Vehicle Tracking, Allocation & Control System dengan Validasi Anti Double-Spending & Rekonsiliasi SPBU.</p>
      </div>
      <div class="header-right">
        <div class="header-badge" :class="{ 'bg-success': isOnline, 'bg-warning': !isOnline }">
          {{ isOnline ? '🟢 Online' : '🟠 Offline Mode' }}
        </div>
        <button 
          v-if="vtacsStore.offlineQueue.length > 0" 
          class="btn btn-sm btn-outline-warning" 
          :disabled="!isOnline || vtacsStore.isSyncing"
          @click="handleSync"
        >
          {{ vtacsStore.isSyncing ? 'Syncing...' : `Sync (${vtacsStore.offlineQueue.length})` }}
        </button>
        <button 
          class="btn btn-sm btn-secondary" 
          :disabled="vtacsStore.loading" 
          @click="refreshData"
        >
          🔄 Refresh
        </button>
      </div>
    </header>

    <!-- Offline Banner -->
    <div v-if="vtacsStore.offlineQueue.length > 0" class="offline-banner">
      <span class="pulse-dot"></span>
      <span><strong>Antrean Offline:</strong> {{ vtacsStore.offlineQueue.length }} transaksi redeem tersimpan lokal di perangkat dan siap disinkronkan.</span>
      <button v-if="isOnline" class="btn btn-xs btn-primary ml-auto" @click="handleSync" :disabled="vtacsStore.isSyncing">
        Sinkronkan Sekarang
      </button>
    </div>

    <!-- Alert Messages -->
    <div v-if="alertMessage" class="alert" :class="`alert-${alertType}`">
      <span>{{ alertMessage }}</span>
      <button class="close-btn" @click="alertMessage = ''">&times;</button>
    </div>

    <!-- Tab Navigation -->
    <nav class="sub-nav">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'ledger' }" 
        @click="activeTab = 'ledger'"
      >
        📋 Buku Voucher
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'request' }" 
        @click="activeTab = 'request'"
      >
        🎫 Request Voucher (VTC-005)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'claim' }" 
        @click="activeTab = 'claim'"
      >
        ⛽ Lapor Pemakaian BBM (VTC-006)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'ga_reconcile' }" 
        @click="switchTab('ga_reconcile')"
      >
        📊 Dasbor Rekonsiliasi GA (VTC-007)
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'vendor_pom' }" 
        @click="switchTab('vendor_pom')"
      >
        🏪 Portal Vendor POM (VTC-008)
      </button>
    </nav>

    <!-- ==================== TAB 1: BUKU VOUCHER (LEDGER) ==================== -->
    <div v-if="activeTab === 'ledger'" class="tab-content">
      <!-- Summary Metrics -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Total Voucher Diterbitkan</span>
          <span class="stat-value">{{ vtacsStore.vouchers.length }}</span>
          <span class="stat-sub">Voucher virtual terdata</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Voucher Siap Pakai (Available)</span>
          <span class="stat-value text-success">{{ activeVouchersCount }}</span>
          <span class="stat-sub">Belum dicairkan</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Kuota BBM Diterbitkan</span>
          <span class="stat-value">{{ totalFuelLiters }} L</span>
          <span class="stat-sub">Volume akumulasi</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Jaringan SPBU Rekanan</span>
          <span class="stat-value text-primary">{{ vtacsStore.pomList.length }} SPBU</span>
          <span class="stat-sub">Titik pengisian resmi</span>
        </div>
      </div>

      <!-- Voucher Ledger Card -->
      <div class="card table-container">
        <div class="table-header">
          <div class="header-filter-group">
            <h3>Daftar Voucher BBM</h3>
            <div class="search-box">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Cari Kode Voucher / Nopol..." 
                class="form-control form-control-sm"
              />
            </div>
            <select v-model="statusFilter" class="form-control form-control-sm">
              <option value="ALL">Semua Status</option>
              <option value="AVAILABLE">AVAILABLE (Tersedia)</option>
              <option value="REDEEMED">REDEEMED (Terklaim)</option>
            </select>
          </div>
          <button class="btn btn-sm btn-primary" @click="activeTab = 'request'">
            + Buat Voucher Baru
          </button>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Kode Voucher</th>
              <th>Kendaraan / Nopol</th>
              <th>Kuota BBM</th>
              <th>Estimasi Nilai</th>
              <th>SPBU Tujuan</th>
              <th>Status</th>
              <th>Tgl Berlaku</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredVouchers.length === 0">
              <td colspan="8" class="text-center py-4 text-muted">
                {{ vtacsStore.loading ? 'Memuat data voucher...' : 'Tidak ada voucher yang cocok dengan kriteria pencarian.' }}
              </td>
            </tr>
            <tr v-for="voucher in filteredVouchers" :key="voucher.code">
              <td class="font-mono font-bold">{{ voucher.code }}</td>
              <td><strong>{{ voucher.nopol || '-' }}</strong></td>
              <td>{{ voucher.fuelQuota }} Liter</td>
              <td>Rp {{ formatNumber(voucher.nominal || (voucher.fuelQuota * 12500)) }}</td>
              <td>{{ getPomName(voucher.pom) }}</td>
              <td>
                <span :class="['status-pill', `status-${(voucher.status || 'available').toLowerCase()}`]">
                  {{ voucher.status }}
                </span>
              </td>
              <td>{{ voucher.expiredAt || voucher.date || '2026-12-31' }}</td>
              <td>
                <button 
                  v-if="(voucher.status || '').toUpperCase() === 'AVAILABLE'" 
                  class="btn btn-xs btn-outline-primary"
                  @click="initClaimFromVoucher(voucher)"
                >
                  Cairkan BBM
                </button>
                <span v-else class="text-muted text-xs">Selesai</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== TAB 2: REQUEST VOUCHER (VTC-005) ==================== -->
    <div v-if="activeTab === 'request'" class="tab-content">
      <div class="two-col-grid">
        <!-- Form Permintaan Voucher -->
        <div class="card">
          <div class="card-header">
            <h3>📝 Formulir Permintaan Voucher Virtual BBM</h3>
            <p class="subtitle">Ajukan alokasi kuota BBM kendaraan operasional untuk pengisian di SPBU rekanan.</p>
          </div>
          
          <form @submit.prevent="submitRequestVoucher" class="form-body">
            <div class="form-group">
              <label>Nomor Polisi Kendaraan (Nopol) *</label>
              <input 
                v-model="requestForm.nopol" 
                type="text" 
                placeholder="Contoh: KT 1234 AB" 
                required 
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label>Nama Pemohon / Driver *</label>
              <input 
                v-model="requestForm.driver" 
                type="text" 
                placeholder="Nama lengkap pengemudi" 
                required 
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label>SPBU / POM Rekanan Tujuan *</label>
              <select v-model="requestForm.pom" required class="form-control">
                <option value="ALL_STATIONS">Semua SPBU Jaringan Resmi</option>
                <option v-for="pom in vtacsStore.pomList" :key="pom.kode" :value="pom.kode">
                  {{ pom.kode }} - {{ pom.nama }} ({{ pom.lokasi }})
                </option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label>Kuota Liter BBM *</label>
                <input 
                  v-model.number="requestForm.kuotaLiter" 
                  type="number" 
                  min="5" 
                  max="500" 
                  step="1"
                  required 
                  class="form-control"
                />
              </div>
              <div class="form-group flex-1">
                <label>Estimasi Nilai (Rp 12.500/L)</label>
                <input 
                  :value="formatNumber(requestForm.kuotaLiter * 12500)" 
                  type="text" 
                  readonly 
                  class="form-control bg-light"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Keperluan Operasional / Rute Perjalanan *</label>
              <textarea 
                v-model="requestForm.keperluan" 
                rows="2" 
                placeholder="Contoh: Pengiriman logistik rute Site Samarinda - Balikpapan KM 13" 
                required 
                class="form-control"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="resetRequestForm">
                Reset
              </button>
              <button type="submit" class="btn btn-primary" :disabled="vtacsStore.loading">
                {{ vtacsStore.loading ? 'Menerbitkan...' : '🚀 Terbitkan Voucher Virtual' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Voucher Virtual Slip Result / Preview -->
        <div class="card voucher-preview-card">
          <div class="card-header">
            <h3>🎫 Preview Voucher Virtual</h3>
            <span class="badge" :class="newlyIssuedVoucher ? 'badge-success' : 'badge-neutral'">
              {{ newlyIssuedVoucher ? 'Terbit Aktif' : 'Menunggu Pengajuan' }}
            </span>
          </div>

          <div v-if="newlyIssuedVoucher" class="voucher-slip">
            <div class="slip-header">
              <span class="brand">VAMOS FMS</span>
              <span class="type">VIRTUAL FUEL VOUCHER</span>
            </div>
            <div class="slip-code">
              <span class="code-label">KODE VOUCHER</span>
              <span class="code-value">{{ newlyIssuedVoucher.code }}</span>
            </div>
            <div class="slip-details">
              <div class="detail-item">
                <span class="label">Nopol Kendaraan:</span>
                <span class="val">{{ newlyIssuedVoucher.nopol }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Alokasi Kuota:</span>
                <span class="val font-bold text-primary">{{ newlyIssuedVoucher.kuotaLiter }} Liter</span>
              </div>
              <div class="detail-item">
                <span class="label">Estimasi Nilai:</span>
                <span class="val">Rp {{ formatNumber(newlyIssuedVoucher.nominal) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Status:</span>
                <span class="status-pill status-available">{{ newlyIssuedVoucher.status }}</span>
              </div>
            </div>
            <div class="slip-barcode">
              ||| | |||| | ||| |||| || ||| || |||
            </div>
            <div class="slip-actions">
              <button class="btn btn-sm btn-outline-primary" @click="copyVoucherCode(newlyIssuedVoucher.code)">
                📋 Salin Kode
              </button>
              <button class="btn btn-sm btn-primary" @click="initClaimFromVoucher(newlyIssuedVoucher)">
                ⛽ Langsung Klaim di SPBU
              </button>
            </div>
          </div>

          <div v-else class="voucher-empty-state">
            <div class="empty-icon">🎫</div>
            <h4>Belum Ada Voucher Baru</h4>
            <p>Silakan isi formulir di samping untuk menerbitkan nomor voucher virtual BBM bagi kendaraan operasional.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== TAB 3: LAPOR PEMAKAIAN BBM (VTC-006) ==================== -->
    <div v-if="activeTab === 'claim'" class="tab-content">
      <div class="card max-w-700 mx-auto">
        <div class="card-header">
          <h3>⛽ Pelaporan Klaim Pemakaian BBM di SPBU</h3>
          <p class="subtitle">Validasi voucher secara real-time dengan proteksi double-spending dan dukungan mode offline.</p>
        </div>

        <form @submit.prevent="submitClaimForm" class="form-body">
          <!-- Debounce Input Voucher Code (VTC-006) -->
          <div class="form-group">
            <label>Nomor / Kode Voucher Virtual *</label>
            <div class="input-with-status">
              <input 
                v-model="claimForm.code" 
                type="text" 
                placeholder="Ketik kode (Contoh: VCH-2026-001)" 
                required 
                class="form-control font-mono"
                @input="handleVoucherCodeInput"
              />
              <span v-if="isCheckingVoucher" class="status-spinner">⏳ Cek...</span>
            </div>
            <!-- Voucher Validation Feedback -->
            <div v-if="voucherValidation" class="validation-feedback mt-2" :class="`feedback-${voucherValidation.type}`">
              <span class="feedback-icon">{{ voucherValidation.type === 'success' ? '✅' : '⚠️' }}</span>
              <div class="feedback-text">
                <strong>{{ voucherValidation.message }}</strong>
                <div v-if="voucherValidation.details" class="text-xs mt-1">
                  Nopol: {{ voucherValidation.details.nopol }} | Kuota: {{ voucherValidation.details.fuelQuota }} L | Status: {{ voucherValidation.details.status }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Nomor Polisi Kendaraan *</label>
              <input 
                v-model="claimForm.nopol" 
                type="text" 
                placeholder="Nopol kendaraan" 
                required 
                class="form-control"
              />
            </div>
            <div class="form-group flex-1">
              <label>Nama Pengemudi / Driver *</label>
              <input 
                v-model="claimForm.driver" 
                type="text" 
                placeholder="Driver yang bertugas" 
                required 
                class="form-control"
              />
            </div>
          </div>

          <div class="form-group">
            <label>SPBU / POM Lokasi Pengisian *</label>
            <select v-model="claimForm.station" required class="form-control">
              <option value="">-- Pilih SPBU --</option>
              <option v-for="pom in vtacsStore.pomList" :key="pom.kode" :value="pom.kode">
                {{ pom.kode }} - {{ pom.nama }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Realisasi Volume (Liter) *</label>
              <input 
                v-model.number="claimForm.literDiisi" 
                type="number" 
                step="0.01" 
                min="1" 
                placeholder="Liter terisi" 
                required 
                class="form-control"
                @input="autoCalculateNominal"
              />
            </div>
            <div class="form-group flex-1">
              <label>Total Rupiah (Struk SPBU) *</label>
              <input 
                v-model.number="claimForm.nominal" 
                type="number" 
                placeholder="Total rupiah pada nota" 
                required 
                class="form-control"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Jenis Bahan Bakar *</label>
              <select v-model="claimForm.jenisBbm" class="form-control">
                <option value="Dexlite">Dexlite (Solar Non-Subsidi)</option>
                <option value="Bio Solar">Bio Solar B35</option>
                <option value="Pertamina Dex">Pertamina Dex</option>
                <option value="Pertalite">Pertalite</option>
                <option value="Pertamax">Pertamax</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>Kilometer Odometer (KM)</label>
              <input 
                v-model.number="claimForm.kmOdometer" 
                type="number" 
                placeholder="KM saat pengisian" 
                class="form-control"
              />
            </div>
          </div>

          <!-- Upload / Foto Struk SPBU (VTC-006) -->
          <div class="form-group">
            <label>Lampiran / Foto Struk Pembelian BBM *</label>
            <div class="photo-upload-area">
              <input 
                type="file" 
                id="struk-photo-input" 
                accept="image/*" 
                capture="environment"
                class="file-input-hidden" 
                @change="handlePhotoUpload"
              />
              <div v-if="!claimForm.photoUrl" class="upload-placeholder" @click="triggerPhotoInput">
                <span class="upload-icon">📷</span>
                <span>Klik untuk Ambil Foto Struk / Upload Gambar</span>
                <span class="text-xs text-muted">Format: JPG, PNG (Maks 2MB)</span>
              </div>
              <div v-else class="photo-preview-container">
                <img :src="claimForm.photoUrl" alt="Struk BBM" class="photo-preview" />
                <div class="photo-preview-meta">
                  <span class="text-xs text-success">✓ Foto struk siap dilampirkan</span>
                  <button type="button" class="btn btn-xs btn-outline-danger" @click="removePhoto">
                    Hapus / Ganti Foto
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Catatan Tambahan (Opsional)</label>
            <input 
              v-model="claimForm.catatan" 
              type="text" 
              placeholder="Contoh: Pengisian full tank sebelum perjalanan jauh" 
              class="form-control"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="resetClaimForm">
              Reset Form
            </button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="vtacsStore.loading || (voucherValidation && voucherValidation.type === 'error')"
            >
              {{ vtacsStore.loading ? 'Memproses Klaim...' : '⛽ Klaim & Cairkan BBM' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== TAB 4: DASBOR REKONSILIASI GA (VTC-007) ==================== -->
    <div v-if="activeTab === 'ga_reconcile'" class="tab-content">
      <!-- GA KPI Metrics -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Total Realisasi Volume</span>
          <span class="stat-value text-primary">{{ vtacsStore.reconcileData.summary.totalLiters }} L</span>
          <span class="stat-sub">Volume konsumsi BBM</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Pengeluaran BBM</span>
          <span class="stat-value text-danger">Rp {{ formatNumber(vtacsStore.reconcileData.summary.totalNominal) }}</span>
          <span class="stat-sub">Total biaya pengisian</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Klaim Voucher</span>
          <span class="stat-value">{{ vtacsStore.reconcileData.summary.totalTransaksi }} Transaksi</span>
          <span class="stat-sub">Klaim selesai di SPBU</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Sisa Deposit SPBU</span>
          <span class="stat-value text-success">Rp {{ formatNumber(totalDepositRemaining) }}</span>
          <span class="stat-sub">Saldo aktif di seluruh SPBU</span>
        </div>
      </div>

      <!-- Sisa Saldo POM per Titik (VTC-007) -->
      <div class="card table-container mb-4">
        <div class="table-header">
          <h3>Sisa Saldo Deposit per SPBU / Titik POM</h3>
          <span class="badge">{{ vtacsStore.reconcileData.pomBalances.length }} Titik Rekanan</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Kode SPBU</th>
              <th>Nama SPBU</th>
              <th>Saldo Deposit Awal</th>
              <th>Total Terpakai</th>
              <th>Sisa Saldo Tersedia</th>
              <th>Status Deposit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pom in vtacsStore.reconcileData.pomBalances" :key="pom.kode">
              <td class="font-mono font-bold">{{ pom.kode }}</td>
              <td>{{ pom.nama }}</td>
              <td>Rp {{ formatNumber(pom.saldo) }}</td>
              <td class="text-danger">Rp {{ formatNumber(pom.terpakai) }}</td>
              <td class="font-bold text-success">Rp {{ formatNumber(pom.sisa) }}</td>
              <td>
                <span class="status-pill" :class="pom.sisa < 5000000 ? 'status-expired' : 'status-active'">
                  {{ pom.sisa < 5000000 ? '⚠️ Perlu Top Up' : '✅ Saldo Aman' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pemakaian BBM per Unit Kendaraan (VTC-007) -->
      <div class="card table-container">
        <div class="table-header">
          <h3>Rekapitulasi Konsumsi BBM per Unit Kendaraan</h3>
          <button class="btn btn-xs btn-outline-secondary" @click="exportGAReport">
            📥 Export CSV Rekonsiliasi
          </button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>ID Transaksi</th>
              <th>Kode Voucher</th>
              <th>SPBU</th>
              <th>Nopol Kendaraan</th>
              <th>Driver</th>
              <th>Realisasi Liter</th>
              <th>Total Rupiah</th>
              <th>Waktu Transaksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="vtacsStore.reconcileData.transactions.length === 0">
              <td colspan="8" class="text-center py-4 text-muted">Belum ada transaksi rekonsiliasi.</td>
            </tr>
            <tr v-for="tx in vtacsStore.reconcileData.transactions" :key="tx.txId">
              <td class="font-mono text-xs">{{ tx.txId }}</td>
              <td class="font-mono font-bold">{{ tx.voucher }}</td>
              <td>{{ tx.kodePom }}</td>
              <td><strong>{{ tx.nopol }}</strong></td>
              <td>{{ tx.driver }}</td>
              <td>{{ tx.liter }} L</td>
              <td class="font-bold">Rp {{ formatNumber(tx.nominal) }}</td>
              <td>{{ formatDate(tx.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== TAB 5: PORTAL VENDOR POM (VTC-008) ==================== -->
    <div v-if="activeTab === 'vendor_pom'" class="tab-content">
      <div class="card mb-4">
        <div class="card-header flex-between">
          <div>
            <h3>🏪 Portal Vendor SPBU & Tagihan Bulanan</h3>
            <p class="subtitle">Akses data tagihan transparan khusus vendor SPBU rekanan PT VAMOS FMS.</p>
          </div>
          <div class="vendor-selector-group">
            <label class="text-xs font-bold text-muted mr-2">Pilih SPBU Vendor:</label>
            <select v-model="selectedVendorPom" class="form-control form-control-sm inline-select">
              <option v-for="pom in vtacsStore.pomList" :key="pom.kode" :value="pom.kode">
                {{ pom.kode }} - {{ pom.nama }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Vendor Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Total Tagihan ke VAMOS FMS</span>
          <span class="stat-value text-primary">Rp {{ formatNumber(vendorMetrics.totalNominal) }}</span>
          <span class="stat-sub">Siap ditagihkan / invoice</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total BBM Tersalurkan</span>
          <span class="stat-value">{{ vendorMetrics.totalLiters }} Liter</span>
          <span class="stat-sub">Volume akumulasi</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Jumlah Transaksi Terverifikasi</span>
          <span class="stat-value text-success">{{ vendorMetrics.totalTransaksi }} Lembar</span>
          <span class="stat-sub">Struk / voucher valid</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Status Verifikasi Vendor</span>
          <span class="stat-value text-info">TERVERIFIKASI</span>
          <span class="stat-sub">Audit lock lolos</span>
        </div>
      </div>

      <!-- Vendor Invoicing Table -->
      <div class="card table-container">
        <div class="table-header">
          <div>
            <h3>Rincian Tagihan SPBU ({{ selectedVendorPom }})</h3>
            <span class="text-xs text-muted">Data transaksi yang disahkan untuk penagihan invoice resmi.</span>
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-primary" @click="exportVendorInvoice">
              📑 Export Invoice Tagihan (CSV)
            </button>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Waktu Transaksi</th>
              <th>ID Transaksi</th>
              <th>Kode Voucher</th>
              <th>Nopol Kendaraan</th>
              <th>Driver</th>
              <th>Volume (Liter)</th>
              <th>Total Tagihan (Rp)</th>
              <th>Status Verifikasi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="vendorTransactions.length === 0">
              <td colspan="9" class="text-center py-4 text-muted">
                Tidak ada transaksi pengisian BBM di SPBU ini pada periode aktif.
              </td>
            </tr>
            <tr v-for="(tx, idx) in vendorTransactions" :key="tx.txId">
              <td>{{ idx + 1 }}</td>
              <td>{{ formatDate(tx.timestamp) }}</td>
              <td class="font-mono text-xs">{{ tx.txId }}</td>
              <td class="font-mono font-bold">{{ tx.voucher }}</td>
              <td><strong>{{ tx.nopol }}</strong></td>
              <td>{{ tx.driver }}</td>
              <td>{{ tx.liter }} L</td>
              <td class="font-bold">Rp {{ formatNumber(tx.nominal) }}</td>
              <td>
                <span class="status-pill status-active">✓ Disetujui</span>
              </td>
            </tr>
          </tbody>
          <tfoot v-if="vendorTransactions.length > 0">
            <tr class="table-summary-row">
              <td colspan="6" class="text-right font-bold">TOTAL TAGIHAN:</td>
              <td class="font-bold">{{ vendorMetrics.totalLiters }} L</td>
              <td class="font-bold text-primary">Rp {{ formatNumber(vendorMetrics.totalNominal) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useVTACSStore } from '../stores/vtacsStore.js';

const vtacsStore = useVTACSStore();

// State
const activeTab = ref('ledger');
const isOnline = ref(navigator.onLine);
const searchQuery = ref('');
const statusFilter = ref('ALL');
const alertMessage = ref('');
const alertType = ref('success');
const newlyIssuedVoucher = ref(null);

// Form Requests (VTC-005)
const requestForm = ref({
  nopol: '',
  driver: '',
  pom: 'ALL_STATIONS',
  kuotaLiter: 50,
  keperluan: ''
});

// Form Claim / Reporting (VTC-006)
const claimForm = ref({
  code: '',
  nopol: '',
  driver: '',
  station: '',
  literDiisi: 50,
  nominal: 625000,
  jenisBbm: 'Dexlite',
  kmOdometer: null,
  photoUrl: '',
  catatan: ''
});

// Debounce state for voucher code verification (VTC-006)
let debounceTimeout = null;
const isCheckingVoucher = ref(false);
const voucherValidation = ref(null);

// Vendor Portal (VTC-008)
const selectedVendorPom = ref('POM-01');

// Online/Offline tracking
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

onMounted(async () => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  await vtacsStore.fetchMasterData();
  await vtacsStore.loadOfflineQueue();
  await vtacsStore.fetchReconcile();

  if (vtacsStore.pomList.length > 0) {
    selectedVendorPom.value = vtacsStore.pomList[0].kode;
  }
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});

// Tab Switcher
const switchTab = async (tab) => {
  activeTab.value = tab;
  if (tab === 'ga_reconcile' || tab === 'vendor_pom') {
    await vtacsStore.fetchReconcile();
  }
};

// Refresh master data
const refreshData = async () => {
  await vtacsStore.fetchMasterData();
  await vtacsStore.fetchReconcile();
  await vtacsStore.loadOfflineQueue();
  showAlert('Data VTACS berhasil disegarkan.', 'success');
};

// Sync handler
const handleSync = async () => {
  try {
    await vtacsStore.syncOfflineQueue();
    showAlert('Sinkronisasi transaksi offline BBM selesai.', 'success');
  } catch (err) {
    showAlert(`Gagal sinkronisasi: ${err.message}`, 'error');
  }
};

// Alerts
const showAlert = (msg, type = 'success') => {
  alertMessage.value = msg;
  alertType.value = type;
  setTimeout(() => {
    if (alertMessage.value === msg) alertMessage.value = '';
  }, 6000);
};

// Ledger Computations
const activeVouchersCount = computed(() => {
  return vtacsStore.vouchers.filter(v => (v.status || '').toUpperCase() === 'AVAILABLE').length;
});

const totalFuelLiters = computed(() => {
  return vtacsStore.vouchers.reduce((acc, v) => acc + (Number(v.fuelQuota) || 0), 0);
});

const filteredVouchers = computed(() => {
  return vtacsStore.vouchers.filter(v => {
    const matchSearch = !searchQuery.value || 
      (v.code && v.code.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (v.nopol && v.nopol.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchStatus = statusFilter.value === 'ALL' || (v.status || '').toUpperCase() === statusFilter.value;
    return matchSearch && matchStatus;
  });
});

const getPomName = (pomKode) => {
  if (!pomKode || pomKode === 'ALL_STATIONS') return 'Semua SPBU Jaringan';
  const found = vtacsStore.pomList.find(p => p.kode === pomKode);
  return found ? found.nama : pomKode;
};

// ==================== TAB 2: REQUEST VOUCHER ACTIONS ====================
const submitRequestVoucher = async () => {
  try {
    const payload = {
      nopol: requestForm.value.nopol.toUpperCase(),
      driver: requestForm.value.driver,
      pom: requestForm.value.pom,
      kuotaLiter: requestForm.value.kuotaLiter,
      keperluan: requestForm.value.keperluan
    };

    const res = await vtacsStore.requestVoucher(payload);
    newlyIssuedVoucher.value = res.data;
    showAlert(`Voucher virtual ${res.data.code} berhasil diterbitkan!`, 'success');
  } catch (err) {
    showAlert(`Gagal menerbitkan voucher: ${err.message}`, 'error');
  }
};

const resetRequestForm = () => {
  requestForm.value = {
    nopol: '',
    driver: '',
    pom: 'ALL_STATIONS',
    kuotaLiter: 50,
    keperluan: ''
  };
  newlyIssuedVoucher.value = null;
};

const copyVoucherCode = (code) => {
  navigator.clipboard.writeText(code);
  showAlert(`Kode voucher ${code} disalin ke clipboard!`, 'info');
};

const initClaimFromVoucher = (voucher) => {
  claimForm.value.code = voucher.code;
  claimForm.value.nopol = voucher.nopol || '';
  claimForm.value.literDiisi = voucher.fuelQuota || 50;
  claimForm.value.nominal = voucher.nominal || (voucher.fuelQuota * 12500);
  if (voucher.pom && voucher.pom !== 'ALL_STATIONS') {
    claimForm.value.station = voucher.pom;
  }
  activeTab.value = 'claim';
  validateVoucherCode(voucher.code);
};

// ==================== TAB 3: CLAIM / DEBOUNCE ACTIONS ====================
const handleVoucherCodeInput = () => {
  clearTimeout(debounceTimeout);
  isCheckingVoucher.value = true;
  voucherValidation.value = null;

  debounceTimeout = setTimeout(() => {
    validateVoucherCode(claimForm.value.code);
    isCheckingVoucher.value = false;
  }, 400);
};

const validateVoucherCode = (code) => {
  if (!code || code.trim() === '') {
    voucherValidation.value = null;
    return;
  }

  const cleanCode = code.trim().toUpperCase();
  const matched = vtacsStore.vouchers.find(v => v.code && v.code.toUpperCase() === cleanCode);

  if (!matched) {
    // Check if offline queue has this code
    const inQueue = vtacsStore.offlineQueue.some(t => t.payload && (t.payload.code === cleanCode || t.payload.voucherCode === cleanCode));
    if (inQueue) {
      voucherValidation.value = {
        type: 'error',
        message: 'Voucher sedang dalam antrean klaim offline lokal di perangkat ini.'
      };
      return;
    }

    voucherValidation.value = {
      type: 'warning',
      message: 'Kode voucher belum ada di memori lokal. Jika baru diterbitkan, verifikasi akan dilakukan ke server saat pengajuan.'
    };
    return;
  }

  if (matched.status === 'REDEEMED') {
    voucherValidation.value = {
      type: 'error',
      message: `Double-spending blocked: Voucher ${matched.code} telah dicairkan sebelumnya!`,
      details: matched
    };
    return;
  }

  // Valid voucher
  voucherValidation.value = {
    type: 'success',
    message: `Voucher Valid: ${matched.nopol} (Alokasi: ${matched.fuelQuota} L)`,
    details: matched
  };

  // Auto fill
  claimForm.value.nopol = matched.nopol || claimForm.value.nopol;
  claimForm.value.literDiisi = matched.fuelQuota || claimForm.value.literDiisi;
  claimForm.value.nominal = matched.nominal || (matched.fuelQuota * 12500);
  if (matched.pom && matched.pom !== 'ALL_STATIONS') {
    claimForm.value.station = matched.pom;
  }
};

const autoCalculateNominal = () => {
  const liter = Number(claimForm.value.literDiisi) || 0;
  const rate = claimForm.value.jenisBbm.includes('Solar') ? 6800 : 12500;
  claimForm.value.nominal = Math.round(liter * rate);
};

// Photo Upload Handling
const triggerPhotoInput = () => {
  const el = document.getElementById('struk-photo-input');
  if (el) el.click();
};

const handlePhotoUpload = (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 3 * 1024 * 1024) {
    showAlert('Ukuran file foto struk melebihi 3MB.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    claimForm.value.photoUrl = e.target.result;
  };
  reader.readAsDataURL(file);
};

const removePhoto = () => {
  claimForm.value.photoUrl = '';
  const el = document.getElementById('struk-photo-input');
  if (el) el.value = '';
};

const submitClaimForm = async () => {
  if (voucherValidation.value && voucherValidation.value.type === 'error') {
    showAlert('Voucher tidak valid atau sudah digunakan (Double-spending prevented).', 'error');
    return;
  }

  try {
    const payload = {
      code: claimForm.value.code.trim().toUpperCase(),
      nopol: claimForm.value.nopol,
      driver: claimForm.value.driver,
      station: claimForm.value.station,
      literDiisi: claimForm.value.literDiisi,
      nominal: claimForm.value.nominal,
      jenisBbm: claimForm.value.jenisBbm,
      kmOdometer: claimForm.value.kmOdometer,
      photoAttached: Boolean(claimForm.value.photoUrl),
      catatan: claimForm.value.catatan,
      timestamp: new Date().toISOString()
    };

    const res = await vtacsStore.redeemVoucher(payload);

    if (res.status === 'offline_queued' || res.code === 202) {
      showAlert('Mode Offline: Transaksi redeem dicatat dalam antrean lokal IndexedDB dan akan disinkronkan saat online.', 'warning');
    } else {
      showAlert(`Klaim voucher ${payload.code} berhasil diproses di ${payload.station}!`, 'success');
    }

    resetClaimForm();
  } catch (err) {
    showAlert(`Gagal klaim voucher: ${err.message}`, 'error');
  }
};

const resetClaimForm = () => {
  claimForm.value = {
    code: '',
    nopol: '',
    driver: '',
    station: '',
    literDiisi: 50,
    nominal: 625000,
    jenisBbm: 'Dexlite',
    kmOdometer: null,
    photoUrl: '',
    catatan: ''
  };
  voucherValidation.value = null;
  removePhoto();
};

// ==================== TAB 4: GA RECONCILE COMPUTATIONS ====================
const totalDepositRemaining = computed(() => {
  return vtacsStore.reconcileData.pomBalances.reduce((acc, p) => acc + (Number(p.sisa) || 0), 0);
});

const exportGAReport = () => {
  const transactions = vtacsStore.reconcileData.transactions || [];
  if (transactions.length === 0) {
    showAlert('Tidak ada data transaksi rekonsiliasi untuk diekspor.', 'warning');
    return;
  }

  const headers = ['ID Transaksi', 'Voucher', 'Kode SPBU', 'Nopol', 'Driver', 'Liter', 'Nominal (Rp)', 'Waktu'];
  const rows = transactions.map(t => [
    t.txId,
    t.voucher,
    t.kodePom,
    t.nopol,
    t.driver,
    t.liter,
    t.nominal,
    t.timestamp
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `VTACS_GA_Rekonsiliasi_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==================== TAB 5: VENDOR POM COMPUTATIONS ====================
const vendorTransactions = computed(() => {
  const all = vtacsStore.reconcileData.transactions || [];
  return all.filter(t => t.kodePom === selectedVendorPom.value);
});

const vendorMetrics = computed(() => {
  const txs = vendorTransactions.value;
  const totalLiters = txs.reduce((acc, t) => acc + (Number(t.liter) || 0), 0);
  const totalNominal = txs.reduce((acc, t) => acc + (Number(t.nominal) || 0), 0);
  return {
    totalLiters,
    totalNominal,
    totalTransaksi: txs.length
  };
});

const exportVendorInvoice = () => {
  const txs = vendorTransactions.value;
  if (txs.length === 0) {
    showAlert(`Belum ada data transaksi untuk SPBU ${selectedVendorPom.value}.`, 'warning');
    return;
  }

  const headers = ['No', 'ID Transaksi', 'Waktu', 'Kode Voucher', 'Nopol Kendaraan', 'Driver', 'Liter BBM', 'Total Tagihan (Rp)'];
  const rows = txs.map((t, idx) => [
    idx + 1,
    t.txId,
    t.timestamp,
    t.voucher,
    t.nopol,
    t.driver,
    t.liter,
    t.nominal
  ]);

  rows.push(['', '', '', '', 'TOTAL', '', vendorMetrics.value.totalLiters, vendorMetrics.value.totalNominal]);

  const csvContent = [
    `FAKTUR INVOICE TAGIHAN VENDOR BBM`,
    `SPBU: ${selectedVendorPom.value}`,
    `Tanggal Cetak: ${new Date().toISOString()}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Invoice_VTACS_${selectedVendorPom.value}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Utilities
const formatNumber = (num) => {
  return Number(num || 0).toLocaleString('id-ID');
};

const formatDate = (isoStr) => {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return isoStr;
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

.header-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.bg-success {
  background: #dcfce7;
  color: #15803d;
}

.bg-warning {
  background: #fef3c7;
  color: #b45309;
}

/* Offline Banner */
.offline-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #fef3c7;
  color: #92400e;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  border: 1px solid #fde68a;
  font-size: 0.875rem;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
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

.alert-success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-warning {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
}

.alert-info {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

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

.tab-btn:hover {
  color: #2563eb;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.table-summary-row td {
  background: #f8fafc;
  border-top: 2px solid #cbd5e1;
  padding: 1rem 1.25rem;
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

.flex-1 {
  flex: 1;
}

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
  .two-col-grid {
    grid-template-columns: 1fr;
  }
}

.max-w-700 {
  max-width: 700px;
}

.mx-auto {
  margin-left: auto;
  margin-right: auto;
}

/* Debounce Input & Validation Feedback */
.input-with-status {
  position: relative;
}

.status-spinner {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #64748b;
}

.validation-feedback {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
}

.feedback-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.feedback-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.feedback-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

/* Photo Upload */
.photo-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
}

.photo-upload-area:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.file-input-hidden {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  color: #475569;
  font-size: 0.875rem;
}

.upload-icon {
  font-size: 1.75rem;
}

.photo-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.photo-preview {
  max-width: 240px;
  max-height: 160px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
}

.photo-preview-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Voucher Slip */
.voucher-slip {
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

.slip-header .brand {
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #38bdf8;
}

.slip-header .type {
  font-size: 0.75rem;
  opacity: 0.7;
}

.slip-code {
  text-align: center;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
}

.code-label {
  display: block;
  font-size: 0.7rem;
  color: #94a3b8;
  letter-spacing: 0.1em;
}

.code-value {
  font-family: monospace;
  font-size: 1.4rem;
  font-weight: 700;
  color: #38bdf8;
}

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

.slip-barcode {
  text-align: center;
  letter-spacing: 0.3em;
  font-size: 1rem;
  opacity: 0.4;
  margin-bottom: 1.25rem;
}

.slip-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.voucher-empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

/* Status Pills & Badges */
.status-pill {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-available {
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

.status-active {
  background: #dcfce7;
  color: #15803d;
}

.badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-success {
  background: #dcfce7;
  color: #15803d;
}

.badge-neutral {
  background: #f1f5f9;
  color: #64748b;
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

.btn-outline-primary {
  background: transparent;
  border-color: #2563eb;
  color: #2563eb;
}

.btn-outline-primary:hover {
  background: #eff6ff;
}

.btn-outline-secondary {
  background: transparent;
  border-color: #cbd5e1;
  color: #475569;
}

.btn-outline-secondary:hover {
  background: #f8fafc;
}

.btn-outline-warning {
  background: transparent;
  border-color: #f59e0b;
  color: #d97706;
}

.btn-outline-warning:hover {
  background: #fffbeb;
}

.btn-outline-danger {
  background: transparent;
  border-color: #ef4444;
  color: #ef4444;
}

.btn-outline-danger:hover {
  background: #fef2f2;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-xs {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
}

/* Helpers */
.font-mono {
  font-family: monospace;
}

.font-bold {
  font-weight: 700;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-muted {
  color: #94a3b8;
}

.text-xs {
  font-size: 0.75rem;
}

.text-primary {
  color: #2563eb;
}

.text-success {
  color: #15803d;
}

.text-danger {
  color: #b91c1c;
}

.text-info {
  color: #0284c7;
}

.bg-light {
  background-color: #f8fafc;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.mt-1 {
  margin-top: 0.25rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.ml-auto {
  margin-left: auto;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.inline-select {
  display: inline-block;
  width: auto;
}
</style>
