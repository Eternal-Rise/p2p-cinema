<template>
  <n-flex align="center" justify="center" class="h-100">
    <form-create-peer :loading="peer.isOpening" @submit="createPeer" />
  </n-flex>
</template>

<script setup>
import { nextTick, onMounted } from 'vue';
import { useUrlSearchParams } from '@vueuse/core';
import { NFlex } from 'naive-ui';
import FormCreatePeer from '../components/FormCreatePeer.vue';
import { usePeerStore } from '../stores/peer';

const peer = usePeerStore();
const query = useUrlSearchParams('history');

const createPeer = () => {
  peer.openPeer().then((peerId) => {
    query.hostId = peerId;

    // wait for query update
    nextTick(() => {
      peer.hostId = peerId;
    });
  });
};

onMounted(() => {
  peer.hostId = query.hostId;
});
</script>
