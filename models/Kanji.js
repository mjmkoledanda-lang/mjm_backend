const mongoose = require("mongoose");

const kanjiSchema = new mongoose.Schema({
    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: true,
    },

    date: {
        type: Date,
        required: true,
    },

    ramzanDay: {
        type: Number, // 1 to 30
        required: true,
    },

}, { timestamps: true });

// جلوگیری duplicate (1 family per day)
kanjiSchema.index({ family: 1, ramzanDay: 1 }, { unique: true });

module.exports = mongoose.model("Kanji", kanjiSchema);