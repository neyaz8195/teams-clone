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
    }, contacts: [{
        userId: {
            type: String,  // Changed from ObjectId to String since we're using Auth0 IDs
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

userSchema.methods.addContact = async function (auth0Id) {
    // Get user by auth0Id
    const contactUser = await this.constructor.findOne({ auth0Id });

    if (!contactUser) {
        throw new Error('Contact user not found');
    }    // Check if contact already exists
    const contactExists = this.contacts.find(contact =>
        contact.userId === auth0Id
    );

    if (contactExists) {
        return false;
    }

    // Add contact
    this.contacts.push({
        userId: auth0Id,
        status: 'pending'
    });

    await this.save();
    return true;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
