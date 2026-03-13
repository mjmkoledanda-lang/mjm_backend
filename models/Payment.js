const mongoose = require("mongoose");

const {
    markPayment,
    getPayments,
    deletePayment,
    markReceiptPrinted,
    getPaymentSummary,
    sendPaymentSMS,
    togglePaymentStatus,
    getTotalArrearsAllFamilies
} = require("../controllers/paymentController");


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

// 🔥 VERY IMPORTANT INDEX
paymentSchema.index({ family: 1, year: 1, month: 1 });

module.exports = mongoose.model("Payment", paymentSchema);