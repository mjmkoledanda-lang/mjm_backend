const express = require("express");
const router = express.Router();
const Income = require("../models/Income");


// =============================
// ADD INCOME
// =============================

router.post("/", async (req, res) => {

    try {

        const income = new Income({
            description: req.body.description,
            amount: req.body.amount
        });

        await income.save();

        res.json(income);

    } catch (error) {

        res.status(500).json({
            message: "Failed to add income"
        });

    }

});


// =============================
// UPDATE INCOME
// =============================

router.put("/:id", async (req, res) => {

    try {

        const income = await Income.findByIdAndUpdate(
            req.params.id,
            {
                description: req.body.description,
                amount: req.body.amount
            },
            { new: true }
        );

        res.json(income);

    } catch (error) {

        res.status(500).json({
            message: "Failed to update income"
        });

    }

});


// =============================
// DELETE INCOME
// =============================

router.delete("/:id", async (req, res) => {

    try {

        await Income.findByIdAndDelete(req.params.id);

        res.json({
            message: "Income deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to delete income"
        });

    }

});


// =============================
// GET ALL INCOME (optional)
// =============================

router.get("/", async (req, res) => {

    try {

        const incomes = await Income.find().sort({ date: -1 });

        res.json(incomes);

    } catch (error) {

        res.status(500).json({
            message: "Failed to fetch income"
        });

    }

});


module.exports = router;