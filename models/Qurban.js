const mongoose = require("mongoose");

const qurbanSchema = new mongoose.Schema({
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: true
    },
    year: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// prevent duplicate per year
qurbanSchema.index({ familyId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Qurban", qurbanSchema);