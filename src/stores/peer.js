import { ref, shallowRef, h, watch } from 'vue';
import { Peer } from 'peerjs';
import { NButton, useMessage, useNotification } from 'naive-ui';
import {
  useUrlSearchParams,
  useUserMedia,
  useDisplayMedia,
  useThrottleFn,
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

  // query is not reactive between different instances, so need this as singleton
  // https://github.com/vueuse/vueuse/issues/3759
  const query = useUrlSearchParams();

  const peer = shallowRef(null);
  const hostId = ref();
  const peerId = ref(query.hostId);
  const userCall = shallowRef(null);
  const screenCall = shallowRef(null);
  const remotePeerId = ref();
  const remoteUserStream = shallowRef(null);
  const remoteScreenStream = shallowRef(null);
  const remoteUserCall = shallowRef(null);
  const remoteScreenCall = shallowRef(null);
  const isConnected = ref(false);
  const isOpened = ref(false);
  const isOpening = ref(false);
  const isMicrophoneEnabled = ref(false);
  const isScreenEnabled = ref(false);
  const screenShareResolution = ref('1080p');

  const {
    stream: myVoiceStream,
    start: enableMicrophone,
    stop: disabledMicrophone,
  } = useUserMedia({
    constraints: {
      audio: true,
    },
  });
  const {
    stream: myScreenStream,
    start: enableScreen,
    stop: disableScreen,
    isSupported: isScreenShareSupported,
  } = useDisplayMedia({
    // constrains are not reactive by now
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: true,
  });

  const open = async () => {
    if (isOpened.value) return;

    const handleCallType = {
      user: handleUserCall,
      screen: handleScreenShareCall,
    };

    const { promise, resolve, reject } = usePromise();
    getIceServers()
      .then((iceServers) => {
        isOpening.value = true;
        const _peer = new Peer(peerId.value, {
          config: { iceServers },
        });

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

  const close = useThrottleFn(() => {
    if (isConnected.value) {
      message.info('Call ended');
    }

    peer.value?.destroy();
    peer.value = null;
    hostId.value = undefined;
    peerId.value = undefined;
    remotePeerId.value = undefined;
    remoteUserStream.value = null;
    remoteScreenStream.value = null;
    remoteUserCall.value = null;
    remoteScreenCall.value = null;
    isConnected.value = false;
    isOpened.value = false;
    isOpening.value = false;
    stopScreenSharing();
    stopMicrophone();
  }, 500);

  const connect = async (metadata) => {
    const { promise, resolve, reject } = usePromise();
    remotePeerId.value = query.peerId;

    await tryEnableMicrophone();
    await open();

    const call = peer.value.call(remotePeerId.value, myVoiceStream.value, {
      metadata: { ...metadata, type: 'user' },
    });
    remoteUserCall.value = call;
    const connectionTimeout = setTimeout(() => {
      if (!isConnected.value) {
        doLog('error', 'timeout connection error');
        const error = new Error('Connection failed');
        onError(error);
        reject(error);
      }
    }, 5000);

    call.on('close', close);
    call.on('error', (error) => {
      doLog('error', 'call.on.error', error);
      onError(error);
      reject(error);
    });

    call.on('stream', (stream) => {
      clearTimeout(connectionTimeout);
      isConnected.value = true;
      remoteUserStream.value = stream;
      resolve(stream);
    });

    userCall.value = call;
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

    await tryApplyScreenStreamConstraints();
    const call = peer.value.call(remotePeerId.value, myScreenStream.value, {
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

    remoteUserCall.value.localStream
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = isMicrophoneEnabled.value));
  };

  const stopMicrophone = () => {
    userCall.value?.close();
    userCall.value = null;
    disabledMicrophone();
    isMicrophoneEnabled.value = false;
  };

  const tryEnableMicrophone = async () => {
    try {
      await enableMicrophone();
      isMicrophoneEnabled.value = true;
    } catch (error) {
      message.error(error.message);
    }
  };

  const confirmCall = (metadata) => {
    const { promise, resolve } = usePromise();
    const confirm = notification.create({
      title: `${metadata.username} wants to connect`,
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

  const onError = (error) => {
    switch (error?.type) {
      case 'network':
        return handleNetworkError(error);
      default:
        defaultErrorHandler(error);
    }
  };

  const handleUserCall = async (call) => {
    await tryEnableMicrophone();
    const isConfirmed = await confirmCall(call.metadata);
    if (!isConfirmed) return;

    remoteUserCall.value = call;
    call.on('close', close);
    call.on('stream', (stream) => {
      remoteUserStream.value = stream;
    });
    call.answer(myVoiceStream.value);
    isConnected.value = true;
    remotePeerId.value = call.peer;
  };

  const handleScreenShareCall = (call) => {
    remoteScreenCall.value = call;
    call.on('stream', (stream) => {
      remoteScreenStream.value = stream;
    });
    call.on('close', () => {
      remoteScreenStream.value = null;
    });

    call.answer();
  };

  const handleNetworkError = (error) => {
    notification.warning({ content: 'Network error' });

    window.addEventListener(
      'online',
      () => {
        message.info('Trying to reconnect...');
        peer.value?.reconnect();
        if (userCall.value) {
          connect(userCall.value.metadata)
            .then(() => message.success('Reconnected successfully'))
            .catch(onError);
        }
      },
      { once: true },
    );
  };

  const defaultErrorHandler = (error) =>
    notification.error({ content: error.message ?? error.reason });

  const setScreenShareResolution = (resolution) => {
    screenShareResolution.value = resolution;
    tryApplyScreenStreamConstraints();
  };

  const tryApplyScreenStreamConstraints = () => {
    const constraintsVariants = {
      '1440p60': {
        width: { ideal: 2560 },
        height: { ideal: 1440 },
        frameRate: { ideal: 60 },
      },
      '1080p60': {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 60 },
      },
      '720p60': {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 60 },
      },
      '1440p': {
        width: { ideal: 2560 },
        height: { ideal: 1440 },
        frameRate: { ideal: 30 },
      },
      '1080p': {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      '720p': {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    };

    const constraints =
      constraintsVariants[screenShareResolution.value] ??
      constraintsVariants['1080'];
    const track = myScreenStream.value?.getVideoTracks()[0];

    return track?.applyConstraints(constraints).catch((error) => {
      doLog('info', 'Apply constraints failed', error);
    });
  };

  watch(myScreenStream, (stream) => {
    if (stream) {
      stream.oninactive = () => stopScreenSharing();
    }
  });

  return {
    hostId,
    isConnected,
    isMicrophoneEnabled,
    isOpening,
    isScreenEnabled,
    isScreenShareSupported,
    myVoiceStream,
    peerId,
    query,
    remotePeerId,
    remoteScreenStream,
    remoteUserStream,
    screenShareResolution,
    connect,
    close,
    open,
    setScreenShareResolution,
    toggleScreen,
    toggleMicrophone,
  };
});
