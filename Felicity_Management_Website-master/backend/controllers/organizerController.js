const Organizer = require('../models/Organizers');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const PasswordChangeRequest = require('../models/passwordChangeRequest');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.SECRET_JWT_KEY, { expiresIn: '3d' });
}

// login organizer
const loginOrganizer = async (req, res) => {
    const { email, password } = req.body;
    try {
        const organizer = await Organizer.login(email, password);
        const token = createToken(organizer._id);

        res.status(200).json({ email, token, organizerName: organizer.organizerName, organizer });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get current organizer profile
const getOrganizerProfile = async (req, res) => {
    const organizerId = req.Organizer._id;
    try {
        const organizer = await Organizer.findById(organizerId).select('-password');
        if (!organizer) {
            return res.status(404).json({ error: 'Organizer not found' });
        }
        res.status(200).json(organizer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// update organizer profile
const updateOrganizerProfile = async (req, res) => {
    const organizerId = req.Organizer._id;
    const { organizerName, category, description, contactEmail, mobileNo, discordWebhookUrl } = req.body;

    try {
        const organizer = await Organizer.findById(organizerId);
        if (!organizer) {
            return res.status(404).json({ error: 'Organizer not found' });
        }

        // update fields
        if (organizerName) organizer.organizerName = organizerName;
        if (category) organizer.category = category;
        if (description !== undefined) organizer.description = description;
        if (contactEmail !== undefined) {
            const normalizedContactEmail = String(contactEmail).trim().toLowerCase();
            if (!normalizedContactEmail) {
                return res.status(400).json({ error: 'Contact email is required' });
            }
            if (!isValidEmail(normalizedContactEmail)) {
                return res.status(400).json({ error: 'Invalid contact email format' });
            }
            organizer.contactEmail = normalizedContactEmail;
        }
        if (mobileNo !== undefined) organizer.mobileNo = String(mobileNo);
        if (discordWebhookUrl !== undefined) {
            if (discordWebhookUrl && !discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
                return res.status(400).json({ error: 'Discord Webhook URL must start with https://discord.com/api/webhooks/' });
            }
            organizer.discordWebhookUrl = discordWebhookUrl;
        }

        await organizer.save();

        // return without password
        const updatedOrganizer = await Organizer.findById(organizerId).select('-password');
        res.status(200).json(updatedOrganizer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// request password reset (creates a request for admin approval)
const requestPasswordChange = async (req, res) => {
    const organizerId = req.Organizer._id;
    const { reason } = req.body;

    try {
        // Get organizer for verification
        const organizer = await Organizer.findById(organizerId);
        if (!organizer) {
            return res.status(404).json({ error: 'Organizer not found' });
        }

        // Check if organizer already has a pending request
        const existingRequest = await PasswordChangeRequest.findOne({
            organizerId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ error: 'You already have a pending password reset request' });
        }

        // Create password reset request
        const request = new PasswordChangeRequest({
            organizerId,
            reason: reason || 'Password reset requested',
            status: 'pending'
        });

        await request.save();
        res.status(200).json({ message: 'Password reset request submitted for admin approval', requestId: request._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get password change requests for current organizer
const getPasswordChangeRequests = async (req, res) => {
    const organizerId = req.Organizer._id;
    try {
        const requests = await PasswordChangeRequest.find({ organizerId })
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = { loginOrganizer, getOrganizerProfile, updateOrganizerProfile, requestPasswordChange, getPasswordChangeRequests }