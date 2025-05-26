import Peer from 'simple-peer';
import { Buffer } from 'buffer';

// Ensure WebRTC is supported
if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('WebRTC is not supported in this environment');
}

// Polyfill readable-stream
import { Readable } from 'stream-browserify';
if (!global.Readable) {
    global.Readable = Readable;
}

export class WebRTCService {
    constructor(socket, userId) {
        this.socket = socket;
        this.userId = userId;
        this.peer = null;
        this.localStream = null;
        this.remoteStream = null;
        this.onCallStarted = null;
        this.onCallEnded = null;
        this.onRemoteStream = null;
        this.isCallInitiator = false;
        this.inCall = false;
        this.currentCallUserId = null;

        this.setupSocketListeners();
    } setupSocketListeners() {
        // Incoming call offer
        this.socket.on('call:offer', async ({ from, offer }) => {
            console.log(`Received call offer from ${from}`, offer);

            try {
                // Store call state
                this.currentCallUserId = from;
                this.isCallInitiator = false;

                if (this.onCallStarted) {
                    this.onCallStarted(from, false);
                }

                // Get local media stream first
                await this.getLocalStream();

                // Create peer for receiving call
                this.createPeer(false);

                // Wait a bit for peer to initialize
                await new Promise(resolve => setTimeout(resolve, 100));

                // Process received offer
                if (this.peer) {
                    console.log('Processing offer');
                    this.peer.signal(offer);
                } else {
                    throw new Error('Peer not created');
                }
            } catch (error) {
                console.error('Error handling call offer:', error);
                this.endCall();
            }
        });

        // Answer to our call
        this.socket.on('call:answer', ({ from, answer }) => {
            console.log(`Received call answer from ${from}`, answer);

            try {
                if (this.peer && from === this.currentCallUserId) {
                    console.log('Processing answer');
                    this.peer.signal(answer);
                }
            } catch (error) {
                console.error('Error processing answer:', error);
                this.endCall();
            }
        });

        // ICE candidate exchange
        this.socket.on('call:ice-candidate', ({ from, candidate }) => {
            console.log(`Received ICE candidate from ${from}`, candidate);

            try {
                if (this.peer && from === this.currentCallUserId) {
                    this.peer.signal({ candidate });
                }
            } catch (error) {
                console.error('Error processing ICE candidate:', error);
            }
        });

        // Call ended by remote user
        this.socket.on('call:end', ({ from }) => {
            if (from === this.currentCallUserId) {
                this.endCall(false);
            }
        });
    }

    async getLocalStream() {
        if (!this.localStream) {
            try {
                console.log('Requesting media permissions...');

                // Check if mediaDevices is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('getUserMedia is not supported in this browser');
                }

                // Request media with constraints
                const constraints = {
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: true
                };

                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('Media stream obtained successfully');
            } catch (error) {
                console.error('Failed to get local stream:', error.name, error.message);
                throw error;
            }
        }

        if (!this.localStream) {
            throw new Error('Failed to initialize local stream');
        }

        return this.localStream;
    } createPeer(isInitiator) {
        // End existing peer if any
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        try {
            if (!this.localStream) {
                throw new Error('Local stream is not available');
            }

            console.log('Creating peer with config:', {
                initiator: isInitiator,
                trickle: true
            });

            // Create the peer instance
            this.peer = new Peer({
                initiator: isInitiator,
                trickle: true,
                stream: this.localStream, // Pass stream directly in config
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                },
                objectMode: true // Enable object mode for stream handling
            });

            console.log('Peer created successfully');            // Handle peer events
            this.peer.on('signal', data => {
                console.log('Signal event:', data.type);
                if (isInitiator) {
                    if (data.type === 'offer') {
                        // Send offer to remote peer
                        this.socket.emit('call:offer', {
                            to: this.currentCallUserId,
                            offer: data
                        });
                    }
                } else {
                    if (data.type === 'answer') {
                        // Send answer to remote peer
                        this.socket.emit('call:answer', {
                            to: this.currentCallUserId,
                            answer: data
                        });
                    }
                }
                // Handle ICE candidates
                if (data.candidate) {
                    this.socket.emit('call:ice-candidate', {
                        to: this.currentCallUserId,
                        candidate: data.candidate
                    });
                }
            });

            this.peer.on('connect', () => {
                console.log('Peer connection established');
                this.inCall = true;
            });

            this.peer.on('stream', stream => {
                console.log('Received remote stream');
                this.remoteStream = stream;
                if (this.onRemoteStream) {
                    this.onRemoteStream(stream);
                }
            });

            this.peer.on('track', (track, stream) => {
                console.log('Received track:', track.kind);
            });

            this.peer.on('error', err => {
                console.error('Peer connection error:', err);
                this.endCall();
            });

            this.peer.on('close', () => {
                console.log('Peer connection closed');
                this.endCall();
            });

            // Debug events
            this.peer.on('iceStateChange', (state) => {
                console.log('ICE state:', state);
            });

            this.inCall = true;

        } catch (error) {
            console.error('Error creating peer:', error);
            throw error;
        }
    }

    async startCall(userId) {
        try {
            console.log('Starting call with user:', userId);

            // Store call state
            this.currentCallUserId = userId;
            this.isCallInitiator = true;

            console.log('Getting local media stream...');
            // Get local media stream
            await this.getLocalStream();
            console.log('Local stream obtained:', this.localStream ? 'success' : 'failed');

            console.log('Creating peer as initiator...');
            // Create peer as initiator
            await this.createPeer(true);
            console.log('Peer created successfully');

            if (this.onCallStarted) {
                this.onCallStarted(userId, true);
            }

            return true;
        } catch (error) {
            console.error('Error starting call:', error);
            this.endCall();
            return false;
        }
    } async answerCall() {
        console.log('Answering call from:', this.currentCallUserId);

        if (!this.currentCallUserId || this.isCallInitiator) {
            console.error('Cannot answer call: Invalid state');
            return false;
        }

        try {
            // Get local media stream if not already available
            if (!this.localStream) {
                await this.getLocalStream();
            }

            // Create new peer if not exists
            if (!this.peer) {
                await this.createPeer(false);
            }

            // Set in call state
            this.inCall = true;

            return true;
        } catch (error) {
            console.error('Error answering call:', error);
            this.endCall();
            return false;
        }
    }

    endCall(emitEvent = true) {
        if (this.inCall && emitEvent && this.currentCallUserId) {
            // Notify other user that call has ended
            this.socket.emit('call:end', {
                to: this.currentCallUserId
            });
        }

        // Close peer connection
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        // Reset call state
        this.inCall = false;

        // Stop local media tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Clear remote stream
        this.remoteStream = null;

        // Store previous call user ID temporarily
        const prevUserId = this.currentCallUserId;
        this.currentCallUserId = null;
        this.isCallInitiator = false;

        // Notify about call end
        if (this.onCallEnded && prevUserId) {
            this.onCallEnded(prevUserId);
        }
    }

    toggleAudio(enabled) {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = enabled;
            });
            return audioTracks.length > 0 ? audioTracks[0].enabled : false;
        }
        return false;
    }

    toggleVideo(enabled) {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = enabled;
            });
            return videoTracks.length > 0 ? videoTracks[0].enabled : false;
        }
        return false;
    }
}
