<template>
  <div
    ref="root"
    class="app-video"
    :class="{ '_show-controls': controlsVisibility }"
    @mousemove="showControls"
  >
    <n-card class="h-100" content-style="padding: 0;">
      <slot v-if="!hasVideoTrack" name="preview" />
      <video v-show="hasVideoTrack" ref="video" />
      <div class="app-video__controls">
        <n-button quaternary circle @click="toggleVolume">
          <template #icon>
            <n-icon>
              <SpeakerMute16Filled v-if="volume === 0" />
              <Speaker116Filled v-else />
            </n-icon>
          </template>
        </n-button>
        <n-slider
          :value="volume"
          :step="1"
          :tooltip="false"
          :style="{ width: '100px' }"
          :on-update:value="setVolume"
        />
        <n-button quaternary circle @click="toggleFullScreen">
          <template #icon>
            <n-icon>
              <FullScreenMaximize16Regular />
            </n-icon>
          </template>
        </n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch, onMounted } from 'vue';
import { NButton, NCard, NIcon, NSlider } from 'naive-ui';
import {
  FullScreenMaximize16Regular,
  Speaker116Filled,
  SpeakerMute16Filled,
} from '@vicons/fluent';

const props = defineProps({
  stream: { type: Object, default: null },
});

const root = ref();
const video = ref();
const volume = ref(100);
const lastVolume = ref(100);
const controlsVisibility = ref(true);
const controlsVisibilityTimeout = ref();

const hasVideoTrack = computed(() => {
  const tracks = props.stream?.getVideoTracks?.() || [];
  return tracks.length > 0;
});

const toggleFullScreen = () =>
  document.fullscreenElement
    ? document.exitFullscreen()
    : root.value.requestFullscreen();

const playStream = (stream) => {
  nextTick(() => {
    const el = video.value;
    if (stream && el) {
      el.srcObject = stream;
      el.play();
    }
  });
};

const setVolume = (val) => {
  const el = video.value;
  if (el) {
    volume.value = val;
    lastVolume.value = Math.max(val, lastVolume.value);
    el.volume = val === 0 ? 0 : val / 100;
  }
};

const toggleVolume = () => {
  setVolume(volume.value === 0 ? lastVolume.value : 0);
};

const showControls = () => {
  controlsVisibility.value = true;
  clearTimeout(controlsVisibilityTimeout.value);
  controlsVisibilityTimeout.value = setTimeout(() => {
    controlsVisibility.value = false;
  }, 3000);
};

watch(() => props.stream, playStream, {
  immediate: true,
});

watch(volume, setVolume);

onMounted(showControls);
</script>

<style>
.app-video {
  position: relative;
}

.app-video video {
  width: 100%;
  height: 100%;
}

.app-video._show-controls .app-video__controls,
.app-video__controls:active,
.app-video__controls:focus-within {
  display: flex;
}

.app-video__controls {
  align-items: last baseline;
  box-shadow: inset 0 -50px 50px -50px rgba(207, 62, 226, 0.5);
  display: none;
  gap: 0.5rem;
  inset: 0;
  justify-content: center;
  position: absolute;
}
</style>
