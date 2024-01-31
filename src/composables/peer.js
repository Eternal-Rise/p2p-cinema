import { Peer } from 'peerjs';
import { ref, shallowRef } from 'vue';
import { doLog } from '../utils/logger';

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

        call.answer();
      },
    };

    isOpening.value = true;
    const _peer = new Peer(peerId.value);

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
  };

  const close = () => {
    peer.value?.disconnect();
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

    call.on('close', () => {
      doLog('info', 'call.on.close');
      onClose();
    });
    call.on('error', (error) => {
      doLog('error', 'call.on.error', error);
      onError(error);
    });

    call.on('stream', (incomingStream) => {
      onStream(incomingStream);
      isConnected.value = true;
      userStream.value = incomingStream;
    });

    setTimeout(() => {
      if (!isConnected.value) {
        doLog('error', 'timeout connection error');
        onError(new Error('Connection failed'));
      }
    }, 5000);
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
