const express = require("express");
const router = express.Router();
const CustomPayment = require("../models/CustomPayment");


// ==============================
// ADD CUSTOM PAYMENT
// ==============================

router.post("/", async (req, res) => {

    try {

        const payment = new CustomPayment({
            family: req.body.family,
            familyId: req.body.familyId,
            headName: req.body.headName,
            type: req.body.type,
            amount: req.body.amount
        });

        await payment.save();

        res.json(payment);

    } catch (err) {

        res.status(500).json({
            message: "Failed to add payment"
        });

    }

});


// ==============================
// GET ALL CUSTOM PAYMENTS
// ==============================

router.get("/", async (req, res) => {

    try {

        const payments = await CustomPayment
            .find()
            .sort({ date: -1 });

        res.json(payments);

    } catch (err) {

        res.status(500).json({
            message: "Failed to fetch payments"
        });

    }

});


// ==============================
// GET PAYMENTS BY FAMILY
// ==============================

router.get("/family/:familyId", async (req, res) => {

    try {

        const payments = await CustomPayment.find({
            familyId: req.params.familyId
        }).sort({ date: -1 });

        res.json(payments);

    } catch (err) {

        res.status(500).json({
            message: "Failed to fetch payments"
        });

    }

});


// ==============================
// UPDATE CUSTOM PAYMENT
// ==============================

router.put("/:id", async (req, res) => {

    try {

        const updatedPayment = await CustomPayment.findByIdAndUpdate(
            req.params.id,
            {
                type: req.body.type,
                amount: req.body.amount
            },
            { new: true }
        );

        res.json(updatedPayment);

    } catch (err) {

        res.status(500).json({
            message: "Failed to update payment"
        });

    }

});


// ==============================
// DELETE CUSTOM PAYMENT
// ==============================

router.delete("/:id", async (req, res) => {

    try {

        await CustomPayment.findByIdAndDelete(req.params.id);

        res.json({
            message: "Payment deleted successfully"
        });

    } catch (err) {

        res.status(500).json({
            message: "Failed to delete payment"
        });

    }

});


module.exports = router;