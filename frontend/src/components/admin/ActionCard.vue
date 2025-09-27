<template>
  <div :class="['action-card', `action-card-${color}`]" @click="$emit('click')">
    <div class="action-icon">
      <Icon :name="icon" />
    </div>
    <div class="action-content">
      <h3 class="action-title">{{ title }}</h3>
      <p class="action-description">{{ description }}</p>
    </div>
    <div class="action-arrow">
      <Icon name="arrow-right" />
    </div>
  </div>
</template>

<script setup>
import Icon from '../common/Icon.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'blue'
  }
})

defineEmits(['click'])
</script>

<style scoped>
.action-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 50px;
  height: 50px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.action-card-blue .action-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.action-card-green .action-icon {
  background: linear-gradient(135deg, #10b981, #047857);
}

.action-card-purple .action-icon {
  background: linear-gradient(135deg, #8b5cf6, #5b21b6);
}

.action-card-orange .action-icon {
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.action-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.action-arrow {
  color: #9ca3af;
  font-size: 1rem;
}
</style>