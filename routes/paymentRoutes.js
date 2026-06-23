const express = require("express");
const router = express.Router();

// ✅ IMPORT PAYMENT MODEL (CRITICAL FIX)
const Payment = require("../models/Payment");

const {
    markPayment,
    getPayments,
    deletePayment,
    markReceiptPrinted,
    getPaymentSummary,
    sendPaymentSMS,
    togglePaymentStatus,
    getTotalArrearsAllFamilies,
    sendAllArrearsSMS,
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

router.get(
    "/collector-details",
    protect,
    authorizeRoles("superadmin", "admin"),
    async (req, res) => {
        try {
            const { collectorId, month, year } = req.query;

            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const payments = await Payment.find({
                collectedBy: collectorId,
                paidDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
                .populate("family", "familyName")
                .sort({ paidDate: 1 });

            res.json({
                success: true,
                data: payments
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

router.post(
    "/send-all-arrears",
    protect,
    authorizeRoles("superadmin", "admin"),
    sendAllArrearsSMS
);

// ==============================
// ✅ MONTHLY ROLE REPORT (FIXED)
// ==============================
router.get("/monthly-role", async (req, res) => {
    try {
        const { month, year } = req.query;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const data = await Payment.aggregate([
            {
                $match: {
                    paidDate: {   // ✅ FIXED
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "collectedBy", // ✅ FIXED
                    foreignField: "_id",
                    as: "collectorInfo"
                }
            },
            { $unwind: "$collectorInfo" },
            {
                $group: {
                    _id: {
                        role: "$collectorInfo.role",
                        user: "$collectorInfo.name"
                    },
                    total: { $sum: "$amount" }
                }
            },
            {
                $group: {
                    _id: "$_id.role",
                    users: {
                        $push: {
                            name: "$_id.user",
                            total: "$total"
                        }
                    },
                    roleTotal: { $sum: "$total" }
                }
            }
        ]);

        res.json({ success: true, data });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

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
