import { Buffer } from 'buffer';

// Polyfill for global and process in the browser environment
if (typeof window !== 'undefined') {
    window.global = window;

    // Process polyfill
    window.process = {
        env: {},
        nextTick: function (fn) {
            setTimeout(fn, 0);
        },
        browser: true,
        version: ''
    };

    // Buffer polyfill
    window.Buffer = Buffer;

    // WebRTC polyfills
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;

    // Ensure getUserMedia is available
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
}

export default {};
