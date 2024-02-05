import { ref, shallowRef, h, watch, computed } from 'vue';
import { Peer } from 'peerjs';
import { NButton, useMessage, useNotification } from 'naive-ui';
import {
  useUrlSearchParams,
  useUserMedia,
  useDisplayMedia,
} from '@vueuse/core';
import { defineStore } from 'pinia';

import { usePromise } from '../composables/promisable';
import { doLog } from '../utils/logger';

const getIceServers = () =>
  fetch(
    'https://cinema-vikun.metered.live/api/v1/turn/credentials?apiKey=e40e67d7e88d7bc13b3fe0e2bdb962bf0cf4',
  ).then((response) => {
    if (response.ok) return response.json();

    throw response;
  });

export const usePeerStore = defineStore('peer', () => {
  const message = useMessage();
  const notification = useNotification();
  const query = useUrlSearchParams();

  const peer = shallowRef(null);
  const hostId = ref();
  const peerId = ref(query.hostId);
  const friendPeerId = ref();
  const userStream = shallowRef(null);
  const screenStream = shallowRef(null);
  const userCall = shallowRef(null);
  const screenCall = shallowRef(null);
  const isConnected = ref(false);
  const isOpened = ref(false);
  const isOpening = ref(false);
  const isMicrophoneEnabled = ref(false);
  const isScreenEnabled = ref(false);

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

  const handleUserCall = async (call) => {
    const isConfirmed = await confirmCall(call.metadata);
    if (!isConfirmed) return;

    userCall.value = call;
    call.on('close', close);
    call.on('stream', (incomingStream) => {
      userStream.value = incomingStream;
    });
    call.answer(myVoiceStream.value);
    isConnected.value = true;
    friendPeerId.value = call.peer;
  };

  const handleScreenShareCall = (call) => {
    screenCall.value = call;
    call.on('stream', (incomingStream) => {
      screenStream.value = incomingStream;
    });
    call.on('close', () => {
      screenStream.value = null;
    });

    call.answer();
  };

  const open = async () => {
    if (isOpened.value) return;

    try {
      await enableMicrophone();
      isMicrophoneEnabled.value = true;
    } catch (error) {
      message.error(error.message);
      return;
    }

    const handleCallType = {
      user: handleUserCall,
      screen: handleScreenShareCall,
    };

    const { promise, resolve, reject } = usePromise();
    getIceServers()
      .then((iceServers) => {
        isOpening.value = true;
        const _peer = new Peer(peerId.value, { config: { iceServers } });

        _peer.on('open', (id) => {
          peerId.value = id;
          isOpening.value = false;
          isOpened.value = true;
          resolve(id);
        });

        _peer.on('call', async (call) => {
          doLog('info', 'peer.on.call', call.metadata);
          handleCallType[call.metadata?.type]?.(call);
        });

        _peer.on('error', (error) => {
          doLog('error', 'peer.on.error', error);
          onError(error);
          reject(error);
        });

        peer.value = _peer;
      })
      .catch((error) => (onError(error), reject(error)));

    return promise;
  };

  const close = () => {
    userCall.value?.close();

    // probably, should also call some close actions for streams
    peer.value?.destroy();
    peer.value = null;
    hostId.value = undefined;
    peerId.value = undefined;
    friendPeerId.value = undefined;
    userStream.value = null;
    screenStream.value = null;
    userCall.value = null;
    screenCall.value = null;
    isConnected.value = false;
    isOpened.value = false;
    isOpening.value = false;
  };

  const connect = async (metadata) => {
    const { promise, resolve, reject } = usePromise();
    friendPeerId.value = query.peerId;

    await open();

    const call = peer.value.call(friendPeerId.value, myVoiceStream.value, {
      metadata: { ...metadata, type: 'user' },
    });
    userCall.value = call;
    const connectionTimeout = setTimeout(() => {
      if (!isConnected.value) {
        doLog('error', 'timeout connection error');
        const error = new Error('Connection failed');
        onError(error);
        reject(error);
      }
    }, 5000);

    call.on('close', () => {
      doLog('info', 'call.on.close');
      close();
    });
    call.on('error', (error) => {
      doLog('error', 'call.on.error', error);
      onError(error);
      reject(error);
    });

    call.on('stream', (incomingStream) => {
      clearTimeout(connectionTimeout);
      isConnected.value = true;
      userStream.value = incomingStream;
      resolve(incomingStream);
    });

    return promise;
  };

  const startScreenSharing = async () => {
    try {
      await enableScreen();
      isScreenEnabled.value = true;
    } catch (error) {
      message.error(error.message);
      return;
    }

    const call = peer.value.call(friendPeerId.value, myScreenStream.value, {
      metadata: { type: 'screen' },
    });
    screenCall.value = call;

    call.on('close', () => {
      doLog('info', 'shareScreen.on.close');
    });
    call.on('error', (error) => {
      doLog('error', 'shareScreen.on.error', error);
      onError(error);
    });
  };

  const stopScreenSharing = () => {
    screenCall.value?.close();
    screenCall.value = null;
    disableScreen();
    isScreenEnabled.value = false;
  };

  const toggleScreen = () =>
    isScreenEnabled.value ? stopScreenSharing() : startScreenSharing();

  const toggleMicrophone = async () => {
    isMicrophoneEnabled.value = !isMicrophoneEnabled.value;

    userCall.value.localStream
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = isMicrophoneEnabled.value));
  };

  const confirmCall = (metadata) => {
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
      stream.oninactive = () => stopScreenSharing();
    }
  });

  return {
    hostId,
    peerId,
    friendPeerId,
    isConnected,
    isMicrophoneEnabled,
    isScreenEnabled,
    isOpening,
    screenStream,
    userStream,
    myVoiceStream,
    connect,
    close,
    open,
    toggleScreen,
    toggleMicrophone,
  };
});
