const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
    {
        slot: {
            type: Number,
            required: true,
            min: 1,
            max: 3
        },
        title: {
            type: String,
            trim: true,
            default: ""
        },
        sponsor: {
            type: String,
            trim: true,
            default: ""
        },
        imageUrl: {
            type: String,
            required: true
        },
        linkUrl: {
            type: String,
            default: ""
        },
        active: {
            type: Boolean,
            default: true
        },
        displayDurationSeconds: {
            type: Number,
            default: 10
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Advertisement", advertisementSchema);
