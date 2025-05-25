import apiService from './ApiService';

export class UserService {
    constructor(apiService) {
        this.api = apiService;
    }

    // Get all users
    async getUsers() {
        try {
            return await this.api.get('/api/users');
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
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
    }

    // Add contact
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
            return await this.api.get('/api/users/contacts');
        } catch (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
    }
}

export default UserService;
