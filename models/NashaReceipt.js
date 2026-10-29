const mongoose = require("mongoose");

const nashaReceiptSchema = new mongoose.Schema(
    {
        receiptNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        customerName: {
            type: String,
            required: true,
            trim: true,
        },

        nashaAccount: {
            type: Number,
            required: true,
            min: 1,
        },

        amountPaid: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentDate: {
            type: Date,
            default: Date.now,
        },

        notes: {
            type: String,
            default: "",
            trim: true,
        },

        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "NashaReceipt",
    nashaReceiptSchema
);