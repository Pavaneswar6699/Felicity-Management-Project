const mongoose = require('mongoose');
const ForumMessage = require('../models/forumMessages');
const Events = require('../models/Events');
const Registration = require('../models/registrations');
const Participant = require('../models/Participants');
const Organizer = require('../models/Organizers');

const getAuthUser = async (req) => {
    if (req.Participant?._id) {
        const participant = await Participant.findById(req.Participant._id).select('firstName lastName');
        const fullName = [participant?.firstName, participant?.lastName].filter(Boolean).join(' ').trim();
        return {
            userType: 'participant',
            userId: req.Participant._id,
            displayName: fullName || 'Participant'
        };
    }

    if (req.Organizer?._id) {
        const organizer = await Organizer.findById(req.Organizer._id).select('organizerName');
        return {
            userType: 'organizer',
            userId: req.Organizer._id,
            displayName: organizer?.organizerName || 'Organizer'
        };
    }

    return null;
};

const ensureValidEventId = (eventId, res) => {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(404).json({ error: 'Invalid event ID' });
        return false;
    }
    return true;
};

const canOrganizerModerateEvent = async (eventId, organizerId) => {
    const event = await Events.findOne({ _id: eventId, organizerID: organizerId }).select('_id');
    return !!event;
};

const canParticipantPostToEvent = async (eventId, participantId) => {
    const registration = await Registration.findOne({
        eventId,
        participantId,
        status: { $ne: 'rejected' }
    }).select('_id');
    return !!registration;
};

const normalizeObjectIdInput = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        if (value._id) return String(value._id);
        if (value.$oid) return String(value.$oid);
    }
    return String(value);
};

const shapeMessage = (message, currentUser) => {
    const reactionSummary = message.reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
    }, {});

    const reactedByCurrentUser = message.reactions.some(
        (reaction) =>
            reaction.userType === currentUser.userType
            && String(reaction.userId) === String(currentUser.userId)
    );

    return {
        _id: String(message._id),
        eventId: String(message.eventId),
        authorType: message.authorType,
        authorName: message.authorName,
        messageType: message.messageType,
        content: message.content,
        parentMessageId: message.parentMessageId ? String(message.parentMessageId) : null,
        isPinned: message.isPinned,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        reactionSummary,
        reactedByCurrentUser
    };
};

const emitForumUpdate = (req, eventId, action, messageId = null) => {
    const io = req.app.get('io');
    if (!io) return;
    io.to(`forum:${String(eventId)}`).emit('forum:updated', {
        eventId: String(eventId),
        action,
        messageId: messageId ? String(messageId) : null
    });
};

const getForumMessages = async (req, res) => {
    const { eventId } = req.params;
    if (!ensureValidEventId(eventId, res)) return;

    try {
        const currentUser = await getAuthUser(req);
        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (currentUser.userType === 'organizer') {
            const canModerate = await canOrganizerModerateEvent(eventId, currentUser.userId);
            if (!canModerate) {
                return res.status(403).json({ error: 'Not authorized for this event' });
            }
        }

        const messages = await ForumMessage.find({ eventId })
            .sort({ isPinned: -1, createdAt: 1 });

        res.status(200).json(messages.map((message) => shapeMessage(message, currentUser)));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createForumMessage = async (req, res) => {
    const { eventId } = req.params;
    const { content, messageType, parentMessageId } = req.body;
    if (!ensureValidEventId(eventId, res)) return;

    if (!content || !String(content).trim()) {
        return res.status(400).json({ error: 'Message content is required' });
    }

    try {
        const currentUser = await getAuthUser(req);
        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (currentUser.userType === 'participant') {
            const canPost = await canParticipantPostToEvent(eventId, currentUser.userId);
            if (!canPost) {
                return res.status(403).json({ error: 'Only registered participants can post in this forum' });
            }
        }

        if (currentUser.userType === 'organizer') {
            const canModerate = await canOrganizerModerateEvent(eventId, currentUser.userId);
            if (!canModerate) {
                return res.status(403).json({ error: 'Not authorized for this event' });
            }
        }

        const normalizedMessageType = currentUser.userType === 'participant'
            ? (messageType === 'question' ? 'question' : 'message')
            : (['message', 'question', 'announcement'].includes(messageType) ? messageType : 'message');

        let parentId = null;
        const normalizedParentMessageId = normalizeObjectIdInput(parentMessageId);
        if (normalizedParentMessageId) {
            if (!mongoose.Types.ObjectId.isValid(normalizedParentMessageId)) {
                return res.status(400).json({ error: 'Invalid parent message ID' });
            }

            const parentMessage = await ForumMessage.findOne({
                _id: normalizedParentMessageId,
                eventId
            }).select('_id');

            if (!parentMessage) {
                return res.status(404).json({ error: 'Parent message not found' });
            }

            parentId = parentMessage._id;
        }

        const message = await ForumMessage.create({
            eventId,
            authorType: currentUser.userType,
            authorId: currentUser.userId,
            authorName: currentUser.displayName,
            messageType: normalizedMessageType,
            content: String(content).trim(),
            parentMessageId: parentId
        });

        emitForumUpdate(req, eventId, 'created', message._id);

        res.status(201).json(shapeMessage(message, currentUser));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const toggleReaction = async (req, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(404).json({ error: 'Invalid message ID' });
    }

    if (!emoji || !String(emoji).trim()) {
        return res.status(400).json({ error: 'Emoji is required' });
    }

    try {
        const currentUser = await getAuthUser(req);
        if (!currentUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const message = await ForumMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (currentUser.userType === 'organizer') {
            const canModerate = await canOrganizerModerateEvent(message.eventId, currentUser.userId);
            if (!canModerate) {
                return res.status(403).json({ error: 'Not authorized for this event' });
            }
        }

        const normalizedEmoji = String(emoji).trim();
        const existingIndex = message.reactions.findIndex(
            (reaction) =>
                reaction.emoji === normalizedEmoji
                && reaction.userType === currentUser.userType
                && String(reaction.userId) === String(currentUser.userId)
        );

        if (existingIndex >= 0) {
            message.reactions.splice(existingIndex, 1);
        } else {
            message.reactions.push({
                emoji: normalizedEmoji,
                userType: currentUser.userType,
                userId: currentUser.userId
            });
        }

        await message.save();
        emitForumUpdate(req, message.eventId, 'reaction', message._id);
        res.status(200).json(shapeMessage(message, currentUser));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const togglePinForumMessage = async (req, res) => {
    const { eventId, messageId } = req.params;
    if (!ensureValidEventId(eventId, res)) return;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(404).json({ error: 'Invalid message ID' });
    }

    try {
        const organizerId = req.Organizer?._id;
        if (!organizerId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const canModerate = await canOrganizerModerateEvent(eventId, organizerId);
        if (!canModerate) {
            return res.status(403).json({ error: 'Not authorized for this event' });
        }

        const message = await ForumMessage.findOne({ _id: messageId, eventId });
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        message.isPinned = !message.isPinned;
        await message.save();
        emitForumUpdate(req, eventId, 'pin', message._id);

        const currentUser = await getAuthUser(req);
        res.status(200).json(shapeMessage(message, currentUser));
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteForumMessage = async (req, res) => {
    const { eventId, messageId } = req.params;
    if (!ensureValidEventId(eventId, res)) return;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(404).json({ error: 'Invalid message ID' });
    }

    try {
        const organizerId = req.Organizer?._id;
        if (!organizerId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const canModerate = await canOrganizerModerateEvent(eventId, organizerId);
        if (!canModerate) {
            return res.status(403).json({ error: 'Not authorized for this event' });
        }

        const message = await ForumMessage.findOneAndDelete({ _id: messageId, eventId });
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        await ForumMessage.deleteMany({ parentMessageId: messageId, eventId });
        emitForumUpdate(req, eventId, 'deleted', messageId);

        res.status(200).json({ message: 'Forum message deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getForumMessages,
    createForumMessage,
    toggleReaction,
    togglePinForumMessage,
    deleteForumMessage
};
