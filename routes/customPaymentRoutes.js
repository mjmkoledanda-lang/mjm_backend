const express = require("express");
const router = express.Router();
const CustomPayment = require("../models/CustomPayment");


// ==============================
// ADD CUSTOM PAYMENT
// ==============================

router.post("/", async (req, res) => {
    try {

        const lastPayment = await CustomPayment
            .findOne()
            .sort({ receiptNo: -1 });

        let receiptNo = 1001;

        if (lastPayment && lastPayment.receiptNo) {
            receiptNo = lastPayment.receiptNo + 1;
        }

        const payment = new CustomPayment({
            receiptNo,

            // for family payments
            familyId: req.body.familyId || null,
            headTitle: req.body.headTitle || "",
            headName: req.body.headName || "",

            // for walk-in donors
            name: req.body.name || "",

            // payment type
            type: req.body.type || req.body.description || "Other",

            amount: Number(req.body.amount),
            date: req.body.date || new Date()

        });

        await payment.save();

        res.json(payment);

    } catch (err) {

        console.error("CUSTOM PAYMENT ERROR:", err);

        res.status(500).json({
            message: err.message
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