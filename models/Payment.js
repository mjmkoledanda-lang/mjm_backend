const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family",
        required: true
    },
    year: Number,
    month: Number,
    amount: Number,
    remarks: String,   // ADD THIS
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

module.exports = mongoose.model("Payment", paymentSchema);