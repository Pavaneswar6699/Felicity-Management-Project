const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Organizer = require('../models/Organizers');
const Events = require('../models/Events');
const Registration = require('../models/registrations');
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const PasswordChangeRequest = require('../models/passwordChangeRequest');
const { sendEmail } = require('../utils/emailService');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createToken = (_id) => {
    return jwt.sign({ _id, role: "admin" }, process.env.SECRET_JWT_KEY, { expiresIn: '3d' });
}

// login admin
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = createToken(admin._id);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// get all organizers
const getAllOrganizers = async (req, res) => {
    try {
        const allOrganizers = await Organizer.find().sort({ organizerName: 'asc' });
        res.status(200).json(allOrganizers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get organizer by id
const getOrganizer = async (req, res) => {
    const { id } = req.params;
    // verify if the id is a valid mongoose object id
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such organizer' });
    }
    try {
        const organizer = await Organizer.findOne({ _id: id });
        if (organizer) {
            res.status(200).json(organizer);
        } else {
            res.status(404).json({ error: 'Organizer not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// disable organizer by id
const disableOrganizer = async (req, res) => {
    const { id } = req.params;
    // verify if the id is a valid mongoose object id
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such organizer' });
    }
    try {
        const organizer = await Organizer.findOne({ _id: id });
        if (organizer) {
            await Organizer.updateOne({ _id: id }, { $set: { isDisabled: true } });
            res.status(200).json(organizer);
        } else {
            res.status(404).json({ error: 'Organizer not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// enable organizer by id
const enableOrganizer = async (req, res) => {
    const { id } = req.params;
    // verify if the id is a valid mongoose object id
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such organizer' });
    }
    try {
        const organizer = await Organizer.findOne({ _id: id });
        if (organizer) {
            await Organizer.updateOne({ _id: id }, { $set: { isDisabled: false } });
            res.status(200).json(organizer);
        } else {
            res.status(404).json({ error: 'Organizer not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// delete organizer by id
const deleteOrganizer = async (req, res) => {
    const { id } = req.params;
    // verify if the id is a valid mongoose object id
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such organizer' });
    }
    try {
        const organizerEventIds = await Events.find({ organizerID: id }, { _id: 1 });
        const eventIds = organizerEventIds.map((event) => event._id);

        const organizer = await Organizer.findOneAndDelete({ _id: id });
        if (organizer) {
            if (eventIds.length > 0) {
                await Registration.deleteMany({ eventId: { $in: eventIds } });
            }
            await Events.deleteMany({ organizerID: id });
            res.status(200).json(organizer);
        } else {
            res.status(404).json({ error: 'Organizer not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// create an organizer, random password is generated and given to organizer
const createOrganizer = async (req, res) => {
    const randomstring = Math.random().toString(36).substring(2, 10); // generate a random 8 character string for password
    const { organizerName, category, contactEmail } = req.body;

    if (!contactEmail) {
        return res.status(400).json({ error: 'Contact email is required' });
    }

    if (!isValidEmail(contactEmail)) {
        return res.status(400).json({ error: 'Invalid contact email format' });
    }

    if (!organizerName || !category) {
        return res.status(400).json({ error: 'All fields must be filled' });
    }
    const email = organizerName.split(' ').join('').toLowerCase() + '@org.iiit.ac.in'; // generate email from organizer name

    // check if email already exists
    const existingOrganizer = await Organizer.findOne({ email });
    if (existingOrganizer) {
        return res.status(400).json({ error: 'An organizer with this name already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomstring, salt);

    // adding organizer to organizers db
    try {
        const organizer = await Organizer.create({
            organizerName,
            email,
            password: hashedPassword,
            category,
            contactEmail: contactEmail.trim().toLowerCase()
        });
        // Send email to organizer
        const emailSent = await sendEmail({
            to: contactEmail.trim().toLowerCase(),
            subject: 'Your Organizer Account Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333; border-bottom: 2px solid #0056b3; padding-bottom: 10px;">Welcome, ${organizerName}!</h2>
                    <p style="color: #555; font-size: 16px;">Your organizer account has been successfully created by the Admin.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Login Email:</strong> <span style="color: #0056b3;">${email}</span></p>
                        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <span style="color: #d9534f; font-family: monospace; font-size: 16px;">${randomstring}</span></p>
                    </div>
                    <p style="color: #555; font-size: 16px;"><strong>Important:</strong> Please log in using these credentials and change your password immediately in your profile settings for security purposes.</p>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">Best regards,<br>Event Management Team</p>
                </div>
            `
        });

        res.status(200).json({
            _id: organizer._id,
            organizerName: organizer.organizerName,
            email: organizer.email,
            contactEmail: organizer.contactEmail,
            plainPassword: randomstring, // send the plain password to admin for sharing with organizer
            createdAt: organizer.createdAt,
            updatedAt: organizer.updatedAt,
            emailSent
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get all pending password change requests
const getPasswordChangeRequests = async (req, res) => {
    try {
        const requests = await PasswordChangeRequest.find({ status: 'pending' })
            .populate('organizerId', 'organizerName email')
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// approve password reset request - auto generates new password
const approvePasswordChange = async (req, res) => {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(404).json({ error: 'Invalid request ID' });
    }

    try {
        const request = await PasswordChangeRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: `Request is already ${request.status}` });
        }

        // Get organizer
        const organizer = await Organizer.findById(request.organizerId);
        if (!organizer) {
            return res.status(404).json({ error: 'Organizer not found' });
        }

        // Generate new random password
        const generatedPassword = Math.random().toString(36).substring(2, 10);

        // Hash the generated password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        // Update organizer password
        organizer.password = hashedPassword;
        await organizer.save();

        // Update request status with generated password
        request.status = 'approved';
        request.generatedPassword = hashedPassword; // store hashed password for security reasons
        request.approvedAt = new Date();
        await request.save();

        // Send email to organizer
        const emailSent = await sendEmail({
            to: organizer.contactEmail,
            subject: 'Your Password Reset Request Approved',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">Password Reset Approved</h2>
                    <p style="color: #555; font-size: 16px;">Hello ${organizer.organizerName},</p>
                    <p style="color: #555; font-size: 16px;">Your request to reset your password has been approved by the Admin.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>New Temporary Password:</strong> <span style="color: #d9534f; font-family: monospace; font-size: 16px;">${generatedPassword}</span></p>
                    </div>
                    <p style="color: #555; font-size: 16px;"><strong>Important:</strong> Please log in using this new password and change it immediately in your profile settings for security purposes.</p>
                    <p style="color: #888; font-size: 14px; margin-top: 30px;">Best regards,<br>Event Management Team</p>
                </div>
            `
        });

        res.status(200).json({
            message: 'Password reset approved',
            organizerName: organizer.organizerName,
            email: organizer.email,
            generatedPassword: generatedPassword, // Send plain password to admin
            request,
            emailSent
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// reject password reset request with comments
const rejectPasswordChange = async (req, res) => {
    const { requestId } = req.params;
    const { comments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(404).json({ error: 'Invalid request ID' });
    }

    try {
        const request = await PasswordChangeRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: `Request is already ${request.status}` });
        }

        // Update request status with rejection details
        request.status = 'rejected';
        request.adminComments = comments || 'Request rejected by admin';
        request.rejectedAt = new Date();
        await request.save();

        // Fetch organizer to get contact email
        const organizer = await Organizer.findById(request.organizerId);

        // Send email to organizer if found
        let emailSent = false;
        if (organizer && organizer.contactEmail) {
            emailSent = await sendEmail({
                to: organizer.contactEmail,
                subject: 'Password Reset Request Rejected',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">Password Reset Rejected</h2>
                        <p style="color: #555; font-size: 16px;">Hello ${organizer.organizerName},</p>
                        <p style="color: #555; font-size: 16px;">Your recent request to reset your password has been <strong>rejected</strong> by the Admin.</p>
                        <div style="background-color: #fff3f3; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #721c24;"><strong>Reason for Rejection:</strong><br>${request.adminComments}</p>
                        </div>
                        <p style="color: #555; font-size: 16px;">If you have any questions or need further assistance, please contact the admin directly.</p>
                        <p style="color: #888; font-size: 14px; margin-top: 30px;">Best regards,<br>Event Management Team</p>
                    </div>
                `
            });
        }

        res.status(200).json({ message: 'Password reset request rejected', request, emailSent });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get organizer password history
const getOrganizerPasswordHistory = async (req, res) => {
    const { organizerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
        return res.status(404).json({ error: 'Invalid organizer ID' });
    }

    try {
        const history = await PasswordChangeRequest.find({ organizerId })
            .populate('organizerId', 'organizerName email')
            .sort({ createdAt: -1 });

        res.status(200).json(history);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = { loginAdmin, getAllOrganizers, getOrganizer, createOrganizer, deleteOrganizer, disableOrganizer, enableOrganizer, getPasswordChangeRequests, approvePasswordChange, rejectPasswordChange, getOrganizerPasswordHistory };