const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment"); // ✅ IMPORTANT

const {
    getMonthlyReport,
    getDailyRolePaymentReport
} = require("../controllers/reportController");

// Monthly report
router.get("/monthly/:year", getMonthlyReport);

// Daily report
router.get("/daily-role", getDailyRolePaymentReport);

// ✅ ADD THIS NEW ROUTE
router.get("/monthly-role", async (req, res) => {
    try {
        const { month, year } = req.query;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const data = await Payment.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "collector",
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

module.exports = router;