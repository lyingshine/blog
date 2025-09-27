<template>
  <div :class="['stat-card', `stat-card-${color}`]">
    <div class="stat-icon">
      <Icon :name="icon" />
    </div>
    <div class="stat-content">
      <h3 class="stat-title">{{ title }}</h3>
      <p class="stat-value">{{ formattedValue }}</p>
      <div v-if="trend" class="stat-trend">
        <Icon :name="trend.type === 'up' ? 'trending-up' : 'trending-down'" />
        <span>{{ trend.value }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '../common/Icon.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'blue'
  },
  trend: {
    type: Object,
    default: null
  }
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})
</script>

<style scoped>
.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-card-blue .stat-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.stat-card-green .stat-icon {
  background: linear-gradient(135deg, #10b981, #047857);
}

.stat-card-purple .stat-icon {
  background: linear-gradient(135deg, #8b5cf6, #5b21b6);
}

.stat-card-yellow .stat-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-card-indigo .stat-icon {
  background: linear-gradient(135deg, #6366f1, #4338ca);
}

.stat-card-pink .stat-icon {
  background: linear-gradient(135deg, #ec4899, #be185d);
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #10b981;
  font-weight: 500;
}
</style>