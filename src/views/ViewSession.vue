<template>
  <div v-if="peer.isConnected" class="view-session">
    <div class="view-session__media">
      <app-video :stream="peer.userStream">
        <template #preview>
          <n-flex align="center" justify="center" class="h-100">
            <n-icon :size="100"> <VideoPerson16Filled /> </n-icon>
          </n-flex>
        </template>
      </app-video>
      <app-video v-if="peer.screenStream" :stream="peer.screenStream" />
    </div>

    <div class="view-session__controls">
      <n-flex justify="center">
        <n-button
          :type="peer.isMicrophoneEnabled ? 'default' : 'error'"
          size="large"
          @click="peer.toggleMicrophone"
        >
          <n-icon>
            <Mic16Filled v-if="peer.isMicrophoneEnabled" />
            <MicOff16Filled v-else />
          </n-icon>
        </n-button>
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

        <n-button size="large" type="error" @click="peer.close">
          <n-icon>
            <CallEnd16Filled />
          </n-icon>
        </n-button>
      </n-flex>
    </div>
  </div>
</template>

<script setup>
import { NButton, NFlex, NIcon, NTooltip } from 'naive-ui';
import {
  CallEnd16Filled,
  Mic16Filled,
  MicOff16Filled,
  VideoPerson16Filled,
  ShareScreenStart24Regular,
  ShareScreenStop24Regular,
} from '@vicons/fluent';
import AppVideo from '../components/AppVideo.vue';
import { usePeerStore } from '../stores/peer';

const peer = usePeerStore();
</script>

<style>
.view-session {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.view-session__media {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
}

.view-session__controls {
  grid-column: 1 / -1;
  padding: 1rem;
}
</style>
