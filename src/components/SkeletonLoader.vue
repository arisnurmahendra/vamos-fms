<template>
  <div class="skeleton-wrapper" :class="[type, { 'animate-shimmer': animated }]">
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-line title"></div>
      <div class="skeleton-line subtitle"></div>
      <div class="skeleton-line body"></div>
    </div>
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div v-for="i in count" :key="i" class="skeleton-row">
        <div class="skeleton-cell" style="width: 20%;"></div>
        <div class="skeleton-cell" style="width: 40%;"></div>
        <div class="skeleton-cell" style="width: 25%;"></div>
        <div class="skeleton-cell" style="width: 15%;"></div>
      </div>
    </div>
    <div v-else class="skeleton-line" :style="{ width: customWidth, height: customHeight }"></div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'line' // 'line' | 'card' | 'table' | 'circle'
  },
  count: {
    type: Number,
    default: 3
  },
  animated: {
    type: Boolean,
    default: true
  },
  customWidth: {
    type: String,
    default: '100%'
  },
  customHeight: {
    type: String,
    default: '1rem'
  }
})
</script>

<style scoped>
.skeleton-wrapper {
  display: block;
  width: 100%;
}

.skeleton-line {
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-line.title {
  height: 1.5rem;
  width: 50%;
  margin-bottom: 0.75rem;
}

.skeleton-line.subtitle {
  height: 1rem;
  width: 30%;
  margin-bottom: 1rem;
}

.skeleton-line.body {
  height: 3rem;
  width: 100%;
}

.skeleton-card {
  padding: 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.skeleton-table {
  width: 100%;
}

.skeleton-row {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.skeleton-cell {
  height: 1rem;
  background: #e2e8f0;
  border-radius: 4px;
}

.animate-shimmer .skeleton-line,
.animate-shimmer .skeleton-cell {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
