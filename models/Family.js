const mongoose = require("mongoose");

const familySchema = new mongoose.Schema({
    familyId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    headTitle: {
        type: String
    },


    headName: String,

    headGender: {
        type: String,
        enum: ["MALE", "FEMALE"],
        uppercase: true,
        trim: true
    },

    nic: String,

    headDateOfBirth: {
        type: Date
    },

    phone: String,
    whatsapp: String,
    email: String,

    houseNumber: String,
    address: String,
    addressOther: String,
    gsDivision: String,

    manualArrears: {
        type: Number,
        default: 0
    },

    monthlyAmount: {
        type: Number,
        required: true
    },

    // Converted family
    converted: {
        type: Boolean,
        default: false
    },

    // =========================
    // HEAD DETAILS
    // =========================
    headOccupation: String,

    headEducationLevel: String,

    headMaritalStatus: {
        type: String,
        enum: ["SINGLE", "MARRIED", "WIDOW", "DIVORCED", "SEPARATED"],
        uppercase: true,
        trim: true
    },

    headDisability: {
        type: Boolean,
        default: false
    },

    headDisabilityType: {
        type: String,
        default: ""
    },

    headDisabilityDetails: {
        type: String,
        default: ""
    },

    // =========================
    // HOUSE DETAILS
    // =========================
    houseType: String,
    familyType: String,
    disasterStatus: String,
    landOwnership: String,

    utilities: {
        electricity: Boolean,
        water: Boolean,
        bathroom: Boolean,
        toilet: Boolean
    }

}, { timestamps: true });

module.exports = mongoose.model("Family", familySchema);