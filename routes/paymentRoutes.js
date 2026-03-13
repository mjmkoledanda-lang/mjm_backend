const express = require("express");
const router = express.Router();

const {
    markPayment,
    getPayments,
    deletePayment,
    markReceiptPrinted,
    getPaymentSummary,
    sendPaymentSMS,
    togglePaymentStatus,
    getTotalArrearsAllFamilies
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


// ==============================
// TOTAL ARREARS OF ALL FAMILIES
// ==============================
router.get(
    "/total-arrears-all",
    protect,
    authorizeRoles("superadmin", "admin"),
    getTotalArrearsAllFamilies
);


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
// Mark Receipt Printed + Send SMS
// ==============================
router.put(
    "/print/:id",
    protect,
    authorizeRoles("superadmin", "admin"),
    markReceiptPrinted
);


// ==============================
// Send SMS Manually
// ==============================
router.post(
    "/:id/send-sms",
    protect,
    authorizeRoles("superadmin", "admin"),
    sendPaymentSMS
);


// ==============================
// Toggle Payment Status
// ==============================
router.patch(
    "/:id/toggle",
    protect,
    authorizeRoles("superadmin", "admin"),
    togglePaymentStatus
);


// ==============================
// Get Payments By Family + Year
// (dynamic route must be after fixed routes)
// ==============================
router.get(
    "/:familyId/:year",
    protect,
    authorizeRoles("superadmin", "admin"),
    getPayments
);


// ==============================
// Delete Payment
// ==============================
router.delete(
    "/:id",
    protect,
    authorizeRoles("superadmin", "admin"),
    deletePayment
);


module.exports = router;