export const WebRTCPeerConfig = {
  configuration: {
    iceServers: [
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  },
  videoBitrate: 300,
  audioBitrate: 30
};
