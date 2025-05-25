import { useState, useEffect, useRef } from 'react';
import { Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Paper, TextField, IconButton, Divider, Badge } from '@mui/material';
import { Send as SendIcon, InsertDriveFile as FileIcon, Image as ImageIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import ChatService from '../services/ChatService';
import UserService from '../services/UserService';

export default function ChatPage() {
    const { user, token } = useAuth();
    const { socket, isUserOnline } = useSocket();
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatService, setChatService] = useState(null);
    const [userService, setUserService] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
    }, [socket, token]);

    // Load contacts
    useEffect(() => {
        if (userService) {
            const loadContacts = async () => {
                try {
                    const users = await userService.getUsers();
                    setContacts(users);
                } catch (error) {
                    console.error('Failed to load contacts:', error);
                }
            };

            loadContacts();
        }
    }, [userService]);

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

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedContact || !chatService) {
            return;
        }

        const messageData = chatService.sendMessage(selectedContact.auth0Id, newMessage);

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

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Contacts sidebar */}
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
                    Contacts
                </Typography>
                <List>
                    {contacts.map((contact) => (
                        <ListItem
                            key={contact.auth0Id}
                            button
                            selected={selectedContact?.auth0Id === contact.auth0Id}
                            onClick={() => handleContactSelect(contact)}
                            divider
                        >
                            <ListItemAvatar>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    variant="dot"
                                    color={isUserOnline(contact.auth0Id) ? 'success' : 'error'}
                                >
                                    <Avatar alt={contact.name} src={contact.picture} />
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primary={contact.name}
                                secondary={
                                    <Typography noWrap variant="body2" color="text.secondary">
                                        {contact.email}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Chat area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedContact ? (
                    <>
                        {/* Chat header */}
                        <Box
                            sx={{
                                p: 2,
                                borderBottom: 1,
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                                color={isUserOnline(selectedContact.auth0Id) ? 'success' : 'error'}
                            >
                                <Avatar alt={selectedContact.name} src={selectedContact.picture} />
                            </Badge>
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h6">{selectedContact.name}</Typography>
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
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column'
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
                                                bgcolor: isOwnMessage ? 'primary.light' : 'grey.100',
                                                color: isOwnMessage ? 'white' : 'inherit',
                                                borderRadius: 2
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
                                p: 2,
                                borderTop: 1,
                                borderColor: 'divider',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                        >
                            <IconButton
                                color="primary"
                                component="label"
                                sx={{ mr: 1 }}
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
                                size="small"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <IconButton
                                color="primary"
                                sx={{ ml: 1 }}
                                disabled={!newMessage.trim()}
                                onClick={handleSendMessage}
                            >
                                <SendIcon />
                            </IconButton>
                        </Box>
                    </>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}
                    >
                        <Typography variant="h6" color="text.secondary">
                            Select a contact to start chatting
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
