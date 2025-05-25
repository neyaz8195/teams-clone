import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    IconButton,
    InputAdornment,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Badge,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    PersonAdd as PersonAddIcon,
    Chat as ChatIcon,
    VideoCall as VideoCallIcon,
    MoreVert as MoreVertIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import UserService from '../services/UserService';

export default function ContactsPage() {
    const { user } = useAuth();
    const { isUserOnline } = useSocket();
    const navigate = useNavigate();

    const [userService, setUserService] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Notification state
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Initialize services
    useEffect(() => {
        if (user) {
            import('../services/ApiService').then((module) => {
                const apiService = module.default;
                apiService.setToken(user.token);

                const userSvc = new UserService(apiService);
                setUserService(userSvc);
            });
        }
    }, [user]);
    // Load contacts and users
    useEffect(() => {
        if (userService) {
            const fetchData = async () => {
                await loadContacts();
                await loadAllUsers();
            };

            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userService]);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const contactsList = await userService.getContacts();
            setContacts(contactsList);
        } catch (err) {
            console.error('Failed to load contacts:', err);
            setNotification({
                open: true,
                message: 'Failed to load contacts',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadAllUsers = async () => {
        try {
            const usersList = await userService.getUsers();
            setAllUsers(usersList);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleAddContact = (user) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedUser(null);
    };

    const handleConfirmAdd = async () => {
        if (!selectedUser || !userService) return;

        try {
            await userService.addContact(selectedUser.auth0Id);

            // Reload contacts
            loadContacts();

            setNotification({
                open: true,
                message: `${selectedUser.name} added to contacts`,
                severity: 'success'
            });
        } catch (err) {
            console.error('Failed to add contact:', err);
            setNotification({
                open: true,
                message: 'Failed to add contact',
                severity: 'error'
            });
        }

        handleCloseDialog();
    };

    const handleStartChat = (contactId) => {
        navigate('/chat', { state: { contactId } });
    };

    const handleStartCall = (contactId) => {
        navigate('/calls', { state: { contactId } });
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    // Filter contacts by search query
    const filteredContacts = contacts.filter(contact => {
        const query = searchQuery.toLowerCase();
        return (
            contact.userId?.name?.toLowerCase().includes(query) ||
            contact.userId?.email?.toLowerCase().includes(query)
        );
    });

    // Filter users that are not already contacts
    const filteredUsers = allUsers.filter(u => {
        // Exclude current user
        if (u.auth0Id === user?.userId) return false;

        // Exclude users that are already contacts
        const isAlreadyContact = contacts.some(
            contact => contact.userId?.auth0Id === u.auth0Id
        );

        if (isAlreadyContact) return false;

        // Filter by search query
        const query = searchQuery.toLowerCase();
        return (
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query)
        );
    });

    return (
        <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Contacts
            </Typography>

            {/* Search bar */}
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Search contacts or users..."
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            {/* My Contacts */}
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                <Typography variant="h6" component="h2" gutterBottom>
                    My Contacts
                </Typography>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredContacts.length > 0 ? (
                    <List>
                        {filteredContacts.map(contact => (
                            <Box key={contact.userId?._id || contact.userId?.auth0Id}>
                                <ListItem
                                    secondaryAction={
                                        <Box>
                                            <Tooltip title="Chat">
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleStartChat(contact.userId?.auth0Id)}
                                                >
                                                    <ChatIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Video Call">
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleStartCall(contact.userId?.auth0Id)}
                                                >
                                                    <VideoCallIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            variant="dot"
                                            color={isUserOnline(contact.userId?.auth0Id) ? 'success' : 'error'}
                                        >
                                            <Avatar alt={contact.userId?.name} src={contact.userId?.picture} />
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={contact.userId?.name}
                                        secondary={contact.userId?.email}
                                    />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                            </Box>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 2 }}>
                        {searchQuery ? 'No contacts match your search' : 'You have no contacts yet'}
                    </Typography>
                )}
            </Paper>

            {/* Add Contact Section */}
            {searchQuery && (
                <Paper sx={{ p: 3 }} elevation={2}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Add New Contacts
                    </Typography>

                    {filteredUsers.length > 0 ? (
                        <List>
                            {filteredUsers.map(user => (
                                <Box key={user.auth0Id}>
                                    <ListItem
                                        secondaryAction={
                                            <Button
                                                variant="outlined"
                                                startIcon={<PersonAddIcon />}
                                                onClick={() => handleAddContact(user)}
                                            >
                                                Add
                                            </Button>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Badge
                                                overlap="circular"
                                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                variant="dot"
                                                color={isUserOnline(user.auth0Id) ? 'success' : 'error'}
                                            >
                                                <Avatar alt={user.name} src={user.picture} />
                                            </Badge>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={user.name}
                                            secondary={user.email}
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </Box>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 2 }}>
                            No users match your search
                        </Typography>
                    )}
                </Paper>
            )}

            {/* Add Contact Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Add Contact</DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                            <Avatar
                                src={selectedUser.picture}
                                alt={selectedUser.name}
                                sx={{ width: 50, height: 50, mr: 2 }}
                            />
                            <Box>
                                <Typography variant="h6">{selectedUser.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedUser.email}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    <Typography variant="body1">
                        Do you want to add this user to your contacts?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleConfirmAdd}
                        color="primary"
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                    >
                        Add Contact
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}