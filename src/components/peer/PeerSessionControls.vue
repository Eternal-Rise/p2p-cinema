<template>
  <div class="peer-session-controls">
    <n-flex justify="center">
      <n-button
        :type="peer.isMicrophoneEnabled ? 'default' : 'error'"
        size="large"
        @click="peer.toggleMicrophone"
      >
        <n-icon :size="24">
          <Mic16Filled v-if="peer.isMicrophoneEnabled" />
          <MicOff16Filled v-else />
        </n-icon>
      </n-button>
      <template v-if="peer.isScreenShareSupported">
        <n-tooltip v-if="peer.isScreenEnabled" trigger="hover">
          <template #trigger>
            <n-button type="warning" size="large" @click="peer.toggleScreen">
              <n-icon :size="24">
                <ShareScreenStop24Regular />
              </n-icon>
            </n-button>
          </template>

          Stop screen sharing
        </n-tooltip>
        <n-tooltip v-else trigger="hover">
          <template #trigger>
            <n-button size="large" @click="peer.toggleScreen">
              <n-icon :size="24">
                <ShareScreenStart24Regular />
              </n-icon>
            </n-button>
          </template>

          Share screen
        </n-tooltip>
      </template>

      <select-screen-share-resolution />

      <n-button size="large" type="error" @click="peer.close">
        <n-icon :size="24">
          <CallEnd16Filled />
        </n-icon>
      </n-button>
    </n-flex>
  </div>
</template>

<script setup>
import { NButton, NFlex, NIcon, NTooltip } from 'naive-ui';
import {
  CallEnd16Filled,
  Mic16Filled,
  MicOff16Filled,
  ShareScreenStart24Regular,
  ShareScreenStop24Regular,
} from '@vicons/fluent';
import SelectScreenShareResolution from './SelectScreenShareResolution.vue';
import { usePeerStore } from '../../stores/peer';

const peer = usePeerStore();
</script>

<style>
.peer-session-controls {
  padding: 1rem;
}
</style>
