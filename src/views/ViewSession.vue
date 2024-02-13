<template>
  <div
    v-if="peer.isConnected"
    ref="root"
    class="view-session"
    :class="{ 'show-controls': controlsVisibility }"
    @mousemove="showControls"
  >
    <div class="view-session__media">
      <peer-video
        class="view-session__media-item"
        :class="{ '_primary': isPrimaryView('user') }"
        :stream="peer.remoteUserStream"
        @fullscreen="toggleFullScreen(), setPrimaryView('user')"
      >
        <template #preview>
          <n-flex align="center" justify="center" class="h-100">
            <n-icon :size="100"> <VideoPerson16Filled /> </n-icon>
          </n-flex>
        </template>
      </peer-video>
      <peer-video
        v-if="peer.remoteScreenStream"
        class="view-session__media-item"
        :class="{ '_primary': isPrimaryView('screen') }"
        :stream="peer.remoteScreenStream"
        @fullscreen="toggleFullScreen(), setPrimaryView('screen')"
      />
    </div>
    <peer-session-controls
      ref="sessionControls"
      class="view-session__controls"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useCssVar, useMediaQuery } from '@vueuse/core';
import { NFlex, NIcon } from 'naive-ui';
import { VideoPerson16Filled } from '@vicons/fluent';
import PeerVideo from '../components/peer/PeerVideo.vue';
import PeerSessionControls from '../components/peer/PeerSessionControls.vue';
import { usePeerStore } from '../stores/peer';

const peer = usePeerStore();
const isFullscreen = useMediaQuery('(display-mode: fullscreen)');
const root = ref(null);
const sessionControls = ref(null);
const controlsVisibility = ref(true);
const controlsVisibilityTimeout = ref();
const primaryView = ref();

const toggleFullScreen = () =>
  document.fullscreenElement
    ? document.exitFullscreen()
    : root.value.requestFullscreen();

const showControls = () => {
  controlsVisibility.value = true;
  clearTimeout(controlsVisibilityTimeout.value);
  controlsVisibilityTimeout.value = setTimeout(() => {
    controlsVisibility.value = false;
  }, 3000);
};

const isPrimaryView = (key) => primaryView.value === key;
const setPrimaryView = (key) => (primaryView.value = key);
const getSessionControlsHeight = () => {
  nextTick(() => {
    const height = sessionControls.value?.$el.clientHeight ?? 80;
    sessionControlsHeight.value = `${height}px`;
  });
};

const sessionControlsHeight = useCssVar('--session-controls-height', root);
onMounted(() => {
  showControls();
  getSessionControlsHeight();
});
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
  isolation: isolate;
}

.view-session__media-item {
  height: 100%;
  max-height: calc(100vh - var(--session-controls-height));
}

.view-session__controls {
  grid-column: 1 / -1;
  padding: 1rem;
}

@media (min-width: 768px) {
  .view-session__media {
    grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  }
}

@media (display-mode: fullscreen) {
  .view-session:not(.show-controls:has(.view-session__media-item._primary))
    .view-session__media-item:not(._primary) {
    display: none;
  }

  .view-session:not(.show-controls) .view-session__controls {
    display: none;
  }

  .view-session__controls {
    bottom: 0;
    left: 50%;
    position: absolute;
    transform: translateX(-50%);
    z-index: 3;
  }

  .view-session__media-item:not(._primary) {
    grid-column: 1 / 2;
    grid-row-start: 1;
    margin: 1rem 0 0 1rem;
    z-index: 2;
  }

  .view-session__media-item._primary {
    grid-column: 1 / -1;
    grid-row: 1 / -1;
    z-index: 1;
    max-height: 100vh;
  }
}

@media (min-width: 768px) and (display-mode: fullscreen) {
  .view-session__media:has(.view-session__media-item._primary) {
    grid-template-columns: minmax(200px, 20%) 1fr;
  }

  .view-session__media:has(.view-session__media-item._primary)
    .view-session__media-item:not(._primary) {
    max-height: 200px;
  }
}
</style>
