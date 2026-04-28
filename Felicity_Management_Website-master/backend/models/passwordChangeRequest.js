const mongoose = require('mongoose');

const passwordChangeRequestSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizers',
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    generatedPassword: {
      type: String,
      default: null, // Set on approval
    },
    adminComments: {
      type: String,
      default: '', // Set on rejection
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PasswordChangeRequest', passwordChangeRequestSchema);
