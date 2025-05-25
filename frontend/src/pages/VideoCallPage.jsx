import { useState, useEffect, useRef } from 'react';
import { Box, Grid, Paper, Typography, IconButton, Avatar, Badge } from '@mui/material';
import {
    Videocam as VideocamIcon,
    VideocamOff as VideocamOffIcon,
    Mic as MicIcon,
    MicOff as MicOffIcon,
    CallEnd as CallEndIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { WebRTCService } from '../services/WebRTCService';

export default function VideoCallPage() {
    const { user, token } = useAuth();
    const { socket, isUserOnline } = useSocket();
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [webRtcService, setWebRtcService] = useState(null);
    const [inCall, setInCall] = useState(false);
    const [isInitiator, setIsInitiator] = useState(false);
    const [callUser, setCallUser] = useState(null);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Initialize WebRTC service
    useEffect(() => {
        if (socket && user) {
            const webRtcSvc = new WebRTCService(socket, user.userId);

            // Set up call event handlers
            webRtcSvc.onCallStarted = (userId, initiator) => {
                setInCall(true);
                setIsInitiator(initiator);
                setCallUser(contacts.find(c => c.auth0Id === userId) || { auth0Id: userId, name: 'Unknown User' });
            };

            webRtcSvc.onCallEnded = () => {
                setInCall(false);
                setCallUser(null);
            };

            webRtcSvc.onRemoteStream = (stream) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }
            };

            setWebRtcService(webRtcSvc);

            return () => {
                webRtcSvc.endCall();
            };
        }
    }, [socket, user]);

    // Load local stream
    useEffect(() => {
        if (webRtcService) {
            const setupLocalVideo = async () => {
                try {
                    const stream = await webRtcService.getLocalStream();
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } catch (error) {
                    console.error('Error accessing media devices:', error);
                }
            };

            setupLocalVideo();
        }
    }, [webRtcService]);

    // Load contacts
    useEffect(() => {
        if (token) {
            import('../services/ApiService').then(async (module) => {
                const apiService = module.default;
                apiService.setToken(token);

                const userService = new (await import('../services/UserService')).default(apiService);

                try {
                    const users = await userService.getUsers();
                    setContacts(users);
                } catch (error) {
                    console.error('Failed to load contacts:', error);
                }
            });
        }
    }, [token]);

    // Start call
    const handleStartCall = async (contact) => {
        if (!webRtcService || inCall) return;

        setSelectedContact(contact);
        const success = await webRtcService.startCall(contact.auth0Id);

        if (success) {
            setCallUser(contact);
            setInCall(true);
            setIsInitiator(true);
        }
    };

    // Answer call
    const handleAnswerCall = async () => {
        if (!webRtcService || !inCall || isInitiator) {
            return;
        }

        await webRtcService.answerCall();
    };

    // End call
    const handleEndCall = () => {
        if (webRtcService) {
            webRtcService.endCall();
            setInCall(false);
            setCallUser(null);
        }
    };

    // Toggle audio
    const handleToggleAudio = () => {
        if (webRtcService) {
            const enabled = webRtcService.toggleAudio(!audioEnabled);
            setAudioEnabled(enabled);
        }
    };

    // Toggle video
    const handleToggleVideo = () => {
        if (webRtcService) {
            const enabled = webRtcService.toggleVideo(!videoEnabled);
            setVideoEnabled(enabled);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Contacts sidebar */}
            {!inCall && (
                <Paper
                    sx={{
                        width: 300,
                        borderRadius: 0,
                        overflow: 'auto',
                    }}
                    elevation={0}
                    variant="outlined"
                >
                    <Typography variant="h6" sx={{ p: 2 }}>
                        Start a Call
                    </Typography>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Select a contact to start a video call
                        </Typography>
                    </Box>
                    <Box sx={{ p: 1 }}>
                        {contacts.map((contact) => (
                            <Paper
                                key={contact.auth0Id}
                                elevation={1}
                                sx={{
                                    p: 2,
                                    m: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                }}
                                onClick={() => handleStartCall(contact)}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Badge
                                        overlap="circular"
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        variant="dot"
                                        color={isUserOnline(contact.auth0Id) ? 'success' : 'error'}
                                    >
                                        <Avatar alt={contact.name} src={contact.picture} />
                                    </Badge>
                                    <Box sx={{ ml: 2 }}>
                                        <Typography variant="body1">{contact.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {isUserOnline(contact.auth0Id) ? 'Online' : 'Offline'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton
                                    color="primary"
                                    disabled={!isUserOnline(contact.auth0Id)}
                                >
                                    <VideocamIcon />
                                </IconButton>
                            </Paper>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Call area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {inCall ? (
                    <>
                        {/* Call in progress */}
                        <Box sx={{ flex: 1, position: 'relative', bgcolor: '#000' }}>
                            {/* Remote video (full size) */}
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />

                            {/* Local video (small overlay) */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    width: 200,
                                    height: 150,
                                    bottom: 20,
                                    right: 20,
                                    border: '2px solid #fff',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    bgcolor: '#000',
                                }}
                            >
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)', // Mirror effect
                                    }}
                                />
                            </Box>

                            {/* Call controls */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 20,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    bgcolor: 'rgba(0,0,0,0.5)',
                                    borderRadius: 4,
                                    p: 1,
                                }}
                            >
                                <IconButton
                                    color="primary"
                                    onClick={handleToggleAudio}
                                    sx={{ mx: 1 }}
                                >
                                    {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                                </IconButton>
                                <IconButton
                                    color="error"
                                    onClick={handleEndCall}
                                    sx={{
                                        mx: 1,
                                        bgcolor: 'error.main',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'error.dark',
                                        },
                                    }}
                                >
                                    <CallEndIcon />
                                </IconButton>
                                <IconButton
                                    color="primary"
                                    onClick={handleToggleVideo}
                                    sx={{ mx: 1 }}
                                >
                                    {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                                </IconButton>
                            </Box>

                            {/* Call info */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 20,
                                    left: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: 'white',
                                }}
                            >
                                <Avatar alt={callUser?.name} src={callUser?.picture} />
                                <Typography variant="h6" sx={{ ml: 2 }}>
                                    {callUser?.name || 'Unknown User'}
                                </Typography>
                            </Box>

                            {/* Incoming call overlay */}
                            {inCall && !isInitiator && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'rgba(0,0,0,0.7)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                    }}
                                >
                                    <Avatar
                                        alt={callUser?.name}
                                        src={callUser?.picture}
                                        sx={{ width: 100, height: 100, mb: 2 }}
                                    />
                                    <Typography variant="h5" sx={{ mb: 1 }}>
                                        {callUser?.name || 'Unknown User'}
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 4 }}>
                                        Incoming video call...
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <IconButton
                                            color="error"
                                            onClick={handleEndCall}
                                            sx={{
                                                bgcolor: 'error.main',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'error.dark',
                                                },
                                                p: 2,
                                            }}
                                        >
                                            <CallEndIcon fontSize="large" />
                                        </IconButton>
                                        <IconButton
                                            color="success"
                                            onClick={handleAnswerCall}
                                            sx={{
                                                bgcolor: 'success.main',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'success.dark',
                                                },
                                                p: 2,
                                            }}
                                        >
                                            <VideocamIcon fontSize="large" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            p: 3
                        }}
                    >
                        <PersonIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Video Calling
                        </Typography>
                        <Typography variant="body1" color="text.secondary" align="center">
                            Select a contact from the list to start a video call.
                            <br />
                            Make sure your camera and microphone are connected.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
