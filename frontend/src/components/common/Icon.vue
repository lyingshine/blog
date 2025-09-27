<template>
  <i :class="iconClass" :style="iconStyle"></i>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: '1em'
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})

const iconClass = computed(() => {
  // 简单的图标映射，可以根据需要扩展
  const iconMap = {
    'refresh': 'fas fa-sync-alt',
    'plus': 'fas fa-plus',
    'users': 'fas fa-users',
    'settings': 'fas fa-cog',
    'database': 'fas fa-database',
    'document': 'fas fa-file-alt',
    'chat': 'fas fa-comments',
    'lightbulb': 'fas fa-lightbulb',
    'eye': 'fas fa-eye',
    'trending-up': 'fas fa-chart-line',
    'trash': 'fas fa-trash',
    'edit': 'fas fa-edit',
    'delete': 'fas fa-times',
    'check': 'fas fa-check',
    'arrow-right': 'fas fa-arrow-right',
    'arrow-left': 'fas fa-arrow-left'
  }
  
  return iconMap[props.name] || `fas fa-${props.name}`
})

const iconStyle = computed(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
  color: props.color
}))
</script>

<style scoped>
i {
  display: inline-block;
  line-height: 1;
}
</style>