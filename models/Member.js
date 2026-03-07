const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({

    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: true
    },

    name: {
        type: String,
        trim: true
    },

    dob: {
        type: Date
    },

    nic: {
        type: String,
        trim: true
    },

    maritalStatus: {
        type: String,
        enum: ["SINGLE", "MARRIED", "WIDOWED", "DIVORCED", "SEPARATED"],
        uppercase: true,
        trim: true
    },

    educationLevel: {
        type: String,
        trim: true
    },

    gender: {
        type: String,
        enum: ["MALE", "FEMALE"],
        uppercase: true
    },

    relation: {
        type: String,
        trim: true
    },

    occupation: {
        type: String,
        trim: true
    },

    disabilityDetails: {
        type: String,
        default: ""
    },

    registerNumber: {
        type: String,
        trim: true
    },

    programs: [
        {
            type: String
        }
    ]

}, { timestamps: true });

module.exports = mongoose.model("Member", memberSchema);