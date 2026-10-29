const express = require("express");
const router = express.Router();
const {
    initiatePayment,
    verifyPayment,
    handleWebhook,
    downloadReceiptPDF
} = require("../controllers/dialogPaymentController");

// Initiate online payment via Dialog Genie IPG
router.post("/initiate", initiatePayment);

// Verify payment status (by orderId, transactionId, or mongo _id)
router.get("/verify/:identifier", verifyPayment);

// Dialog Genie Webhook endpoint
router.post("/webhook", handleWebhook);

// Download PDF receipt
router.get("/receipt/:identifier/pdf", downloadReceiptPDF);

module.exports = router;
