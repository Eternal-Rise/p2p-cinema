<template>
  <view-home v-if="isHomeView" />
  <view-host v-else-if="isHostView" />
  <view-peer v-else-if="isPeerView" />
  <view-session v-else-if="isSessionView" />
</template>

<script setup>
import { computed } from 'vue';
import { useUrlSearchParams } from '@vueuse/core';
import ViewHome from './ViewHome.vue';
import ViewHost from './ViewHost.vue';
import ViewSession from './ViewSession.vue';
import ViewPeer from './ViewPeer.vue';
import { usePeerStore } from '../stores/peer';

const peer = usePeerStore();
const query = useUrlSearchParams();

const isHomeView = computed(() => !peer.hostId && !query.peerId);
const isHostView = computed(() => peer.hostId && !peer.isConnected);
const isPeerView = computed(() => query.peerId && !peer.isConnected);
const isSessionView = computed(() => peer.isConnected);
</script>
