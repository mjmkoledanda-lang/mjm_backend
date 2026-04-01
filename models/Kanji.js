const mongoose = require("mongoose");

const kanjiSchema = new mongoose.Schema({

    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family"
    },

    date: String,

    noambuNumber: Number,

    taken: {
        type: Boolean,
        default: true
    },

    takenTime: Date

}, { timestamps: true });

module.exports = mongoose.model("Kanji", kanjiSchema);