<template>
  <n-layout-header v-if="!isSessionView" position="absolute">
    <n-menu
      :value="activeKey"
      :options="menuOptions"
      mode="horizontal"
      responsive
    />
  </n-layout-header>

  <view-home v-if="isHomeView" />
  <view-host v-else-if="isHostView" />
  <view-peer v-else-if="isPeerView" />
  <view-session v-else-if="isSessionView" />
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import ViewHome from './ViewHome.vue';
import ViewHost from './ViewHost.vue';
import ViewSession from './ViewSession.vue';
import ViewPeer from './ViewPeer.vue';
import { usePeerStore } from '../stores/peer';
import { NLayoutHeader, NMenu } from 'naive-ui';

const peer = usePeerStore();

const activeKey = ref(null);
const isHomeView = computed(() => !peer.hostId && !peer.query.peerId);
const isHostView = computed(() => peer.hostId && !peer.isConnected);
const isPeerView = computed(() => peer.query.peerId && !peer.isConnected);
const isSessionView = computed(() => peer.isConnected);

const menuOptions = [
  {
    key: 'home',
    label: 'Home',
    onClick: () => showHomeView(),
  },
];

const showHomeView = () => {
  peer.query.peerId = undefined;
  peer.query.hostId = undefined;

  nextTick(() => {
    peer.close();
  });
};

watch(
  () => peer.query,
  (val) => {
    activeKey.value = val.hostId || val.peerId ? null : 'home';
  },
  { deep: true, immediate: true },
);
</script>
