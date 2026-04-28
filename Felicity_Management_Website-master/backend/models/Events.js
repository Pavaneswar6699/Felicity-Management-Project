const mongoose=require('mongoose');

const eventSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    description:{
        type: String
    },
    type:{
        type: String,
        enum:['normal', 'merchandise'],
        required:true
    },
    eligibility:{
        type: String,
        enum:['All', 'IIIT', 'Non-IIIT'],
        required: true
    },
    regDeadline:{
        type: Date,
        required: true
    },
    start:{
        type: Date,
        required: true
    },
    end:{
        type:Date
    },
    regLimit:{
        type:Number
    },
    currentRegistrations: {
        type: Number,
        default: 0
    },
    regFee:{
        type:Number
    },
    organizerID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizers',
        required: true
    },
    tags:{
        type:[String]
    },
    sizes:{
        type:[String]
    },
    stock:{
        type:[Number]
    },
    purchaseLimit:{
        type:Number
    },
    itemDetails:{
        type:String
    },
    formFields:{
        type:[String]
    },
    customFields: [
        {
            label: {
                type: String
            },
            fieldType: {
                type: String,
                enum: ['text', 'textarea', 'number', 'dropdown', 'radio', 'checkbox', 'file']
            },
            required: {
                type: Boolean,
                default: false
            },
            options: {
                type: [String],
                default: []
            }
        }
    ],
    status:{
        type: String,
        enum:['draft', 'published', 'completed', 'ongoing'],
        default: 'draft'
    }
}, {timestamps: true});

module.exports = mongoose.model('Events', eventSchema);