const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");


// =============================
// ADD EXPENSE
// =============================

router.post("/", async (req, res) => {

    try {

        const expense = new Expense({
            description: req.body.description,
            amount: req.body.amount
        });

        await expense.save();

        res.json(expense);

    } catch (error) {

        res.status(500).json({
            message: "Failed to add expense"
        });

    }

});


// =============================
// UPDATE EXPENSE
// =============================

router.put("/:id", async (req, res) => {

    try {

        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            {
                description: req.body.description,
                amount: req.body.amount
            },
            { new: true }
        );

        res.json(expense);

    } catch (error) {

        res.status(500).json({
            message: "Failed to update expense"
        });

    }

});


// =============================
// DELETE EXPENSE
// =============================

router.delete("/:id", async (req, res) => {

    try {

        await Expense.findByIdAndDelete(req.params.id);

        res.json({
            message: "Expense deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to delete expense"
        });

    }

});


// =============================
// GET ALL EXPENSES (optional)
// =============================

router.get("/", async (req, res) => {

    try {

        const expenses = await Expense.find().sort({ date: -1 });

        res.json(expenses);

    } catch (error) {

        res.status(500).json({
            message: "Failed to fetch expenses"
        });

    }

});


module.exports = router;