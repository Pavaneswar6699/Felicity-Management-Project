const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const organizerSchema = new mongoose.Schema({
    organizerName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Coding', 'Design & Theory', 'Cultural', 'Sports & Games', 'Student Body', 'Councils & Committees', 'Other'],
        required: true
    },
    description: {
        type: String
    },
    contactEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    mobileNo: {
        type: String,
        default: ''
    },
    isDisabled: {
        type: Boolean,
        default: false
    },
    discordWebhookUrl: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// static login method
organizerSchema.statics.login = async function (email, password) {
    if (!email || !password) {
        throw Error('All fields must be filled');
    }

    if (!email.includes('@')) {
        throw Error('Invalid email, missing @');
    }

    const emailsplit = email.split('@');
    if (emailsplit[1] != 'org.iiit.ac.in') {
        throw Error('Invalid email, please use your IIIT email');
    }

    const organizer = await this.findOne({ email });
    if (!organizer) {
        throw Error('No organizer found with this email');
    }

    if (organizer.isDisabled) {
        throw Error('Organizer is disabled');
    }

    const match = await bcrypt.compare(password, organizer.password); // compare hashed password
    if (!match) {
        throw Error('Incorrect Password, please try again');
    }

    return organizer;
}

module.exports = mongoose.model('Organizers', organizerSchema);