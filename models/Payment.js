const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: true
    },

    // 🔥 NEW FIELD (CRITICAL)
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    remarks: String,

    paidDate: {
        type: Date,
        default: Date.now
    },

    smsSent: {
        type: Boolean,
        default: false
    },
    receiptPrinted: {
        type: Boolean,
        default: false
    }
});

// Prevent duplicate payments
paymentSchema.index({ family: 1, year: 1, month: 1 }, { unique: true });

// 🔥 PERFORMANCE INDEXES
paymentSchema.index({ paidDate: 1 });
paymentSchema.index({ collectedBy: 1 });

module.exports = mongoose.model("Payment", paymentSchema);