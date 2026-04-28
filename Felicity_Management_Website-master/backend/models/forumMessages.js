const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    emoji: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ['participant', 'organizer'],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, { _id: false });

const forumMessageSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Events',
        required: true,
        index: true
    },
    authorType: {
        type: String,
        enum: ['participant', 'organizer'],
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['message', 'question', 'announcement'],
        default: 'message'
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    parentMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumMessages',
        default: null
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    reactions: {
        type: [reactionSchema],
        default: []
    }
}, { timestamps: true });

forumMessageSchema.index({ eventId: 1, createdAt: -1 });

module.exports = mongoose.model('ForumMessages', forumMessageSchema);
