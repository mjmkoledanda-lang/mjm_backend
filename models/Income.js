const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({

    description: String,

    amount: Number,

    date: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Income", incomeSchema);