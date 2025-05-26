import apiService from './ApiService';

export class UserService {
    constructor(apiServiceInstance = apiService) {
        this.api = apiServiceInstance;
    }    // Get all users
    async getUsers() {
        try {
            const users = await this.api.get('/api/users');
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error; // Re-throw to allow proper error handling
        }
    }

    // Get user by ID
    async getUserById(userId) {
        try {
            return await this.api.get(`/api/users/${userId}`);
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    // Update user status
    async updateStatus(status) {
        try {
            return await this.api.put('/api/users/status', { status });
        } catch (error) {
            console.error('Error updating status:', error);
            return { error: 'Failed to update status' };
        }
    }    // Add contact
    async addContact(contactId) {
        try {
            return await this.api.post('/api/users/contacts', { contactId });
        } catch (error) {
            console.error('Error adding contact:', error);
            return { error: 'Failed to add contact' };
        }
    }

    // Get user contacts
    async getContacts() {
        try {
            console.log('Making request to /api/users/contacts');
            const contacts = await this.api.get('/api/users/contacts');
            console.log('Received contacts:', contacts);
            return contacts;
        } catch (error) {
            console.error('Error fetching contacts:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw error; // Re-throw to allow proper error handling
        }
    }
}

export default UserService;
