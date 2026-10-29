const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    content: {
        type: String
    },

    images: [String],

    // ✅ FIXED
    type: {
        type: String,
        enum: ["notice", "post"], // ✅ CHANGED
        default: "post" // ✅ better default
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Post", postSchema);