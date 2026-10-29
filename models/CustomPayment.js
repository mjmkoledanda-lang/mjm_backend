const mongoose = require("mongoose");

const CustomPaymentSchema = new mongoose.Schema({

    receiptNo: Number,

    familyId: {
        type: String,
        default: null
    },

    headTitle: String,
    headName: String,

    name: String,

    type: String,

    amount: Number,

    date: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });
module.exports = mongoose.model("CustomPayment", CustomPaymentSchema);