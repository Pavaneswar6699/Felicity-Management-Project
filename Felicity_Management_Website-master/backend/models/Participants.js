const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const participantSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    participantType: {
        type: String,
        enum: ['IIIT', 'Non-IIIT'],
        required: true
    },
    collegeName: {
        type: String
    },
    contactNo: {
        type: String
    },
    interests: {
        type: [String]
    },
    followedOrganizers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizers'
    }]
}, { timestamps: true });

// static register method
participantSchema.statics.register = async function (firstName, lastName, email, password, participantType, collegeName) {
    // created a regular async fn instead of arrow fn as it uses 'this' keyword
    // validation
    if (!firstName || !email || !password || !participantType) {
        throw Error('All important fields must be filled');
    }

    if (!email.includes('@')) {
        throw Error('Invalid email, missing @');
    }

    if (participantType == 'IIIT') {
        collegeName = 'IIIT-Hyderabad';
        const emailsplit = email.split('@');
        if (emailsplit[1] != 'iiit.ac.in' && emailsplit[1] != 'research.iiit.ac.in' && emailsplit[1] != 'students.iiit.ac.in') {
            throw Error('Invalid email, please use your IIIT email');
        }
    }

    if (participantType == 'Non-IIIT') {
        const emailsplit = email.split('@');
        if (emailsplit[1] == 'iiit.ac.in' || emailsplit[1] == 'research.iiit.ac.in' || emailsplit[1] == 'students.iiit.ac.in') {
            throw Error('Invalid email, register as IIIT participant if you have an IIIT email');
        }
        if (!collegeName || collegeName.trim() == '') {
            throw Error('Please provide your college name');
        }
        if (collegeName.toLowerCase() == 'iiit-hyderabad' || collegeName.toLowerCase() == 'iiit hyderabad' || collegeName.toLowerCase() == 'iiit-h' || collegeName.toLowerCase() == 'iiith') {
            throw Error('Invalid college name, please select IIIT as participant type if you are from IIIT-Hyderabad');
        }
    }

    const exists = await this.findOne({ email });
    if (exists) {
        throw Error('Email already in use');
    }

    const salt = await bcrypt.genSalt(10); // generated key for hashing password
    const hash = await bcrypt.hash(password, salt);

    const participant = await this.create({ firstName, lastName, email, password: hash, participantType, collegeName });
    return participant;
}

// static login method
participantSchema.statics.login = async function (email, password, participantType) {
    if (!email || !password || !participantType) {
        throw Error('All fields must be filled');
    }

    if (!email.includes('@')) {
        throw Error('Invalid email, missing @');
    }

    if (participantType == 'IIIT') {
        const emailsplit = email.split('@');
        if (emailsplit[1] != 'iiit.ac.in' && emailsplit[1] != 'research.iiit.ac.in' && emailsplit[1] != 'students.iiit.ac.in') {
            throw Error('Invalid email, please use your IIIT email');
        }
    }

    if (participantType == 'Non-IIIT') {
        const emailsplit = email.split('@');
        if (emailsplit[1] == 'iiit.ac.in' || emailsplit[1] == 'research.iiit.ac.in' || emailsplit[1] == 'students.iiit.ac.in') {
            throw Error('Invalid email, register as IIIT participant if you have an IIIT email');
        }
    }

    const participant = await this.findOne({ email });
    if (!participant) {
        throw Error('No participant found with this email');
    }

    const match = await bcrypt.compare(password, participant.password);
    if (!match) {
        throw Error('Incorrect Password, please try again');
    }

    return participant;
}

participantSchema.statics.changePassword = async function (email, oldPassword, newPassword) {
    if (!email || !oldPassword || !newPassword) {
        throw Error('All fields must be filled');
    }
    if (newPassword.length < 8) {
        throw Error('New password must be at least 8 characters long');
    }
    const participant = await this.findOne({ email });
    if (!participant) {
        throw Error('Email does not match the logged in participant');
    }
    const match = await bcrypt.compare(oldPassword, participant.password);
    if (!match) {
        throw Error('Incorrect old password, please try again');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    participant.password = hashedPassword;
    await participant.save();
    return participant;
}

module.exports = mongoose.model('Participants', participantSchema);