import SimplePeer from 'simple-peer';

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
    }

    setupSocketListeners() {
        // Incoming call offer
        this.socket.on('call:offer', async ({ from, offer }) => {
            console.log(`Received call offer from ${from}`);

            // Store call state
            this.currentCallUserId = from;
            this.isCallInitiator = false;

            if (this.onCallStarted) {
                this.onCallStarted(from, false);
            }

            // Create peer connection as receiver
            try {
                // Get local media stream
                await this.getLocalStream();

                // Create peer for receiving call
                this.createPeer(false);

                // Process received offer
                this.peer.signal(offer);
            } catch (error) {
                console.error('Error handling call offer:', error);
                this.endCall();
            }
        });

        // Answer to our call
        this.socket.on('call:answer', ({ from, answer }) => {
            console.log(`Received call answer from ${from}`);

            if (this.peer && from === this.currentCallUserId) {
                this.peer.signal(answer);
            }
        });

        // ICE candidate exchange
        this.socket.on('call:ice-candidate', ({ from, candidate }) => {
            if (this.peer && from === this.currentCallUserId) {
                this.peer.signal(candidate);
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
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            } catch (error) {
                console.error('Failed to get local stream:', error);
                throw error;
            }
        }

        return this.localStream;
    }

    createPeer(isInitiator) {
        // End existing peer if any
        if (this.peer) {
            this.peer.destroy();
        }

        // Create new peer connection
        this.peer = new SimplePeer({
            initiator: isInitiator,
            stream: this.localStream,
            trickle: true
        });

        // Handle peer events
        this.peer.on('signal', data => {
            if (isInitiator) {
                // Send offer to remote peer
                this.socket.emit('call:offer', {
                    to: this.currentCallUserId,
                    offer: data
                });
            } else {
                // Send answer to remote peer
                this.socket.emit('call:answer', {
                    to: this.currentCallUserId,
                    answer: data
                });
            }
        });

        this.peer.on('stream', stream => {
            this.remoteStream = stream;
            if (this.onRemoteStream) {
                this.onRemoteStream(stream);
            }
        });

        this.peer.on('error', err => {
            console.error('Peer connection error:', err);
            this.endCall();
        });

        this.peer.on('close', () => {
            this.endCall();
        });

        this.inCall = true;
    }

    async startCall(userId) {
        try {
            // Store call state
            this.currentCallUserId = userId;
            this.isCallInitiator = true;

            // Get local media stream
            await this.getLocalStream();

            // Create peer as initiator
            this.createPeer(true);

            if (this.onCallStarted) {
                this.onCallStarted(userId, true);
            }

            return true;
        } catch (error) {
            console.error('Error starting call:', error);
            this.endCall();
            return false;
        }
    }

    async answerCall() {
        if (!this.currentCallUserId || this.isCallInitiator || !this.peer) {
            return false;
        }

        try {
            // Signal to the peer that we're ready to connect
            // The actual answer is handled in the signal event

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
