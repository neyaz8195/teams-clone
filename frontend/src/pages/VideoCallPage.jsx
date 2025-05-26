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
    };    // Answer call
    const handleAnswerCall = async () => {
        if (!webRtcService || !inCall || isInitiator) {
            console.log('Cannot answer call:', { webRtcService: !!webRtcService, inCall, isInitiator });
            return;
        }

        try {
            console.log('Answering call...');
            const success = await webRtcService.answerCall();

            if (success) {
                console.log('Call answered successfully');
                // The overlay will be hidden because we're already inCall
            } else {
                console.error('Failed to answer call');
                handleEndCall();
            }
        } catch (error) {
            console.error('Error answering call:', error);
            handleEndCall();
        }
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
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', p: 3, gap: 3 }}>
            {/* Contacts sidebar */}
            {!inCall && (
                <Paper
                    sx={{
                        width: 380,
                        borderRadius: 2,
                        overflow: 'auto',
                        boxShadow: (theme) => theme.shadows[3],
                    }}
                    elevation={0}
                >
                    <Typography variant="h6" sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                        Start a Call
                    </Typography>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Select a contact to start a video call
                        </Typography>
                    </Box>
                    <Box sx={{ px: 2, pb: 2 }}>
                        {contacts.map((contact) => (
                            <Paper
                                key={contact.auth0Id}
                                elevation={1}
                                sx={{
                                    p: 2.5,
                                    m: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    borderRadius: 2,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                        transform: 'translateY(-2px)',
                                        boxShadow: (theme) => theme.shadows[4],
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
            <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                bgcolor: 'background.paper',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: (theme) => theme.shadows[3],
                minWidth: 0, // Prevents flex item from overflowing
            }}>
                {inCall ? (
                    <>
                        {/* Call in progress */}
                        <Box sx={{ flex: 1, position: 'relative', bgcolor: '#1a1a1a' }}>
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
                            <Paper
                                elevation={8}
                                sx={{
                                    position: 'absolute',
                                    width: 280,
                                    height: 210,
                                    bottom: 100,
                                    right: 24,
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    bgcolor: '#000',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        boxShadow: (theme) => theme.shadows[12],
                                    }
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
                                {!videoEnabled && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: 'rgba(0,0,0,0.7)',
                                        }}
                                    >
                                        <VideocamOffIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.8)' }} />
                                    </Box>
                                )}
                            </Paper>

                            {/* Call controls */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 20,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    backdropFilter: 'blur(10px)',
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    borderRadius: 8,
                                    p: 2,
                                    gap: 2,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                }}
                            >
                                <IconButton
                                    onClick={handleToggleAudio}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: audioEnabled ? 'rgba(255,255,255,0.1)' : 'error.main',
                                        '&:hover': {
                                            bgcolor: audioEnabled ? 'rgba(255,255,255,0.2)' : 'error.dark',
                                        },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {audioEnabled ?
                                        <MicIcon sx={{ color: 'white', fontSize: 28 }} /> :
                                        <MicOffIcon sx={{ color: 'white', fontSize: 28 }} />
                                    }
                                </IconButton>
                                <IconButton
                                    onClick={handleEndCall}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: 'error.main',
                                        '&:hover': {
                                            bgcolor: 'error.dark',
                                        },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <CallEndIcon sx={{ color: 'white', fontSize: 28 }} />
                                </IconButton>
                                <IconButton
                                    onClick={handleToggleVideo}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        bgcolor: videoEnabled ? 'rgba(255,255,255,0.1)' : 'error.main',
                                        '&:hover': {
                                            bgcolor: videoEnabled ? 'rgba(255,255,255,0.2)' : 'error.dark',
                                        },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {videoEnabled ?
                                        <VideocamIcon sx={{ color: 'white', fontSize: 28 }} /> :
                                        <VideocamOffIcon sx={{ color: 'white', fontSize: 28 }} />
                                    }
                                </IconButton>
                            </Box>

                            {/* Incoming call overlay */}
                            {!isInitiator && !webRtcService?.hasAnswered && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'rgba(0,0,0,0.85)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 3,
                                        '@keyframes pulse': {
                                            '0%': {
                                                transform: 'scale(1)',
                                                boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.4)'
                                            },
                                            '70%': {
                                                transform: 'scale(1.1)',
                                                boxShadow: '0 0 0 20px rgba(76, 175, 80, 0)'
                                            },
                                            '100%': {
                                                transform: 'scale(1)',
                                                boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)'
                                            }
                                        }
                                    }}
                                >
                                    <Avatar
                                        alt={callUser?.name}
                                        src={callUser?.picture}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            border: '4px solid rgba(255,255,255,0.2)',
                                            animation: 'pulse 2s infinite'
                                        }}
                                    />
                                    <Typography variant="h5" color="white" sx={{ mb: 1 }}>
                                        Incoming call from {callUser?.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <IconButton
                                            onClick={handleAnswerCall}
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                bgcolor: 'success.main',
                                                '&:hover': { bgcolor: 'success.dark' },
                                                animation: 'pulse 2s infinite'
                                            }}
                                        >
                                            <VideocamIcon sx={{ color: 'white', fontSize: 32 }} />
                                        </IconButton>
                                        <IconButton
                                            onClick={handleEndCall}
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                bgcolor: 'error.main',
                                                '&:hover': { bgcolor: 'error.dark' }
                                            }}
                                        >
                                            <CallEndIcon sx={{ color: 'white', fontSize: 32 }} />
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
                            gap: 2,
                            p: 4,
                        }}
                    >
                        <VideocamIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="h6" color="text.secondary">
                            Select a contact to start a video call
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
