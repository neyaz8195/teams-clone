const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    auth0Id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    picture: {
        type: String
    },
    status: {
        type: String,
        enum: ['online', 'away', 'busy', 'offline'],
        default: 'offline'
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    contacts: [{
        userId: {
            type: String,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'blocked'],
            default: 'pending'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Methods
userSchema.statics.findByAuth0Id = function (auth0Id) {
    return this.findOne({ auth0Id });
};

userSchema.statics.getUserContacts = function (userId) {
    return this.findOne({ auth0Id: userId })
        .select('contacts')
        .then(user => {
            if (!user) return [];
            return user.contacts;
        });
};

userSchema.methods.addContact = async function (contactId) {
    // Check if contact already exists
    const contactExists = this.contacts.find(contact =>
        contact.userId === contactId
    );

    if (contactExists) {
        return false;
    }

    // Add contact
    this.contacts.push({
        userId: contactId,
        status: 'pending'
    });

    await this.save();
    return true;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
