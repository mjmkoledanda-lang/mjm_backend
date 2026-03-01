const express = require("express");
const router = express.Router();

const {
    markPayment,
    getPayments,
    deletePayment,
    markReceiptPrinted,
    getPaymentSummary,
    sendPaymentSMS, togglePaymentStatus   // ✅ make sure this exists in controller
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


// ==============================
// Payment Summary
// ==============================
router.get(
    "/summary/:familyId",
    protect,
    authorizeRoles("superadmin", "admin"),
    getPaymentSummary
);


// ==============================
// Create / Mark Payment
// ==============================
router.post(
    "/",
    protect,
    authorizeRoles("superadmin", "admin"),
    markPayment
);


// ==============================
// Get Payments By Year
// ==============================
router.get(
    "/:familyId/:year",
    protect,
    authorizeRoles("superadmin", "admin"),
    getPayments
);


// ==============================
// Mark Receipt Printed
// ==============================
router.put(
    "/mark-printed/:id",
    protect,
    authorizeRoles("superadmin", "admin"),
    markReceiptPrinted
);


// ==============================
// Send SMS Receipt
// ==============================
router.post(
    "/:id/send-sms",
    protect,
    authorizeRoles("superadmin", "admin"),
    sendPaymentSMS
);

router.patch(
    "/:id/toggle",
    protect,
    togglePaymentStatus
);

router.delete("/:id", protect, deletePayment);

module.exports = router;