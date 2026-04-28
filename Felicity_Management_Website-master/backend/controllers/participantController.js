const Participant = require('../models/Participants');
const Events = require('../models/Events');
const Organizer = require('../models/Organizers');
const Registration = require('../models/registrations');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const cloudinary = require('../config/cloudinary');
const { generateICS } = require('../utils/calendarService');

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

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
            // Needed if event is a plain object from aggregation
            await Events.findByIdAndUpdate(event._id, { status: event.status });
        }
    }

    return event;
}

const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.SECRET_JWT_KEY, { expiresIn: '3d' });
}

// login participant
const loginParticipant = async (req, res) => {
    const { email, password, participantType } = req.body;
    try {
        const participant = await Participant.login(email, password, participantType);
        const token = createToken(participant._id);

        res.status(200).json({ email, token, firstName: participant.firstName });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// register participant
const registerParticipant = async (req, res) => {
    const { firstName, lastName, email, password, participantType, collegeName } = req.body;
    try {
        let participant;
        if (participantType == 'IIIT') {
            participant = await Participant.register(firstName, lastName, email, password, participantType);
        }
        if (participantType == 'Non-IIIT') {
            participant = await Participant.register(firstName, lastName, email, password, participantType, collegeName);
        }
        const token = createToken(participant._id);

        res.status(200).json({ email, token, firstName: participant.firstName, lastName: participant.lastName });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// view all events created by all organizers which are in published status
const viewAllEvents = async (req, res) => {
    try {
        const {
            type,
            eligibility,
            upcomingOnly,
            sort,
            includeCompleted,
            isCompleted,
            startDate,
            endDate,
            followedOnly,
            trendingWindow,
            page,
            limit
        } = req.query;

        // Build filter criteria
        const filter = {};

        // Status filter - exclude completed by default
        let statusFilter = ['published', 'ongoing'];
        if (isCompleted === 'true') {
            statusFilter = ['completed'];
        } else if (isCompleted === 'false') {
            statusFilter = ['published', 'ongoing'];
        } else if (includeCompleted === 'true') {
            statusFilter = ['published', 'ongoing', 'completed'];
        }
        filter.status = { $in: statusFilter };

        // Type filter
        if (type) {
            filter.type = type;
        }

        // Eligibility filter
        if (eligibility) {
            filter.eligibility = eligibility;
        }

        // Date range and upcoming filters
        if (startDate || endDate || upcomingOnly === 'true') {
            const startRange = {};
            if (startDate) {
                startRange.$gte = new Date(startDate);
            }
            if (endDate) {
                startRange.$lte = new Date(endDate);
            }
            if (upcomingOnly === 'true') {
                startRange.$gt = new Date();
            }
            filter.start = startRange;
        }

        // Followed clubs filter
        if (followedOnly === 'true') {
            const participant = await Participant.findById(req.Participant._id).select('followedOrganizers');
            const followedOrganizers = participant?.followedOrganizers || [];
            filter.organizerID = { $in: followedOrganizers };
        }

        // Handle sorting
        let sortOption = { start: -1 }; // Default sort
        let useTrendingSort = false;

        if (sort === 'upcoming') {
            sortOption = { start: -1 };
        } else if (sort === 'trending') {
            useTrendingSort = true;
        }

        // Handle pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const isPaginated = !isNaN(pageNum) && !isNaN(limitNum) && pageNum > 0 && limitNum > 0;

        if (useTrendingSort) {
            // Use aggregation for trending sort (by registration count)
            const registrationLookupPipeline = [
                {
                    $match: {
                        $expr: { $eq: ['$eventId', '$$eventId'] }
                    }
                }
            ];

            // If trendingWindow=24h, only count last 24 hours
            if (trendingWindow === '24h') {
                registrationLookupPipeline.push({
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    }
                });
            }

            const pipeline = [
                { $match: filter },
                {
                    $lookup: {
                        from: 'registrations',
                        let: { eventId: '$_id' },
                        pipeline: registrationLookupPipeline,
                        as: 'registrations'
                    }
                },
                {
                    $addFields: {
                        registrationCount: { $size: '$registrations' }
                    }
                },
                { $sort: { registrationCount: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'organizers',
                        localField: 'organizerID',
                        foreignField: '_id',
                        as: 'organizerData'
                    }
                },
                {
                    $unwind: {
                        path: '$organizerData',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        organizerID: {
                            _id: '$organizerData._id',
                            organizerName: '$organizerData.organizerName',
                            category: '$organizerData.category'
                        }
                    }
                },
                {
                    $project: {
                        registrations: 0,
                        organizerData: 0,
                        registrationCount: 0
                    }
                }
            ];

            if (isPaginated) {
                const skip = (pageNum - 1) * limitNum;

                // Get total count
                const countPipeline = [
                    { $match: filter },
                    { $count: 'total' }
                ];
                const countResult = await Events.aggregate(countPipeline);
                const rawTotal = countResult.length > 0 ? countResult[0].total : 0;
                const total = Math.min(rawTotal, 5);

                // Add pagination stages
                pipeline.push({ $skip: skip });
                pipeline.push({ $limit: limitNum });

                const events = await Events.aggregate(pipeline);

                for (const event of events) {
                    await checkAndUpdateEventStatus(event);
                }

                return res.status(200).json({
                    events,
                    total,
                    page: pageNum,
                    totalPages: Math.ceil(total / limitNum)
                });
            } else {
                const events = await Events.aggregate(pipeline);
                for (const event of events) {
                    await checkAndUpdateEventStatus(event);
                }
                return res.status(200).json(events);
            }
        } else {
            // Use regular query for non-trending sorts
            if (isPaginated) {
                const skip = (pageNum - 1) * limitNum;

                const total = await Events.countDocuments(filter);
                const events = await Events.find(filter)
                    .populate('organizerID', 'organizerName category')
                    .sort(sortOption)
                    .skip(skip)
                    .limit(limitNum);

                for (const event of events) {
                    await checkAndUpdateEventStatus(event);
                }

                return res.status(200).json({
                    events,
                    total,
                    page: pageNum,
                    totalPages: Math.ceil(total / limitNum)
                });
            } else {
                const events = await Events.find(filter)
                    .populate('organizerID', 'organizerName category')
                    .sort(sortOption);

                for (const event of events) {
                    await checkAndUpdateEventStatus(event);
                }

                return res.status(200).json(events);
            }
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const changePassword = async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    try {
        const participant = await Participant.changePassword(email, oldPassword, newPassword);
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get current participant profile
const getParticipantProfile = async (req, res) => {
    const participantId = req.Participant._id;
    try {
        const participant = await Participant.findById(participantId)
            .select('-password')
            .populate('followedOrganizers', 'organizerName category');
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.status(200).json(participant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// update participant profile
const updateParticipantProfile = async (req, res) => {
    const participantId = req.Participant._id;
    const { firstName, lastName, participantType, collegeName, contactNo, interests, followedOrganizers } = req.body;

    try {
        const participant = await Participant.findById(participantId);
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        if (firstName) participant.firstName = firstName;
        if (lastName !== undefined) participant.lastName = lastName;
        if (participantType) participant.participantType = participantType;
        if (collegeName !== undefined) participant.collegeName = collegeName;
        if (contactNo !== undefined) participant.contactNo = contactNo;
        if (interests !== undefined) participant.interests = interests;
        if (followedOrganizers !== undefined) participant.followedOrganizers = followedOrganizers;

        await participant.save();

        const updatedParticipant = await Participant.findById(participantId)
            .select('-password')
            .populate('followedOrganizers', 'organizerName category');
        res.status(200).json(updatedParticipant);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// get organizers list for participant selection
const getOrganizersForParticipants = async (req, res) => {
    try {
        const organizers = await Organizer.find().select('organizerName category description contactEmail mobileNo');
        res.status(200).json(organizers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// view organizer details for participants
const viewOrganizerDetails = async (req, res) => {
    const { organizerId } = req.params;
    try {
        const organizer = await Organizer.findById(organizerId)
            .select('organizerName category description contactEmail mobileNo');
        if (!organizer) {
            return res.status(404).json({ error: 'Organizer not found' });
        }

        const events = await Events.find({
            organizerID: organizerId,
            status: { $in: ['published', 'ongoing', 'completed'] }
        })
            .populate('organizerID', 'organizerName category')
            .sort({ start: -1 });

        for (const event of events) {
            await checkAndUpdateEventStatus(event);
        }

        res.status(200).json({ organizer, events });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// register participant for an event
const registerForEvent = async (req, res) => {
    const participantId = req.Participant._id;
    const { eventId } = req.params;
    const { quantity, selectedSize } = req.body;
    let regQuantity = 1;
    let registrationSlotReserved = false;

    // Safely parse formResponses from request body
    let formResponses = [];
    if (req.body.formResponses) {
        try {
            // If formResponses is a string, parse it as JSON
            if (typeof req.body.formResponses === 'string') {
                formResponses = JSON.parse(req.body.formResponses);
            } else if (Array.isArray(req.body.formResponses)) {
                formResponses = req.body.formResponses;
            } else {
                return res.status(400).json({ error: 'formResponses must be a JSON array or array' });
            }

            // Ensure all items in formResponses are objects
            formResponses = formResponses.map(item => {
                if (typeof item === 'string') {
                    try {
                        return JSON.parse(item);
                    } catch (e) {
                        return item;
                    }
                }
                return item;
            });
        } catch (parseErr) {
            return res.status(400).json({ error: `Invalid formResponses JSON format: ${parseErr.message}` });
        }
    }

    try {
        // Validate event exists
        const event = await Events.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        await checkAndUpdateEventStatus(event);

        // Check eligibility criteria
        const participant = await Participant.findById(participantId);
        if (participant.participantType === 'Non-IIIT' && event.eligibility === 'IIIT') {
            return res.status(400).json({ error: 'This event is only open to IIIT participants' });
        }
        if (participant.participantType === 'IIIT' && event.eligibility === 'Non-IIIT') {
            return res.status(400).json({ error: 'This event is only open to Non-IIIT participants' });
        }

        // Reject registration for completed events
        if (event.status === 'completed') {
            return res.status(400).json({ error: 'Event is already completed' });
        }

        // Allow registration only for published OR ongoing events
        if (event.status !== 'published' && event.status !== 'ongoing') {
            return res.status(400).json({ error: 'Event is not open for registration' });
        }

        // Ensure registration deadline not passed
        const now = new Date();
        if (now > new Date(event.regDeadline)) {
            return res.status(400).json({ error: 'Registration deadline has passed' });
        }

        // Check for duplicate registration
        const existingRegistration = await Registration.findOne({ eventId, participantId });
        if (existingRegistration) {
            return res.status(400).json({ error: 'You are already registered for this event' });
        }

        // Determine registration quantity based on event type
        regQuantity = 1;

        if (event.type === 'normal') {
            // Normal events: quantity must always be 1
            regQuantity = 1;
        } else if (event.type === 'merchandise') {
            // Merchandise events: quantity can be > 1
            regQuantity = parseInt(quantity) || 1;

            // Validate quantity is positive
            if (regQuantity < 1) {
                return res.status(400).json({ error: 'Quantity must be at least 1' });
            }

            // Validate quantity against purchase limit (if defined)
            if (event.purchaseLimit && regQuantity > event.purchaseLimit) {
                return res.status(400).json({ error: `Maximum purchase limit is ${event.purchaseLimit}` });
            }

            const paymentProofFile = req.files?.find(file => file.fieldname === 'paymentProof');
            const hasFileResponse = Array.isArray(formResponses) && formResponses.some(response => response && response.type === 'file');
            if (!paymentProofFile || !hasFileResponse) {
                return res.status(400).json({ error: 'Payment proof required' });
            }
        }

        // Atomically reserve registration slot (regLimit-safe)
        if (event.regLimit) {
            const regLimitUpdatedEvent = await Events.findOneAndUpdate(
                {
                    _id: eventId,
                    currentRegistrations: { $lt: event.regLimit }
                },
                { $inc: { currentRegistrations: 1 } },
                { new: true }
            );

            if (!regLimitUpdatedEvent) {
                return res.status(400).json({ error: 'Registration limit reached' });
            }
            registrationSlotReserved = true;
        } else {
            const registrationCounterUpdated = await Events.findOneAndUpdate(
                { _id: eventId },
                { $inc: { currentRegistrations: 1 } },
                { new: true }
            );

            if (!registrationCounterUpdated) {
                return res.status(404).json({ error: 'Event not found' });
            }
            registrationSlotReserved = true;
        }

        // Validate size for merchandise
        if (event.type === 'merchandise') {
            if (event.sizes && event.sizes.length > 0) {
                if (!selectedSize) {
                    if (registrationSlotReserved) {
                        await Events.findOneAndUpdate(
                            { _id: eventId, currentRegistrations: { $gt: 0 } },
                            { $inc: { currentRegistrations: -1 } }
                        );
                    }
                    return res.status(400).json({ error: 'Please select a size' });
                }
                const sizeIndex = event.sizes.indexOf(selectedSize);
                if (sizeIndex === -1) {
                    if (registrationSlotReserved) {
                        await Events.findOneAndUpdate(
                            { _id: eventId, currentRegistrations: { $gt: 0 } },
                            { $inc: { currentRegistrations: -1 } }
                        );
                    }
                    return res.status(400).json({ error: 'Invalid size selected' });
                }
            }
        }

        // Upload provided files to Cloudinary
        const uploadedFilesByField = {};
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            try {
                const uploadPromises = req.files.map(async (file) => {
                    const result = await uploadToCloudinary(file.buffer);
                    return {
                        fieldname: file.fieldname,
                        url: result.secure_url,
                        public_id: result.public_id,
                        originalName: file.originalname
                    };
                });
                const uploadResults = await Promise.all(uploadPromises);
                uploadResults.forEach(item => {
                    uploadedFilesByField[item.fieldname] = item;
                });
            } catch (err) {
                if (registrationSlotReserved) {
                    await Events.findOneAndUpdate(
                        { _id: eventId, currentRegistrations: { $gt: 0 } },
                        { $inc: { currentRegistrations: -1 } }
                    );
                }
                return res.status(400).json({ error: 'Failed to upload files to Cloudinary' });
            }
        }

        // Validate and process formResponses for normal events
        let processedFormResponses = [];
        if (event.type === 'normal' && event.customFields && event.customFields.length > 0) {
            if (!Array.isArray(formResponses)) {
                return res.status(400).json({ error: 'formResponses must be provided as an array for this event' });
            }

            // Validate all required fields are present and correct
            for (let customField of event.customFields) {
                const response = formResponses.find(r => r.label === customField.label);

                // Check required fields
                if (customField.required && !response) {
                    return res.status(400).json({ error: `Required field "${customField.label}" is missing` });
                }

                if (response) {
                    // Type-specific validation
                    if (customField.fieldType === 'text' || customField.fieldType === 'textarea') {
                        if (typeof response.value !== 'string') {
                            return res.status(400).json({ error: `Field "${customField.label}" must be a string` });
                        }
                        if (customField.required && response.value.trim() === '') {
                            return res.status(400).json({ error: `Required field "${customField.label}" cannot be empty` });
                        }
                    }

                    if (customField.fieldType === 'number') {
                        const numVal = Number(response.value);
                        if (isNaN(numVal)) {
                            return res.status(400).json({ error: `Field "${customField.label}" must be a valid number` });
                        }
                        response.value = numVal;
                    }

                    if (customField.fieldType === 'dropdown' || customField.fieldType === 'radio') {
                        if (!customField.options.includes(response.value)) {
                            return res.status(400).json({ error: `Invalid value for field "${customField.label}". Must be one of: ${customField.options.join(', ')}` });
                        }
                    }

                    if (customField.fieldType === 'checkbox') {
                        if (!Array.isArray(response.value)) {
                            return res.status(400).json({ error: `Field "${customField.label}" (checkbox) must be an array` });
                        }
                        if (customField.required && response.value.length === 0) {
                            return res.status(400).json({ error: `Required field "${customField.label}" must have at least one selection` });
                        }
                        // Validate all selections are valid options
                        for (let val of response.value) {
                            if (!customField.options.includes(val)) {
                                return res.status(400).json({ error: `Invalid value "${val}" for field "${customField.label}". Must be one of: ${customField.options.join(', ')}` });
                            }
                        }
                    }

                    if (customField.fieldType === 'file') {
                        const hasUploadedFile = !!uploadedFilesByField[customField.label];
                        const hasInlineFileValue = typeof response.value === 'string' && response.value.trim() !== '';

                        if (customField.required && !hasUploadedFile && !hasInlineFileValue) {
                            return res.status(400).json({ error: `Required file field "${customField.label}" is missing` });
                        }
                        // Map uploaded file to response
                        if (hasUploadedFile) {
                            response.value = uploadedFilesByField[customField.label];
                        }
                    }
                }
            }

            // Validate no extra unknown fields
            const knownLabels = event.customFields.map(f => f.label);
            for (let response of formResponses) {
                if (!knownLabels.includes(response.label) && response.label !== 'Upload Payment Proof') {
                    return res.status(400).json({ error: `Unknown field "${response.label}" submitted` });
                }
            }

            // Enhance responses with fieldId and type from customFields
            // Create a clean array of processed responses
            processedFormResponses = formResponses.map(response => {
                if (response.label === 'Upload Payment Proof') return null;
                const customField = event.customFields.find(f => f.label === response.label);
                return {
                    fieldId: customField?._id ? customField._id.toString() : '',
                    label: response.label,
                    type: customField?.fieldType || 'text',
                    value: response.value
                };
            }).filter(Boolean);
        } else if (event.type === 'merchandise') {
            const paymentProofFile = req.files?.find(file => file.fieldname === 'paymentProof');
            if (!paymentProofFile) {
                if (registrationSlotReserved) {
                    await Events.findOneAndUpdate(
                        { _id: eventId, currentRegistrations: { $gt: 0 } },
                        { $inc: { currentRegistrations: -1 } }
                    );
                }
                return res.status(400).json({ error: 'Payment proof required' });
            }

            processedFormResponses = [];
        }

        if (selectedSize) {
            processedFormResponses.push({
                fieldId: '',
                label: 'Selected Size',
                type: 'text',
                value: selectedSize
            });
        }

        // Add payment proof for all events that require it
        if (event.type === 'merchandise' || (event.type === 'normal' && event.regFee > 0)) {
            const paymentProofData = uploadedFilesByField['paymentProof'];
            if (paymentProofData) {
                processedFormResponses.push({
                    fieldId: '',
                    label: 'Upload Payment Proof',
                    type: 'file',
                    value: {
                        url: paymentProofData.url,
                        public_id: paymentProofData.public_id
                    }
                });
            } else if (!processedFormResponses.some(r => r.label === 'Upload Payment Proof')) {
                // If required but not provided
                if (registrationSlotReserved) {
                    await Events.findOneAndUpdate(
                        { _id: eventId, currentRegistrations: { $gt: 0 } },
                        { $inc: { currentRegistrations: -1 } }
                    );
                }
                return res.status(400).json({ error: 'Payment proof required' });
            }
        }

        // Generate unique ticketId
        const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        // Generate QR code (encode ticketId as base64 string)
        const qrCode = await QRCode.toDataURL(ticketId);

        // Create registration document
        // Ensure formResponses is always an array (never null/undefined)
        const registrationData = {
            eventId,
            participantId,
            ticketId,
            quantity: regQuantity,
            qrCode,
            status: 'pending',
            formResponses: Array.isArray(processedFormResponses) ? processedFormResponses : []
        };

        let registration;
        try {
            registration = await Registration.create(registrationData);
        } catch (mongoErr) {
            if (registrationSlotReserved) {
                await Events.findOneAndUpdate(
                    { _id: eventId, currentRegistrations: { $gt: 0 } },
                    { $inc: { currentRegistrations: -1 } }
                );
            }
            throw mongoErr;
        }

        res.status(200).json({
            message: 'Successfully registered for event, wait for confirmation email',
            ticketId: registration.ticketId,
            quantity: registration.quantity,
            qrCode: registration.qrCode
        });
    } catch (error) {
        if (registrationSlotReserved) {
            await Events.findOneAndUpdate(
                { _id: eventId, currentRegistrations: { $gt: 0 } },
                { $inc: { currentRegistrations: -1 } }
            );
        }
        res.status(400).json({ error: error.message });
    }
}

// get participant's registrations
const getMyRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ participantId: req.Participant._id })
            .populate({
                path: 'eventId',
                select: 'name type start end organizerID',
                populate: {
                    path: 'organizerID',
                    select: 'organizerName'
                }
            })
            .sort({ createdAt: -1 });

        const maskedRegistrations = registrations.map(registration => {
            const regObj = registration.toObject();
            if (regObj.status !== 'accepted') {
                regObj.ticketId = null;
                regObj.qrCode = null;
            }
            return regObj;
        });

        res.status(200).json(maskedRegistrations);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// delete registration
const deleteRegistration = async (req, res) => {
    const { registrationId } = req.params;
    const participantId = req.Participant._id;

    try {
        // Find registration and verify ownership
        const registration = await Registration.findOne({ _id: registrationId, participantId });

        if (!registration) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // Get event details to restore stock/counters
        const event = await Events.findById(registration.eventId);
        await checkAndUpdateEventStatus(event);

        if (event && registration.status !== 'rejected') {
            if (event.type === 'merchandise' && registration.quantity && registration.status === 'accepted') {
                const sizeResponse = registration.formResponses?.find(r => r.label === 'Selected Size');
                const registrationSize = sizeResponse ? sizeResponse.value : null;

                if (event.sizes && event.sizes.length > 0 && registrationSize) {
                    const sizeIndex = event.sizes.indexOf(registrationSize);
                    if (sizeIndex !== -1) {
                        await Events.findOneAndUpdate(
                            { _id: event._id },
                            { $inc: { [`stock.${sizeIndex}`]: registration.quantity } }
                        );
                    }
                } else if (!event.sizes || event.sizes.length === 0) {
                    await Events.findOneAndUpdate(
                        { _id: event._id },
                        { $inc: { 'stock.0': registration.quantity } }
                    );
                }
            }

            await Events.findOneAndUpdate(
                { _id: event._id, currentRegistrations: { $gt: 0 } },
                { $inc: { currentRegistrations: -1 } }
            );
        }

        await Registration.findOneAndDelete({ _id: registrationId });

        res.status(200).json({ message: 'Registration deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

// generate event calendar (.ics)
const generateEventCalendar = async (req, res) => {
    const { eventId } = req.params;
    const participantId = req.Participant._id;

    try {
        // Verify participant is registered and accepted for the event
        const registration = await Registration.findOne({ eventId, participantId });
        if (!registration) {
            return res.status(403).json({ error: 'You are not registered for this event' });
        }

        // Allowed if registration status is 'accepted' or 'pending' (if no manual approval).
        // Safest is to allow if registration exists, per prompt: "Verify participant is registered for event. If not registered -> return 403."

        const event = await Events.findById(eventId).populate('organizerID', 'organizerName');
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const organizerName = event.organizerID?.organizerName || 'Organizer';
        const icsContent = await generateICS(event, organizerName);

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="event_${eventId}.ics"`);
        return res.status(200).send(icsContent);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

module.exports = {
    loginParticipant,
    registerParticipant,
    viewAllEvents,
    changePassword,
    getParticipantProfile,
    updateParticipantProfile,
    getOrganizersForParticipants,
    viewOrganizerDetails,
    registerForEvent,
    getMyRegistrations,
    deleteRegistration,
    generateEventCalendar
}