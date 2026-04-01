const mongoose = require("mongoose");

const qurbanSchema = new mongoose.Schema({

    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family"
    },

    year: Number,

    taken: {
        type: Boolean,
        default: true
    },

    takenDate: Date

}, { timestamps: true });

module.exports = mongoose.model("Qurban", qurbanSchema);