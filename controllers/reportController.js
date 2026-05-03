const Family = require("../models/Family");
const Payment = require("../models/Payment");

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

        // 3️⃣ Build payment map
        const paymentTotals = {};
        const paymentsOfYear = [];

        payments.forEach(p => {

            const famId = String(p.family);

            if (!paymentTotals[famId]) {
                paymentTotals[famId] = 0;
            }

            paymentTotals[famId] += Number(p.amount || 0);

            if (Number(p.year) === year) {
                paymentsOfYear.push(p);
            }

        });

        // 4️⃣ Calculate arrears
        const START_YEAR = 2020;
        const START_MONTH = 1;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const totalMonths =
            (currentYear - START_YEAR) * 12 +
            (currentMonth - START_MONTH + 1);

        const familiesWithArrears = families.map(f => {

            const totalPaid = paymentTotals[String(f._id)] || 0;

            const expectedTotal =
                totalMonths * Number(f.monthlyAmount || 0);

            const arrearsFromPayments =
                Math.max(expectedTotal - totalPaid, 0);

            const manualArrears =
                Number(f.manualArrears || 0);

            const totalArrears =
                arrearsFromPayments + manualArrears;

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


