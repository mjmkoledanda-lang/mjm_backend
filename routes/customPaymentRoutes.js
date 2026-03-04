const express = require("express");
const router = express.Router();
const CustomPayment = require("../models/CustomPayment");


// ==============================
// ADD CUSTOM PAYMENT
// ==============================

router.post("/", async (req,res)=>{

    try{

        const payment = new CustomPayment(req.body);

        await payment.save();

        res.json(payment);

    }catch(err){

        res.status(500).json({
            message:"Failed to add payment"
        });

    }

});


// ==============================
// GET ALL CUSTOM PAYMENTS
// ==============================

router.get("/", async (req,res)=>{

    try{

        const payments = await CustomPayment
            .find()
            .sort({date:-1});

        res.json(payments);

    }catch(err){

        res.status(500).json({
            message:"Failed to fetch payments"
        });

    }

});


// ==============================
// GET PAYMENTS BY FAMILY
// ==============================

router.get("/:familyId", async(req,res)=>{

    try{

        const payments = await CustomPayment.find({
            familyId:req.params.familyId
        }).sort({date:-1});

        res.json(payments);

    }catch(err){

        res.status(500).json({
            message:"Failed to fetch payments"
        });

    }

});

module.exports = router;