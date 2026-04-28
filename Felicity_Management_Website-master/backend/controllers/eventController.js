const Events = require('../models/Events');
const Organizer = require('../models/Organizers');
const Registration = require('../models/registrations');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { sendEmail } = require('../utils/emailService');
const axios = require('axios');

// all event related controllers (db crud) are here and imported to organizer routes

// Helper function to check and update event status based on current date
const checkAndUpdateEventStatus = async (event) => {
    const now = new Date();
    let statusChanged = false;

    // If published and current time >= event start, transition to ongoing
    if (event.status === 'published' && now >= new Date(event.start)) {
        event.status = 'ongoing';
        statusChanged = true;
    }

    // If ongoing and current time > event end, transition to completed
    if (event.status === 'ongoing' && (event.end) && now > new Date(event.end)) {
        event.status = 'completed';
        statusChanged = true;
    }

    // Save if status changed
    if (statusChanged) {
        if (typeof event.save === 'function') {
            await event.save();
        } else {
            // Needed if event is a plain object
            await Events.findByIdAndUpdate(event._id, { status: event.status });
        }
    }

    return event;
}

// get all events under me
const getAllEvents = async (req, res) => {
    try {
        const allEvents = await Events.find({ organizerID: req.Organizer._id }).sort({ start: -1 });
        for (const event of allEvents) {
            await checkAndUpdateEventStatus(event);
        }
        res.status(200).json(allEvents);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get event by id
const getEvent = async (req, res) => {
    const { id } = req.params;
    // verify if the id is a valid mongoose object id
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such event' });
    }
    try {
        const event = await Events.findOne({ _id: id, organizerID: req.Organizer._id });
        await checkAndUpdateEventStatus(event);
        if (event) {
            res.status(200).json(event);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// create an event
const createEvent = async (req, res) => {
    const { name, description, type, eligibility, regDeadline, start, end, regLimit, regFee, tags, sizes, stock, purchaseLimit, itemDetails, formFields, customFields } = req.body;

    const organizerID = req.Organizer._id; // set the organizerID to the id of the authenticated organizer creating the event
    let emptyFields = [];
    if (!name) {
        emptyFields.push('name');
    }
    if (!type) {
        emptyFields.push('type');
    }
    if (!regDeadline) {
        emptyFields.push('regDeadline');
    }
    if (!start) {
        emptyFields.push('start');
    }
    if (!eligibility) {
        emptyFields.push('eligibility');
    }
    if (!end) {
        emptyFields.push('end');
    }
    if (emptyFields.length > 0) {
        return res.status(400).json({ error: 'Please fill in all the mandatory fields', emptyFields });
    }

    if (end && (new Date(end) < new Date(start) || new Date(end) < new Date(regDeadline))) {
        return res.status(400).json({ error: 'Event end time cannot be before start time or registration deadline' });
    }

    // adding event to events db
    try {
        const status = 'draft'; // default status before posting
        const eventData = {
            name,
            description,
            type,
            eligibility,
            regDeadline,
            start,
            end,
            regLimit,
            regFee,
            organizerID,
            tags,
            sizes,
            stock,
            purchaseLimit,
            itemDetails,
            formFields,
            customFields: Array.isArray(customFields) ? customFields : [],
            status
        };
        const event = await Events.create(eventData);
        res.status(200).json(event);
    } catch (error) {
        console.error('Create event error:', error);
        res.status(400).json({ error: error.message });
    }
}

// delete an event
const deleteEvent = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such event' });
    }
    try {
        const event = await Events.findOneAndDelete({ _id: id, organizerID: req.Organizer._id });
        if (event) {
            await Registration.deleteMany({ eventId: event._id });
            console.log("Event deleted successfully");
            res.status(200).json(event);
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// update event details
const updateEvent = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such event' });
    }
    try {
        // Fetch current event to check status
        const event = await Events.findOne({ _id: id, organizerID: req.Organizer._id });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const updateFields = { ...req.body };
        const currentStatus = event.status;

        // Block changing organizerID always
        if (updateFields.organizerID) {
            return res.status(400).json({ error: 'Cannot change organizer ID' });
        }

        // Block changing event type always
        if (updateFields.type) {
            return res.status(400).json({ error: 'Cannot change event type after creation' });
        }

        // Enforce update rules based on status
        if (currentStatus === 'draft') {
            // Allow all fields except organizerID and type (already blocked above)
            // No additional restrictions for draft
        } else if (currentStatus === 'published') {
            // Only allow: description, regDeadline (extend only), regLimit (increase only), status (only to 'ongoing')
            const allowedFields = ['description', 'regDeadline', 'regLimit', 'status'];
            const requestedFields = Object.keys(updateFields);

            // Check if any disallowed field is being updated
            const disallowedFields = requestedFields.filter(field => !allowedFields.includes(field));
            if (disallowedFields.length > 0) {
                return res.status(400).json({
                    error: `Cannot update these fields after publishing: ${disallowedFields.join(', ')}`
                });
            }

            // Validate regDeadline can only be extended
            if (updateFields.regDeadline !== undefined) {
                const newDeadline = new Date(updateFields.regDeadline);
                const oldDeadline = new Date(event.regDeadline);
                if (newDeadline < oldDeadline) {
                    return res.status(400).json({ error: 'Registration deadline can only be extended, not reduced' });
                }
            }

            // Validate regLimit increase only
            if (updateFields.regLimit !== undefined && updateFields.regLimit < event.regLimit) {
                return res.status(400).json({ error: 'Registration limit can only be increased after publishing' });
            }

            // Validate status change (can only change to 'ongoing')
            if (updateFields.status !== undefined) {
                if (updateFields.status !== 'ongoing' && updateFields.status !== 'published') {
                    return res.status(400).json({ error: 'Published events can only be changed to ongoing status' });
                }
            }

        } else if (currentStatus === 'ongoing') {
            // Only allow status field to transition to 'completed'
            const requestedFields = Object.keys(updateFields);
            if (requestedFields.length > 1 || (requestedFields.length === 1 && requestedFields[0] !== 'status')) {
                return res.status(400).json({ error: 'Only status can be updated for ongoing events' });
            }

            if (updateFields.status !== undefined) {
                if (updateFields.status !== 'completed' && updateFields.status !== 'ongoing') {
                    return res.status(400).json({ error: 'Ongoing events can only be changed to completed status' });
                }
            }

        } else if (currentStatus === 'completed') {
            // No fields editable
            return res.status(400).json({ error: 'Completed events cannot be edited' });
        }

        // Perform the update
        const updatedEvent = await Events.findOneAndUpdate({ _id: id, organizerID: req.Organizer._id }, { ...updateFields }, { new: true });
        res.status(200).json({ msg: 'Event updated successfully', event: updatedEvent });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const publishEvent = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'No such event' });
    }
    try {
        const event = await Events.findOneAndUpdate({ _id: id, organizerID: req.Organizer._id }, { status: 'published' }, { new: true });
        if (event) {
            try {
                const organizer = await Organizer.findById(req.Organizer._id);
                if (organizer && organizer.discordWebhookUrl) {
                    const embed = {
                        "title": event.name,
                        "description": event.description || "New event published!",
                        "color": 5814783,
                        "fields": [
                            { "name": "Type", "value": event.type, "inline": true },
                            { "name": "Start", "value": new Date(event.start).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), "inline": true },
                            { "name": "End", "value": event.end ? new Date(event.end).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : "N/A", "inline": true }
                        ]
                    };

                    axios.post(organizer.discordWebhookUrl, { embeds: [embed] }).catch(err => {
                        console.error('Discord webhook failed:', err.message);
                    });
                }
            } catch (webhookErr) {
                console.error('Error preparing webhook:', webhookErr.message);
            }

            res.status(200).json({ msg: 'Event published successfully', event });
        } else {
            res.status(404).json({ error: 'Event not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const getEventAnalytics = async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ error: 'Invalid event ID' });
    }

    try {
        // Validate event exists and belongs to organizer
        let event = await Events.findOne({ _id: eventId, organizerID: req.Organizer._id });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check and update event status based on current date
        event = await checkAndUpdateEventStatus(event);

        // Fetch all registrations for this event
        const registrations = await Registration.find({ eventId: eventId });

        const activeRegistrations = registrations.filter(r => r.status !== 'rejected');

        // Count statistics
        const totalRegistrations = activeRegistrations.length;
        const attendedCount = activeRegistrations.filter(r => r.attended).length;
        const notAttendedCount = totalRegistrations - attendedCount;

        // Calculate revenue
        let revenue = 0;
        if (event.regFee) {
            revenue = activeRegistrations.reduce((sum, reg) => {
                if (reg.status === 'accepted') {
                    return sum + (reg.quantity * event.regFee);
                }
                return sum;
            }, 0);
        }

        res.status(200).json({
            totalRegistrations,
            attendedCount,
            notAttendedCount,
            revenue,
            eventStatus: event.status
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const scanTicket = async (req, res) => {
    const { eventId } = req.params;
    const { ticketId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ error: 'Invalid event ID' });
    }

    if (!ticketId) {
        return res.status(400).json({ error: 'Ticket ID is required' });
    }

    try {
        // Validate event belongs to organizer
        let event = await Events.findOne({ _id: eventId, organizerID: req.Organizer._id });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check and update event status based on current date
        event = await checkAndUpdateEventStatus(event);

        // Find registration by eventId and ticketId
        const registration = await Registration.findOne({ eventId: eventId, ticketId: ticketId });
        if (!registration) {
            return res.status(404).json({ error: 'Ticket not found for this event' });
        }

        // Check if already attended
        if (registration.attended) {
            return res.status(400).json({ error: 'Ticket already scanned' });
        }

        // Mark as attended
        registration.attended = true;
        registration.attendedAt = new Date();
        await registration.save();

        res.status(200).json({ message: 'Attendance marked successfully', eventStatus: event.status });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const exportRegistrations = async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ error: 'Invalid event ID' });
    }

    try {
        // Validate event belongs to organizer
        const event = await Events.findOne({ _id: eventId, organizerID: req.Organizer._id });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Fetch registrations with populated participant data
        const registrations = await Registration.find({ eventId: eventId })
            .populate('participantId', 'firstName lastName email');

        // Generate CSV header
        let csv = 'First Name,Last Name,Email,Ticket ID,Quantity,Attended,Payment Status,Organizer\n';

        const getOrganizerName = await Organizer.findById(event.organizerID).select('organizerName');
        const organizerName = getOrganizerName?.organizerName || '';

        // Generate CSV rows
        registrations.forEach(reg => {
            const firstName = reg.participantId?.firstName || '';
            const lastName = reg.participantId?.lastName || '';
            const email = reg.participantId?.email || '';
            const ticketId = reg.ticketId || '';
            const quantity = reg.quantity || 1;
            const attended = reg.attended ? 'Yes' : 'No';
            const paymentStatus = event.regFee > 0 ? 'Paid' : 'Free';

            csv += `${firstName},${lastName},${email},${ticketId},${quantity},${attended},${paymentStatus},${organizerName}\n`;
        });

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="event_registrations.csv"');

        res.status(200).send(csv);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const getEventRegistrations = async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ error: 'Invalid event ID' });
    }

    try {
        // Validate event exists and belongs to organizer
        const event = await Events.findOne({ _id: eventId, organizerID: req.Organizer._id });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Fetch all registrations with participant details
        const registrations = await Registration.find({ eventId: eventId })
            .populate('participantId', 'firstName lastName email');

        res.status(200).json(registrations);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// Get form responses for an event (normal events only)
const getEventFormResponses = async (req, res) => {
    const { eventId } = req.params;
    const organizerId = req.Organizer._id;

    try {
        // Validate eventId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(404).json({ error: 'No such event' });
        }

        // Find event
        const event = await Events.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Verify ownership
        if (event.organizerID.toString() !== organizerId.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Only allow form responses for normal events
        if (event.type !== 'normal') {
            return res.status(400).json({ error: 'Form responses are only available for normal events' });
        }

        // Get registrations with form responses
        const registrations = await Registration.find({ eventId })
            .populate('participantId', 'firstName lastName email')
            .select('participantId formResponses createdAt');

        // Format response
        const responses = registrations
            .filter(reg => reg.formResponses && reg.formResponses.length > 0)
            .map(reg => ({
                registrationId: reg._id,
                participantName: reg.participantId ? `${reg.participantId.firstName} ${reg.participantId.lastName}` : 'N/A',
                participantEmail: reg.participantId ? reg.participantId.email : 'N/A',
                status: reg.status || 'pending',
                formResponses: reg.formResponses,
                submittedAt: reg.createdAt
            }));

        res.status(200).json({
            eventName: event.name,
            eventId: event._id,
            totalResponses: responses.length,
            responses: responses
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateRegistrationDecision = async (req, res, nextStatus) => {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
        return res.status(404).json({ error: 'Invalid registration ID' });
    }

    try {
        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        if (registration.status !== 'pending') {
            return res.status(400).json({ error: 'Registration is already reviewed' });
        }

        const event = await Events.findOne({ _id: registration.eventId, organizerID: req.Organizer._id });
        if (!event) {
            return res.status(403).json({ error: 'Unauthorized access to registration' });
        }

        if (nextStatus === 'rejected') {
            await Events.findOneAndUpdate(
                { _id: event._id, currentRegistrations: { $gt: 0 } },
                { $inc: { currentRegistrations: -1 } }
            );
        }

        if (nextStatus === 'accepted' && event.type === 'merchandise') {
            // Extract the selected size from formResponses
            const sizeResponse = registration.formResponses?.find(r => r.label === 'Selected Size');
            const registrationSize = sizeResponse ? sizeResponse.value : null;

            if (event.sizes && event.sizes.length > 0 && registrationSize) {
                const sizeIndex = event.sizes.indexOf(registrationSize);

                if (sizeIndex !== -1) {
                    const updatedEvent = await Events.findOneAndUpdate(
                        {
                            _id: event._id,
                            [`stock.${sizeIndex}`]: { $gte: registration.quantity }
                        },
                        {
                            $inc: { [`stock.${sizeIndex}`]: -registration.quantity }
                        },
                        { new: true }
                    );

                    if (!updatedEvent) {
                        return res.status(400).json({ error: "Insufficient stock" });
                    }
                } else {
                    return res.status(400).json({ error: "Invalid size selected" });
                }
            } else if (!event.sizes || event.sizes.length === 0) {
                // If there are no sizes defined, decrement the first element of stock array
                const updatedEvent = await Events.findOneAndUpdate(
                    {
                        _id: event._id,
                        'stock.0': { $gte: registration.quantity }
                    },
                    {
                        $inc: { 'stock.0': -registration.quantity }
                    },
                    { new: true }
                );

                if (!updatedEvent) {
                    return res.status(400).json({ error: "Insufficient stock" });
                }
            } else {
                return res.status(400).json({ error: "Registration size is missing" });
            }
        }

        registration.status = nextStatus;
        await registration.save();

        const updatedRegistration = await Registration.findById(registrationId)
            .populate('participantId', 'firstName lastName email');

        let emailSent = false;
        if (nextStatus === 'accepted' && updatedRegistration.participantId) {
            try {
                // Generate QR Code
                const qrCodeDataUrl = await QRCode.toDataURL(registration.ticketId);
                const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

                // Organizer details for email
                const organizer = await Organizer.findById(event.organizerID);

                // Format dates
                const startDate = new Date(event.start).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
                const endDate = event.end ? new Date(event.end).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A';

                // Handle quantity for merchandise
                const quantityText = event.type === 'merchandise' ? `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #555;"><strong>Quantity:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${registration.quantity}</td>
                    </tr>
                ` : '';

                // Handle size for merchandise
                const sizeResponseEmail = registration.formResponses?.find(r => r.label === 'Selected Size');
                const registrationSizeEmail = sizeResponseEmail ? sizeResponseEmail.value : null;

                const sizeText = event.type === 'merchandise' && registrationSizeEmail ? `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #555;"><strong>Size:</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${registrationSizeEmail}</td>
                    </tr>
                ` : '';

                emailSent = await sendEmail({
                    to: updatedRegistration.participantId.email,
                    subject: `Event Registration Confirmed – ${event.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                            <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px; text-align: center;">Registration Confirmed!</h2>
                            <p style="color: #555; font-size: 16px;">Hello ${updatedRegistration.participantId.firstName},</p>
                            <p style="color: #555; font-size: 16px;">Your registration for <strong>${event.name}</strong> has been confirmed by the organizer.</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9f9f9; border-radius: 5px;">
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #555;"><strong>Event:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${event.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #555;"><strong>Organizer:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${organizer ? organizer.organizerName : 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #555;"><strong>Ticket ID:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #17a2b8; font-weight: bold;">${registration.ticketId}</td>
                                </tr>
                                ${quantityText}
                                ${sizeText}
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #555;"><strong>Start:</strong></td>
                                    <td style="padding: 10px; border-bottom: 1px solid #ddd; color: #333;">${startDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; color: #555;"><strong>End:</strong></td>
                                    <td style="padding: 10px; color: #333;">${endDate}</td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin: 30px 0;">
                                <p style="color: #555; font-size: 14px; margin-bottom: 10px;">Please present this QR code at the event:</p>
                                <img src="cid:qrcode" alt="Ticket QR Code" style="max-width: 200px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: white;" />
                            </div>

                            <p style="color: #888; font-size: 14px; margin-top: 30px; text-align: center;">We look forward to seeing you!<br>Event Management Team</p>
                        </div>
                    `,
                    attachments: [
                        {
                            Name: 'qrcode.png',
                            Content: Buffer.from(qrCodeBuffer).toString("base64"),
                            ContentType: 'image/png',
                            ContentID: '<qrcode>',
                            Inline: true,
                        }
                    ]
                });
            } catch (qrError) {
                console.error('Failed to generate QR or send email:', qrError);
                // Non-blocking: we still return success for the registration update
            }
        }

        res.status(200).json({ ...updatedRegistration.toObject(), emailSent });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const acceptRegistration = async (req, res) => {
    return updateRegistrationDecision(req, res, 'accepted');
};

const rejectRegistration = async (req, res) => {
    return updateRegistrationDecision(req, res, 'rejected');
};

const markAttendance = async (req, res) => {
    const { registrationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
        return res.status(404).json({ error: 'Invalid registration ID' });
    }

    try {
        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        const event = await Events.findOne({ _id: registration.eventId, organizerID: req.Organizer._id });
        if (!event) {
            return res.status(403).json({ error: 'Unauthorized access to registration' });
        }

        // Check and update event status based on current date
        await checkAndUpdateEventStatus(event);

        if (event.status !== 'completed') {
            return res.status(400).json({ error: 'Manual attendance is only allowed for completed events' });
        }

        if (registration.status !== 'accepted') {
            return res.status(400).json({ error: 'Only accepted registrations can be marked as attended' });
        }

        if (registration.attended) {
            return res.status(400).json({ error: 'Attendance already marked' });
        }

        registration.attended = true;
        registration.attendedAt = new Date();
        await registration.save();

        res.status(200).json({ message: 'Attendance marked successfully', registration });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = {
    getAllEvents,
    getEvent,
    createEvent,
    deleteEvent,
    updateEvent,
    publishEvent,
    getEventAnalytics,
    scanTicket,
    exportRegistrations,
    getEventRegistrations,
    getEventFormResponses,
    acceptRegistration,
    rejectRegistration,
    markAttendance
}