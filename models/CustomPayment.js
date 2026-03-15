const mongoose = require("mongoose");

const CustomPaymentSchema = new mongoose.Schema({
    receiptNo: {
        type: Number,
        unique: true
    },

    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family"
    },

    name: String,
    description: String,
    amount: Number,

    date: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("CustomPayment", CustomPaymentSchema);