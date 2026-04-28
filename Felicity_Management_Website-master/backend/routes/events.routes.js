// all event routes here, will be imported into server.js
const express = require('express');
const {
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
} = require('../controllers/eventController');
const {
    getForumMessages,
    createForumMessage,
    toggleReaction,
    togglePinForumMessage,
    deleteForumMessage
} = require('../controllers/forumController');
const requireOrganizerAuth = require('../middleware/requireOrganizerAuth');

const router = express.Router();
// all routes here require authentication, only organizers can CRUD events
router.use(requireOrganizerAuth);

// GET all events
router.get('/', getAllEvents);

// POST an event
router.post('/', createEvent);

// Specific routes BEFORE :id parameter routes
router.get('/:eventId/analytics', getEventAnalytics);
router.get('/:eventId/registrations', getEventRegistrations);
router.get('/:eventId/responses', getEventFormResponses);
router.post('/:eventId/scan', scanTicket);
router.get('/:eventId/export', exportRegistrations);
router.patch('/registrations/:registrationId/accept', acceptRegistration);
router.patch('/registrations/:registrationId/reject', rejectRegistration);
router.patch('/registrations/:registrationId/attend', markAttendance);
router.get('/:eventId/forum/messages', getForumMessages);
router.post('/:eventId/forum/messages', createForumMessage);
router.post('/forum/messages/:messageId/reactions', toggleReaction);
router.patch('/:eventId/forum/messages/:messageId/pin', togglePinForumMessage);
router.delete('/:eventId/forum/messages/:messageId', deleteForumMessage);

// Generic routes AFTER specific routes
router.get('/:id', getEvent);
router.patch('/:id', updateEvent);
router.patch('/:id/publish', publishEvent);
router.delete('/:id', deleteEvent);

module.exports = router;