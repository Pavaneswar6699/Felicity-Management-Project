const mongoose = require('mongoose');

// Define the form response subdocument schema
const formResponseSchema = new mongoose.Schema({
    fieldId: {
        type: String,
        required: false
    },
    label: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    }
}, { _id: false }); // Don't create _id for subdocuments

const registrationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Events',
        required: true
    },
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participants',
        required: true
    },
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    qrCode: {
        type: String
    },
    attended: {
        type: Boolean,
        default: false
    },
    attendedAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    formResponses: [formResponseSchema]
}, { timestamps: true });

// Compound unique index to prevent duplicate registrations
registrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
