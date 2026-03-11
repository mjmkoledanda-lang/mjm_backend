const mongoose = require("mongoose");

const customPaymentSchema = new mongoose.Schema({

    family: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Family"
    },

    familyId: String,

    headName: String,

    headTitle: String,

    type: String, // Donation, Zakat, etc

    amount: Number,

    date: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("CustomPayment", customPaymentSchema);