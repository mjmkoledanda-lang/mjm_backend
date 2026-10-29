const mongoose = require("mongoose");

const accountAdjustmentSchema = new mongoose.Schema(
    {
        date: {
            type: String, // "YYYY-MM-DD"
            required: true,
            unique: true,
            index: true
        },
        description: {
            type: String,
            default: "Monthly Payment"
        },
        amount: {
            type: Number,
            required: true,
            default: 0
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("AccountAdjustment", accountAdjustmentSchema);
