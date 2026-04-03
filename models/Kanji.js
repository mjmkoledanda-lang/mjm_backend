const mongoose = require("mongoose");

const kanjiSchema = new mongoose.Schema({
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: true
    },
    date: {
        type: String,
        required: true
    }
}, { timestamps: true });

// ✅ correct index
kanjiSchema.index({ familyId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Kanji", kanjiSchema);