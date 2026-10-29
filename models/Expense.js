const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({

    description: String,

    amount: Number,

    date: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Expense", expenseSchema);