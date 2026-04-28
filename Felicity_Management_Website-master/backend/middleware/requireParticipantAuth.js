const jwt = require('jsonwebtoken');
const Participant = require('../models/Participants');

const requireParticipantAuth = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).json({ error: 'Unauthorized, authentication token missing' });
    }
    const token = authorization.split(' ')[1];
    try {
        const { _id } = jwt.verify(token, process.env.SECRET_JWT_KEY);
        req.Participant = await Participant.findOne({ _id }).select('_id');
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ error: 'Unauthorized, invalid token' });
    }
};

module.exports = requireParticipantAuth;
