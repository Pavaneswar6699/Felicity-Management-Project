const express = require('express');

const {
    loginAdmin,
    getAllOrganizers,
    getOrganizer,
    createOrganizer,
    deleteOrganizer,
    getPasswordChangeRequests,
    approvePasswordChange,
    rejectPasswordChange,
    disableOrganizer,
    enableOrganizer,
    getOrganizerPasswordHistory
} = require('../controllers/adminController');
const requireAdminAuth = require('../middleware/requireAdminAuth');

const router = express.Router();

// login route (no auth required)
router.post('/login', loginAdmin);

// protected routes
router.use(requireAdminAuth);

// admin creates organizer
router.post('/organizers', createOrganizer);

// get all organizers
router.get('/organizers', getAllOrganizers);

// get organizer by id
router.get('/organizers/:id', getOrganizer);

// disable organizer by id
router.patch('/organizers/:id/disable', disableOrganizer);

// enable organizer by id
router.patch('/organizers/:id/enable', enableOrganizer);

// delete organizer by id
router.delete('/organizers/:id', deleteOrganizer);

// password change request routes
router.get('/password-change-requests', getPasswordChangeRequests);

router.patch('/password-change-requests/:requestId/approve', approvePasswordChange);

router.patch('/password-change-requests/:requestId/reject', rejectPasswordChange);

router.get('/organizers/:organizerId/password-history', getOrganizerPasswordHistory);

module.exports = router;