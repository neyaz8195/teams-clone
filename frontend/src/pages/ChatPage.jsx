import { useState, useEffect, useRef } from 'react';
import { Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Paper, TextField, IconButton, Divider, Badge, Popover } from '@mui/material';
import { Send as SendIcon, InsertDriveFile as FileIcon, Image as ImageIcon, EmojiEmotions as EmojiIcon } from '@mui/icons-material';
import { grey } from '@mui/material/colors';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import ChatService from '../services/ChatService';
import UserService from '../services/UserService';

export default function ChatPage() {
    const { user, token } = useAuth();
    const { socket, isUserOnline } = useSocket();
    const [allUsers, setAllUsers] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatService, setChatService] = useState(null);
    const [userService, setUserService] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null);

    // Initialize services
    useEffect(() => {
        if (socket && token) {
            import('../services/ApiService').then((module) => {
                const apiService = module.default;
                apiService.setToken(token);

                const chatSvc = new ChatService(socket, apiService);
                setChatService(chatSvc);

                const userSvc = new UserService(apiService);
                setUserService(userSvc);
            });
        }
    }, [socket, token]);    // Load users and recent chats
    useEffect(() => {
        if (userService && chatService) {
            const loadData = async () => {
                try {
                    // Load all users
                    const users = await userService.getUsers();
                    const otherUsers = users.filter(u => u.auth0Id !== user?.userId);
                    setAllUsers(otherUsers);

                    // Get list of users with chat history
                    const recentChatsResponse = await chatService.getRecentChats();
                    const usersWithChats = recentChatsResponse.map(chat => {
                        const userInfo = otherUsers.find(u => u.auth0Id === chat.userId);
                        return {
                            ...userInfo,
                            lastMessage: chat.lastMessage,
                            lastMessageTime: chat.timestamp
                        };
                    });
                    setRecentChats(usersWithChats);
                } catch (error) {
                    console.error('Failed to load users or recent chats:', error);
                }
            };

            loadData();
        }
    }, [userService, chatService, user?.userId]);

    // Load messages for selected contact
    useEffect(() => {
        if (chatService && selectedContact) {
            const loadMessages = async () => {
                const history = await chatService.getConversation(selectedContact.auth0Id);
                setMessages(history.reverse());
            };

            loadMessages();

            // Register message handler
            const unregisterHandler = chatService.registerMessageHandler(
                selectedContact.auth0Id,
                (message, from, timestamp, messageId) => {
                    setMessages(prev => [
                        ...prev,
                        {
                            _id: messageId,
                            content: message,
                            sender: from,
                            timestamp,
                            read: true
                        }
                    ]);
                }
            );

            // Clean up
            return () => {
                unregisterHandler();
            };
        }
    }, [chatService, selectedContact]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleContactSelect = (contact) => {
        setSelectedContact(contact);
        setMessages([]);
    };
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedContact || !chatService) {
            return;
        }

        try {
            const messageData = await chatService.sendMessage(selectedContact.auth0Id, newMessage);

            // Add to local messages
            setMessages(prev => [
                ...prev,
                {
                    _id: messageData.messageId,
                    content: newMessage,
                    sender: user.userId,
                    timestamp: messageData.timestamp,
                    read: false
                }
            ]);

            setNewMessage('');
        } catch (error) {
            // Handle error (you might want to show a notification)
            console.error('Failed to send message:', error);
        }
    };

    const handleFileUpload = async (event) => {
        if (!chatService || !selectedContact) return;

        const file = event.target.files[0];
        if (!file) return;

        try {
            const response = await chatService.uploadAttachment(
                selectedContact.auth0Id,
                file
            );

            // Add to local messages
            setMessages(prev => [
                ...prev,
                {
                    _id: response._id,
                    content: response.content,
                    sender: user.userId,
                    timestamp: response.timestamp,
                    attachments: response.attachments,
                    read: false
                }
            ]);
        } catch (error) {
            console.error('File upload failed:', error);
        }

        // Reset file input
        event.target.value = null;
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Handle emoji click
    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
        setAnchorEl(null);
    };

    // Handle emoji button click
    const handleEmojiButtonClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    // Handle emoji picker close
    const handleEmojiPickerClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', p: 3, gap: 3 }}>
            {/* Contacts sidebar */}
            <Paper
                sx={{
                    width: 380,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: (theme) => theme.shadows[3],
                    display: 'flex',
                    flexDirection: 'column',
                }}
                elevation={0}
            >
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Messages
                    </Typography>
                </Box>
                <List sx={{ flex: 1, overflow: 'auto', px: 2 }}>
                    {allUsers.map((contact) => (
                        <Paper
                            key={contact.auth0Id}
                            elevation={selectedContact?.auth0Id === contact.auth0Id ? 1 : 0}
                            sx={{
                                my: 1,
                                transition: 'all 0.2s ease',
                                borderRadius: 2,
                                bgcolor: selectedContact?.auth0Id === contact.auth0Id ? 'action.selected' : 'transparent',
                                '&:hover': {
                                    bgcolor: selectedContact?.auth0Id === contact.auth0Id ? 'action.selected' : 'action.hover',
                                    transform: 'translateY(-1px)',
                                    boxShadow: (theme) => theme.shadows[2],
                                },
                            }}
                        >
                            <ListItem
                                button
                                onClick={() => handleContactSelect(contact)}
                                sx={{ 
                                    p: 2,
                                    borderRadius: 2,
                                }}
                            >
                                <ListItemAvatar>
                                    <Badge
                                        overlap="circular"
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                        variant="dot"
                                        color={isUserOnline(contact.auth0Id) ? 'success' : 'error'}
                                    >
                                        <Avatar 
                                            alt={contact.name} 
                                            src={contact.picture}
                                            sx={{ 
                                                width: 48, 
                                                height: 48,
                                                border: '2px solid',
                                                borderColor: (theme) => 
                                                    isUserOnline(contact.auth0Id) 
                                                        ? 'success.light' 
                                                        : 'transparent'
                                            }}
                                        />
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={contact.name}
                                    secondary={contact.email}
                                    primaryTypographyProps={{
                                        variant: 'subtitle1',
                                        fontWeight: selectedContact?.auth0Id === contact.auth0Id ? 600 : 400
                                    }}
                                    sx={{ ml: 2 }}
                                />
                            </ListItem>
                        </Paper>
                    ))}
                </List>
            </Paper>

            {/* Chat area */}
            <Box 
                sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: (theme) => theme.shadows[3],
                    minWidth: 0, // Prevents flex item from overflowing
                }}
            >
                {selectedContact ? (
                    <>
                        {/* Chat header */}
                        <Box
                            sx={{
                                p: 3,
                                borderBottom: 1,
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                                color={isUserOnline(selectedContact.auth0Id) ? 'success' : 'error'}
                            >
                                <Avatar 
                                    alt={selectedContact.name} 
                                    src={selectedContact.picture}
                                    sx={{ 
                                        width: 48, 
                                        height: 48,
                                        border: '2px solid',
                                        borderColor: (theme) => 
                                            isUserOnline(selectedContact.auth0Id) 
                                                ? 'success.light' 
                                                : 'transparent'
                                    }}
                                />
                            </Badge>
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {selectedContact.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {isUserOnline(selectedContact.auth0Id) ? 'Online' : 'Offline'}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Messages */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                bgcolor: (theme) => theme.palette.mode === 'dark' 
                                    ? 'background.default' 
                                    : grey[50],
                            }}
                        >
                            {messages.map((message) => {
                                const isOwnMessage = message.sender === user.userId;
                                const hasAttachment = message.attachments && message.attachments.length > 0;

                                return (
                                    <Box
                                        key={message._id}
                                        sx={{
                                            alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                                            maxWidth: '70%',
                                            mb: 2
                                        }}
                                    >
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 2,
                                                bgcolor: isOwnMessage 
                                                    ? 'primary.main'
                                                    : 'background.paper',
                                                color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                                                borderRadius: 3,
                                                boxShadow: (theme) => theme.shadows[1],
                                            }}
                                        >
                                            {hasAttachment && (
                                                <Box sx={{ mb: 1 }}>
                                                    {message.attachments[0].type === 'image' ? (
                                                        <Box
                                                            component="img"
                                                            src={`http://localhost:5000${message.attachments[0].url}`}
                                                            alt="attachment"
                                                            loading="lazy"
                                                            sx={{
                                                                maxWidth: '100%',
                                                                maxHeight: '300px',
                                                                objectFit: 'contain',
                                                                borderRadius: 1,
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => window.open(`http://localhost:5000${message.attachments[0].url}`, '_blank')}
                                                        />
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                p: 1,
                                                                borderRadius: 1,
                                                                bgcolor: 'rgba(0,0,0,0.04)'
                                                            }}
                                                        >
                                                            <FileIcon sx={{ mr: 1 }} />
                                                            <Typography variant="body2">
                                                                {message.attachments[0].name}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                            <Typography variant="body1">{message.content}</Typography>
                                        </Paper>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                                mt: 0.5
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                {formatTime(message.timestamp)}
                                                {isOwnMessage && (
                                                    <span style={{ marginLeft: '4px' }}>
                                                        {message.read ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* Message input */}
                        <Box
                            component="form"
                            sx={{
                                p: 3,
                                borderTop: 1,
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                bgcolor: 'background.paper',
                            }}
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                        >
                            <IconButton
                                color="primary"
                                component="label"
                                size="large"
                            >
                                <ImageIcon />
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                            </IconButton>
                            <TextField
                                fullWidth
                                placeholder="Type a message"
                                variant="outlined"
                                size="medium"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                    }
                                }}
                            />
                            <IconButton
                                color="primary"
                                onClick={handleEmojiButtonClick}
                                size="large"
                            >
                                <EmojiIcon />
                            </IconButton>
                            <IconButton
                                color="primary"
                                disabled={!newMessage.trim()}
                                onClick={handleSendMessage}
                                size="large"
                                sx={{
                                    bgcolor: newMessage.trim() ? 'primary.main' : 'transparent',
                                    color: newMessage.trim() ? 'primary.contrastText' : 'inherit',
                                    '&:hover': {
                                        bgcolor: newMessage.trim() ? 'primary.dark' : 'action.hover',
                                    },
                                }}
                            >
                                <SendIcon />
                            </IconButton>
                            <Popover
                                open={Boolean(anchorEl)}
                                anchorEl={anchorEl}
                                onClose={handleEmojiPickerClose}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                            >
                                <Box sx={{ p: 1 }}>
                                    <EmojiPicker onEmojiClick={onEmojiClick} />
                                </Box>
                            </Popover>
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
                        }}
                    >
                        <SendIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="h6" color="text.secondary">
                            Select a contact to start chatting
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
