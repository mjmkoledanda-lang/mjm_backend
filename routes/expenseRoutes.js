const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

router.post("/", async (req, res) => {

    try {

        const expense = new Expense({
            description: req.body.description,
            amount: req.body.amount
        });

        await expense.save();

        res.json(expense);

    } catch (error) {

        res.status(500).json({ message: "Failed to add expense" });

    }

});

module.exports = router;