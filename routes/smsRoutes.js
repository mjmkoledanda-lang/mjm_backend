const express = require("express");
const router = express.Router();

const {
    sendPaymentSMS,
    sendCustomSMS
} = require("../controllers/smsController"); // ✅ fixed

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


// ==============================
// Send SMS for a Payment Receipt
// ==============================
router.post(
    "/send-payment/:id",
    protect,
    authorizeRoles("superadmin", "admin"),
    sendPaymentSMS
);


// ==============================
// Send Custom SMS to All Families
// ==============================
router.post(
    "/send-custom",
    protect,
    authorizeRoles("superadmin"),
    sendCustomSMS
);

module.exports = router;