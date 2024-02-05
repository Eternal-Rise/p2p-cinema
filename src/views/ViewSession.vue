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
        <n-button size="large" @click="peer.shareMyScreen">
          Share screen
        </n-button>
        <n-button size="large" type="error" @click="peer.closePeer">
          <n-icon>
            <CallEnd16Filled />
          </n-icon>
        </n-button>
      </n-flex>
    </div>
  </div>
</template>

<script setup>
import { NButton, NFlex, NIcon } from 'naive-ui';
import {
  CallEnd16Filled,
  Mic16Filled,
  MicOff16Filled,
  VideoPerson16Filled,
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
