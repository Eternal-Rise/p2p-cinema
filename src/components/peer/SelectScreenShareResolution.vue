<template>
  <n-dropdown
    :value="peer.screenShareResolution"
    :options="screenShareResolutionOptions"
    trigger="click"
    placement="top-start"
    @update:show="handleDropdownVisibilityChange"
    @select="peer.setScreenShareResolution"
  >
    <n-tooltip :show="tooltipVisibility" trigger="manual">
      Select ideal quality of shared screen video. (Actual quality still may be
      different)

      <template #trigger>
        <n-button
          size="large"
          @mouseenter="showTooltip"
          @mouseleave="hideTooltip"
          @focus="showTooltip"
          @blur="hideTooltip"
        >
          <n-icon :size="24">
            <Settings16Filled />
          </n-icon>
        </n-button>
      </template>
    </n-tooltip>
  </n-dropdown>
</template>

<script setup>
import { computed, ref } from 'vue';
import { NButton, NDropdown, NIcon, NTooltip } from 'naive-ui';
import { Settings16Filled } from '@vicons/fluent';
import { usePeerStore } from '../../stores/peer';

const peer = usePeerStore();
const tooltipVisibility = ref(false);
const dropdownVisibility = ref(false);

const screenShareResolutionOptions = computed(() => [
  {
    label: '1440p60',
    key: '1440p60',
  },
  {
    label: '1080p60',
    key: '1080p60',
  },
  {
    label: '720p60',
    key: '720p60',
  },
  {
    label: '1440p',
    key: '1440p',
  },
  {
    label: '1080p',
    key: '1080p',
  },
  {
    label: '720p',
    key: '720p',
  },
]);

const handleDropdownVisibilityChange = (isVisible) => {
  dropdownVisibility.value = isVisible;
  tooltipVisibility.value = isVisible ? false : tooltipVisibility.value;
};

const showTooltip = () => {
  tooltipVisibility.value = true;
};

const hideTooltip = () => {
  tooltipVisibility.value = false;
};
</script>
