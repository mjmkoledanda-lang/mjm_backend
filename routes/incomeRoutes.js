const express = require("express");
const router = express.Router();
const Income = require("../models/Income");

router.post("/", async (req, res) => {

    try {

        const income = new Income({
            description: req.body.description,
            amount: req.body.amount
        });

        await income.save();

        res.json(income);

    } catch (error) {

        res.status(500).json({ message: "Failed to add income" });

    }

});

module.exports = router;