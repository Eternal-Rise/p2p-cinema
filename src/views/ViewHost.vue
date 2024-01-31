<template>
  <n-flex align="center" justify="center" class="h-100">
    <n-text type="info">Link to share</n-text>
    <n-tag type="success">
      {{ linkToShare }}
    </n-tag>
    <n-button @click="copyLink"> Click to copy </n-button>
  </n-flex>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { NButton, NFlex, NTag, NText, useMessage } from 'naive-ui';
import { useClipboard, useUrlSearchParams } from '@vueuse/core';
import { usePeerStore } from '../stores/peer';

const peer = usePeerStore();
const query = useUrlSearchParams('history');
const message = useMessage();
const { copy } = useClipboard();

const copyLink = () => {
  copy(linkToShare.value);
  message.success('Copied to clipboard');
};

const linkToShare = computed(() => {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?peerId=${peer.peerId}`;
});

onMounted(() => {
  peer.hostId = query.hostId;
  peer.peerId = query.hostId;
  peer.openPeer().catch(() => {});
});
</script>
