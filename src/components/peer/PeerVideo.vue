<template>
  <div class="peer-video">
    <n-card class="h-100" content-style="padding: 0;">
      <slot v-if="!hasVideoTrack" name="preview" />
      <video v-show="hasVideoTrack" ref="video" />
      <div class="peer-video__controls">
        <n-button quaternary circle @click="toggleVolume">
          <template #icon>
            <n-icon>
              <SpeakerMute16Filled v-if="volume === 0" />
              <Speaker116Filled v-else />
            </n-icon>
          </template>
        </n-button>
        <n-slider
          :max="1"
          :min="0"
          :step="0.01"
          :style="{ width: '100px' }"
          :tooltip="false"
          :value="volume"
          :on-update:value="setVolume"
        />
        <n-button quaternary circle @click="emit('fullscreen')">
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
import { computed, nextTick, ref, watch } from 'vue';
import { NButton, NCard, NIcon, NSlider } from 'naive-ui';
import {
  FullScreenMaximize16Regular,
  Speaker116Filled,
  SpeakerMute16Filled,
} from '@vicons/fluent';

const props = defineProps({
  stream: { type: Object, default: null },
});

const emit = defineEmits(['fullscreen']);

const video = ref();
const volume = ref(1);
const lastVolume = ref(1);

const hasVideoTrack = computed(() => {
  const tracks = props.stream?.getVideoTracks?.() || [];
  return tracks.length > 0;
});

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
    lastVolume.value = val;
    el.volume = val;
  }
};

const toggleVolume = () => {
  setVolume(volume.value === 0 ? lastVolume.value : 0);
};

watch(() => props.stream, playStream, {
  immediate: true,
});

watch(volume, setVolume);
</script>

<style>
.peer-video {
  position: relative;
}

.peer-video video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.show-controls .peer-video__controls,
.peer-video__controls:active,
.peer-video__controls:focus-within {
  display: flex;
}

.peer-video__controls {
  align-items: last baseline;
  box-shadow: inset 0 -50px 50px -50px rgba(207, 62, 226, 0.5);
  display: none;
  gap: 0.5rem;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: absolute;
}

@media (display-mode: fullscreen) {
  .peer-video__controls {
    justify-content: flex-end;
  }
}
</style>
