const express = require('express');

const { loginOrganizer, getOrganizerProfile, updateOrganizerProfile, requestPasswordChange, getPasswordChangeRequests } = require('../controllers/organizerController');
const requireOrganizerAuth = require('../middleware/requireOrganizerAuth');

const router = express.Router();

// login route
router.post('/login', loginOrganizer);

// middleware for protected routes
router.use(requireOrganizerAuth);

// get current organizer profile
router.get('/profile', getOrganizerProfile);

// update organizer profile
router.patch('/profile', updateOrganizerProfile);

// request password change (admin approval required)
router.post('/request-password-change', requestPasswordChange);

// get password change requests for current organizer
router.get('/password-change-requests', getPasswordChangeRequests);

module.exports = router;