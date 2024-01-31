<template>
  <n-button size="large" @click="emit('submit')" :loading="loading">
    Create
  </n-button>
</template>

<script setup>
import { NButton } from 'naive-ui';

const props = defineProps({
  loading: { type: Boolean },
});
const emit = defineEmits(['submit']);
</script>
