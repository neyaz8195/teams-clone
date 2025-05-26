const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    sender: {
        type: String,
        required: true,
        index: true
    },
    recipient: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    attachments: [{
        type: {
            type: String,
            enum: ['image', 'file']
        },
        url: String,
        name: String,
        size: Number,
        mimeType: String
    }]
});

// Compound index for faster conversation queries
messageSchema.index({ sender: 1, recipient: 1 });

// Methods
messageSchema.statics.getConversation = async function (user1, user2, limit = 50, skip = 0) {
    const query = {
        $or: [
            { sender: user1, recipient: user2 },
            { sender: user2, recipient: user1 }
        ]
    };

    return this.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
};

messageSchema.statics.markAsRead = async function (messageIds, userId) {
    return this.updateMany(
        {
            messageId: { $in: messageIds },
            recipient: userId,
            read: false
        },
        {
            $set: {
                read: true,
                readAt: new Date()
            }
        }
    );
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
