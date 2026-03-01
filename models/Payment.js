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
    paidDate: {
        type: Date,
        default: Date.now
    },
    receiptPrinted: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Payment", paymentSchema);