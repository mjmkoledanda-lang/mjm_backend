const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family"
    },
    name: String,
    dob: Date,
    nic: String,
    maritalStatus: String,             // ✅ NEW
    educationLevel: String,
    gender: String,
    relation: String,
    occupation: String,
    disabilityDetails: String,
    registerNumber: String,
    programs: [String],
}, { timestamps: true });

module.exports = mongoose.model("Member", memberSchema);