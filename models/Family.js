const mongoose = require("mongoose");

const familySchema = new mongoose.Schema({
    familyId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    headName: String,
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
    monthlyAmount: {
        type: Number,
        required: true
    },
    widow: {                   // ✅ NEW
        type: Boolean,
        default: false
    },
    converted: {
        type: Boolean,
        default: false
    },


    // 🔥 HEAD DETAILS
    headOccupation: String,
    headEducationLevel: String,
    headMaritalStatus: String,
    headDisabilityDetails: String,

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