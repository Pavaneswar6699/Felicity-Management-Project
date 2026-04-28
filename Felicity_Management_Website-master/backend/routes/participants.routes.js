const express = require('express');

const {
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
	deleteParticipant,
	generateEventCalendar
} = require('../controllers/participantController');
const {
	getForumMessages,
	createForumMessage,
	toggleReaction
} = require('../controllers/forumController');
const requireParticipantAuth = require('../middleware/requireParticipantAuth');
const upload = require('../config/multer');

const router = express.Router();

// login route
router.post('/login', loginParticipant);

// register route
router.post('/register', registerParticipant);

// protected routes
router.use(requireParticipantAuth);

const optionalUploadAny = (req, res, next) => {
	const contentType = req.headers['content-type'] || '';
	if (contentType.includes('multipart/form-data')) {
		return upload.any()(req, res, next);
	}
	return next();
};

// view all events created by all organizers
router.get('/events', viewAllEvents);

// list organizers for participant selection
router.get('/organizers', getOrganizersForParticipants);

// view organizer details
router.get('/organizer/:organizerId', viewOrganizerDetails);

// get current participant profile
router.get('/profile', getParticipantProfile);

// update participant profile
router.patch('/profile', updateParticipantProfile);

// change password route
router.post('/change-password', changePassword);

// register for event (with optional file uploads for custom form fields)
router.post('/register/:eventId', optionalUploadAny, registerForEvent);

// get participant's registrations
router.get('/my-registrations', getMyRegistrations);

// delete registration
router.delete('/registrations/:registrationId', deleteRegistration);

// download event calendar
router.get('/events/:eventId/calendar', generateEventCalendar);

// participant forum routes
router.get('/events/:eventId/forum/messages', getForumMessages);
router.post('/events/:eventId/forum/messages', createForumMessage);
router.post('/forum/messages/:messageId/reactions', toggleReaction);

module.exports = router;