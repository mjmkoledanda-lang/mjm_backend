const mongoose = require("mongoose");

const onlinePaymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        transactionId: {
            type: String,
            index: true,
            sparse: true
        },

        family: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
            required: true
        },

        familyId: {
            type: String,
            required: true
        },

        headTitle: String,
        headName: String,
        nic: String,

        phone: {
            type: String,
            required: true
        },

        months: {
            type: [Number],
            required: true
        },

        year: {
            type: Number,
            required: true
        },

        monthlyAmount: {
            type: Number,
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        currency: {
            type: String,
            default: "LKR"
        },

        status: {
            type: String,
            enum: ["INITIATED", "PENDING", "CONFIRMED", "AUTHORIZED", "FAILED", "CANCELLED"],
            default: "INITIATED",
            index: true
        },

        paymentUrl: String,

        paymentDate: Date,

        receiptNo: {
            type: String,
            unique: true,
            sparse: true
        },

        smsSent: {
            type: Boolean,
            default: false
        },

        smsSentAt: Date,

        smsResponse: mongoose.Schema.Types.Mixed,

        smsError: String,

        genieResponse: mongoose.Schema.Types.Mixed,

        paymentsRecorded: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("OnlinePayment", onlinePaymentSchema);
