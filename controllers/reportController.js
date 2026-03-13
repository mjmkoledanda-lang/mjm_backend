const Family = require("../models/Family");
const Payment = require("../models/Payment");

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

        // 1️⃣ Get all families
        const families = await Family.find().sort({ familyId: 1 });

        // 2️⃣ Get all payments
        const payments = await Payment.find();

        // 3️⃣ Constants
        const START_YEAR = 2020;
        const START_MONTH = 1;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const totalMonths =
            (currentYear - START_YEAR) * 12 +
            (currentMonth - START_MONTH + 1);

        // 4️⃣ Add arrears to each family
        const familiesWithArrears = families.map(f => {

            const familyPayments = payments.filter(
                p => String(p.family) === String(f._id)
            );

            const totalPaid = familyPayments.reduce(
                (sum, p) => sum + Number(p.amount || 0),
                0
            );

            const expectedTotal =
                totalMonths * Number(f.monthlyAmount || 0);

            const arrearsFromPayments =
                Math.max(expectedTotal - totalPaid, 0);

            const manualArrears =
                Number(f.manualArrears || 0);

            const totalArrears =
                arrearsFromPayments + manualArrears;

            return {
                ...f.toObject(),
                totalArrears
            };

        });

        // 5️⃣ Payments only for selected year (for checkmarks)
        const paymentsOfYear = payments.filter(
            p => Number(p.year) === year
        );

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