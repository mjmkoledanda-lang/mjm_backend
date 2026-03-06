const express = require("express");
const router = express.Router();

const smsController = require("../controllers/smsController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


// ==============================
// Send SMS for a Payment Receipt
// ==============================
router.post(
    "/send-payment/:id",
    protect,
    authorizeRoles("superadmin", "admin"),
    smsController.sendPaymentSMS
);


// ==============================
// Send Custom SMS to All Families
// ==============================
router.post(
    "/send-custom",
    protect,
    authorizeRoles("superadmin"),
    smsController.sendCustomSMS
);

module.exports = router;