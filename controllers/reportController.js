const Family = require("../models/Family");
const Payment = require("../models/Payment");
const { calculateFamilyArrears } = require("../utils/arrearsHelper");

exports.getMonthlyReport = async (req, res) => {
    try {

        const year = Number(req.params.year);

        if (!year) {
            return res.status(400).json({
                message: "Year is required"
            });
        }

        // 1️⃣ Get families (lean = faster)
        const families = await Family.find()
            .select("familyId headName headTitle monthlyAmount manualArrears")
            .lean()
            .sort({ familyId: 1 });

        // 2️⃣ Get payments
        const payments = await Payment.find()
            .select("family amount year month")
            .lean();

        // 3️⃣ Group payments by family and extract payments of requested year
        const paymentsByFamily = {};
        const paymentsOfYear = [];

        payments.forEach(p => {
            const famId = String(p.family);

            if (!paymentsByFamily[famId]) {
                paymentsByFamily[famId] = [];
            }
            paymentsByFamily[famId].push(p);

            if (Number(p.year) === year) {
                paymentsOfYear.push(p);
            }
        });

        // 4️⃣ Calculate arrears (avoids retroactively adding arrears from 2020)
        const now = new Date();
        const familiesWithArrears = families.map(f => {
            const famPayments = paymentsByFamily[String(f._id)] || [];
            const { totalArrears } = calculateFamilyArrears(f, famPayments, now);

            return {
                ...f,
                totalArrears
            };
        });

        res.json({
            families: familiesWithArrears,
            payments: paymentsOfYear
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


exports.getDailyRolePaymentReport = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);

        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const report = await Payment.aggregate([
            {
                $match: {
                    paidDate: { $gte: start, $lte: end }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "collectedBy",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },

            {
                $group: {
                    _id: {
                        role: "$user.role",
                        userId: "$user._id",
                        name: "$user.name"
                    },
                    total: { $sum: "$amount" }
                }
            },

            {
                $group: {
                    _id: "$_id.role",
                    users: {
                        $push: {
                            name: "$_id.name",
                            total: "$total"
                        }
                    },
                    roleTotal: { $sum: "$total" }
                }
            },

            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            date,
            data: report
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching report" });
    }
};


