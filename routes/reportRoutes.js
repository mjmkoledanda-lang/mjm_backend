const express = require("express");
const router = express.Router();
const Family = require("../models/Family");
const Qurban = require("../models/Qurban");

const Payment = require("../models/Payment"); // ✅ IMPORTANT

const {
    getMonthlyReport,
    getDailyRolePaymentReport
} = require("../controllers/reportController");

// Monthly report
router.get("/monthly/:year", getMonthlyReport);

// Daily report
router.get("/daily-role", getDailyRolePaymentReport);




router.get("/qurban-not-collected/:year", async (req, res) => {
    try {
        const year = parseInt(req.params.year);

        // Get all qurban paid family IDs
        const paidFamilies = await Qurban.find({ year }).distinct("familyId");

        // Find families NOT in paid list
        const families = await Family.find({
            _id: { $nin: paidFamilies }
        })
            .select("familyId headName address");

        res.json({
            success: true,
            data: families
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

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
