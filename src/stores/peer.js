import { ref, h, watch } from 'vue';
import { NButton, useMessage, useNotification } from 'naive-ui';
import {
  useUrlSearchParams,
  useUserMedia,
  useDisplayMedia,
} from '@vueuse/core';
import { defineStore } from 'pinia';

import { usePromise } from '../composables/promisable';
import { usePeer } from '../composables/peer';

export const usePeerStore = defineStore('peer', () => {
  const peer = usePeer();
  const {
    hostId,
    peerId,
    friendPeerId,
    isConnected,
    isOpening,
    screenStream,
    userStream,
    userCall,
  } = peer;

  const message = useMessage();
  const notification = useNotification();
  const query = useUrlSearchParams();
  const isMicrophoneEnabled = ref(false);

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
    const { promise, resolve, reject } = usePromise();

    try {
      await enableMicrophone();
      isMicrophoneEnabled.value = true;
    } catch (error) {
      message.error(error.message);
      return;
    }

    peer.open({
      stream: myVoiceStream.value,
      onOpen: resolve,
      onError: (error) => (onError(error), reject(error)),
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

  const toggleMicrophone = async () => {
    isMicrophoneEnabled.value = !isMicrophoneEnabled.value;

    userCall.value.localStream
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = isMicrophoneEnabled.value));
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

  return {
    hostId,
    peerId,
    friendPeerId,
    isConnected,
    isMicrophoneEnabled,
    isOpening,
    screenStream,
    userStream,
    myVoiceStream,
    openPeer,
    shareMyScreen,
    connectToPeer,
    toggleMicrophone,
  };
});
