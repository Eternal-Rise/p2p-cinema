import { Peer } from 'peerjs';
import { ref, shallowRef } from 'vue';
import { doLog } from '../utils/logger';

const getIceServers = () =>
  fetch(
    'https://cinema-vikun.metered.live/api/v1/turn/credentials?apiKey=e40e67d7e88d7bc13b3fe0e2bdb962bf0cf4',
  ).then((response) => {
    if (response.ok) return response.json();

    throw response;
  });

export const usePeer = () => {
  const peer = shallowRef(null);
  const hostId = ref();
  const peerId = ref();
  const friendPeerId = ref();
  const userStream = shallowRef(null);
  const screenStream = shallowRef(null);
  const userCall = shallowRef(null);
  const screenCall = shallowRef(null);
  const isConnected = ref(false);
  const isOpened = ref(false);
  const isOpening = ref(false);

  const open = ({ stream, onCall, onOpen = () => {}, onError = () => {} }) => {
    if (isOpened.value) return;

    const handleCallType = {
      user: async (call) => {
        const isAllowed = await onCall(call.metadata);
        if (!isAllowed) return;

        userCall.value = call;
        call.on('close', close);
        call.on('stream', (incomingStream) => {
          userStream.value = incomingStream;
        });
        call.answer(stream);
        isConnected.value = true;
        friendPeerId.value = call.peer;
      },
      screen: (call) => {
        screenCall.value = call;
        call.on('stream', (incomingStream) => {
          screenStream.value = incomingStream;
        });
        call.on('close', () => {
          screenStream.value = null;
        });

        call.answer();
      },
    };

    return getIceServers()
      .then((iceServers) => {
        isOpening.value = true;
        const _peer = new Peer(peerId.value, { config: { iceServers } });

        _peer.on('open', (id) => {
          peerId.value = id;
          isOpening.value = false;
          isOpened.value = true;
          onOpen(id);
        });

        _peer.on('call', async (call) => {
          doLog('info', 'peer.on.call', call.metadata);
          handleCallType[call.metadata?.type]?.(call);
        });

        _peer.on('error', (error) => {
          doLog('error', 'peer.on.error', error);
          onError(error);
        });

        peer.value = _peer;
      })
      .catch(onError);
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

  const call = ({
    stream,
    metadata,
    onStream = () => {},
    onError = () => {},
    onClose = () => {},
  }) => {
    const call = peer.value.call(friendPeerId.value, stream, {
      metadata: { ...metadata, type: 'user' },
    });
    userCall.value = call;
    const connectionTimeout = setTimeout(() => {
      if (!isConnected.value) {
        doLog('error', 'timeout connection error');
        onError(new Error('Connection failed'));
      }
    }, 5000);

    call.on('close', () => {
      doLog('info', 'call.on.close');
      close();
      onClose();
    });
    call.on('error', (error) => {
      doLog('error', 'call.on.error', error);
      onError(error);
    });

    call.on('stream', (incomingStream) => {
      onStream(incomingStream);
      clearTimeout(connectionTimeout);
      isConnected.value = true;
      userStream.value = incomingStream;
    });
  };

  const startScreenSharing = ({
    stream,
    metadata,
    onError = () => {},
    onClose = () => {},
  }) => {
    const call = peer.value.call(friendPeerId.value, stream, {
      metadata: { ...metadata, type: 'screen' },
    });
    screenCall.value = call;

    call.on('close', () => {
      doLog('info', 'shareScreen.on.close');
      onClose();
    });
    call.on('error', (error) => {
      doLog('error', 'shareScreen.on.error', error);
      onError(error);
    });
  };

  const stopScreenSharing = () => {
    screenCall.value?.close();
    screenCall.value = null;
  };

  return {
    open,
    close,
    call,
    startScreenSharing,
    stopScreenSharing,
    friendPeerId,
    hostId,
    isConnected,
    isOpening,
    peerId,
    screenStream,
    userStream,
    userCall,
    screenCall,
  };
};
