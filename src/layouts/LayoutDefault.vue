<template>
  <n-config-provider :theme="darkTheme" abstract>
    <n-message-provider>
      <n-notification-provider>
        <n-layout>
          <n-layout-content>
            <slot />
          </n-layout-content>
        </n-layout>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { computed } from 'vue';
import {
  darkTheme,
  NMessageProvider,
  NConfigProvider,
  NLayout,
  NLayoutContent,
  NNotificationProvider,
} from 'naive-ui';
</script>
