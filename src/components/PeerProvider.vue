<template>
  <slot
    v-bind="{
      isConnected,
      isOpening,
      userStream,
      screenStream,
      openPeer,
      shareMyScreen,
    }"
  />
</template>

<script setup>
import { h, onMounted, watch } from 'vue';
import { NButton, useMessage, useNotification } from 'naive-ui';
import {
  useUrlSearchParams,
  useUserMedia,
  useDisplayMedia,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';

import { usePromise } from '../composables/promisable';
import { usePeerStore } from '../stores/peer';

const peer = usePeerStore();
const {
  hostId,
  peerId,
  friendPeerId,
  isConnected,
  isOpening,
  screenStream,
  userStream,
} = storeToRefs(peer);

const message = useMessage();
const notification = useNotification();
const query = useUrlSearchParams();

const { stream: myVoiceStream, start: enableMicrophone } = useUserMedia({
  constraints: {
    audio: true,
  },
});
const {
  stream: myScreenStream,
  start: enableScreen,
  stop: disableScreen,
} = useDisplayMedia({
  video: true,
  audio: true,
});

const openPeer = async () => {
  const { promise, resolve } = usePromise();

  try {
    await enableMicrophone();
  } catch (error) {
    message.error(error.message);
    return;
  }

  peer.open({
    stream: myVoiceStream.value,
    onOpen: resolve,
    onError,
    onCall,
  });

  return promise;
};

const connectToPeer = async (metadata) => {
  const { promise, resolve, reject } = usePromise();
  friendPeerId.value = query.peerId;
  await openPeer();
  peer.call({
    stream: myVoiceStream.value,
    metadata,
    onStream: () => resolve(),
    onError: (error) => (onError(error), reject(error)),
  });

  return promise;
};

const shareMyScreen = async () => {
  try {
    await enableScreen();
  } catch (error) {
    message.error(error.message);
    return;
  }

  peer.startScreenSharing({
    stream: myScreenStream.value,
  });
};

const onCall = (metadata) => {
  const { promise, resolve } = usePromise();
  const confirm = notification.create({
    title: `${metadata.username} want's to connect`,
    action: () =>
      h(
        NButton,
        {
          type: 'primary',
          onClick: () => {
            resolve(true);
            confirm.destroy();
          },
        },
        () => 'Admit',
      ),
    onClose: () => resolve(false),
  });

  return promise;
};

const onError = (error) =>
  notification.error({ content: error.message ?? error.reason });

watch(myScreenStream, (stream) => {
  if (stream) {
    stream.oninactive = () => {
      peer.stopScreenSharing();
      disableScreen();
    };
  }
});

onMounted(() => {
  if (isConnected.value) return;

  if (query.hostId && !hostId.value) {
    hostId.value = query.hostId;
    peerId.value = query.hostId;
    openPeer();
  }
});

defineExpose({
  openPeer,
  connectToPeer,
});
</script>
