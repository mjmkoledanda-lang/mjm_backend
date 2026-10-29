const Payment = require("../models/Payment");
const Income = require("../models/Income");
const Expense = require("../models/Expense");
const AccountAdjustment = require("../models/AccountAdjustment");

exports.getAccounts = async (req, res) => {
    try {
        const { year, month } = req.params;

        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));

        const startDateStr = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDateStr = `${year}-${String(month).padStart(2, "0")}-31`;

        // =============================
        // OPENING BALANCE CALCULATION
        // =============================

        const previousPayments = await Payment.aggregate([
            { $match: { paidDate: { $lt: start } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const previousIncomes = await Income.aggregate([
            { $match: { date: { $lt: start } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const previousExpenses = await Expense.aggregate([
            { $match: { date: { $lt: start } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalPrevPayments = previousPayments[0]?.total || 0;
        const totalPrevIncomes = previousIncomes[0]?.total || 0;
        const totalPrevExpenses = previousExpenses[0]?.total || 0;

        // Apply any manual cashbook adjustments before this month
        const pastAdjustments = await AccountAdjustment.find({ date: { $lt: startDateStr } }).lean();
        let pastAdjDifference = 0;
        for (const adj of pastAdjustments) {
            const dateStart = new Date(`${adj.date}T00:00:00.000Z`);
            const dateEnd = new Date(`${adj.date}T23:59:59.999Z`);
            const raw = await Payment.aggregate([
                { $match: { paidDate: { $gte: dateStart, $lte: dateEnd } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const rawTotal = raw[0]?.total || 0;
            const effectiveAmount = adj.isDeleted ? 0 : adj.amount;
            pastAdjDifference += (effectiveAmount - rawTotal);
        }

        const openingBalance =
            totalPrevPayments +
            totalPrevIncomes -
            totalPrevExpenses +
            pastAdjDifference;

        // =============================
        // FETCH DATA
        // =============================

        const payments = await Payment.find({
            paidDate: { $gte: start, $lt: end }
        })
            .select("paidDate amount")
            .lean();

        const incomes = await Income.find({
            date: { $gte: start, $lt: end }
        })
            .select("date description amount")
            .lean();

        const expenses = await Expense.find({
            date: { $gte: start, $lt: end }
        })
            .select("date description amount")
            .lean();

        // Fetch adjustments for current month
        const currentAdjustments = await AccountAdjustment.find({
            date: { $gte: startDateStr, $lte: endDateStr }
        }).lean();

        const adjMap = {};
        currentAdjustments.forEach(a => {
            adjMap[a.date] = a;
        });

        // =============================
        // FAST DATE FORMAT FUNCTION
        // =============================

        const formatDate = (d) => {
            return new Date(d).toISOString().slice(0, 10);
        };

        const transactions = [];

        // =============================
        // GROUP PAYMENTS BY DATE
        // =============================

        const paymentMap = {};

        payments.forEach(p => {
            const date = formatDate(p.paidDate);

            if (!paymentMap[date]) {
                paymentMap[date] = {
                    total: 0,
                    originalDate: p.paidDate
                };
            }

            paymentMap[date].total += Number(p.amount || 0);
        });

        Object.keys(paymentMap).forEach(date => {
            const adj = adjMap[date];
            if (adj && adj.isDeleted) {
                return; // Skipped / deleted from cashbook
            }

            const description = adj ? adj.description : "Monthly Payment";
            const amount = adj ? adj.amount : paymentMap[date].total;
            const _id = adj ? adj._id : date;

            transactions.push({
                _id,
                date,
                originalDate: paymentMap[date].originalDate,
                type: "payment",
                description,
                remarks: "",
                amount
            });
        });

        // Add any adjustments for dates with 0 raw payments
        currentAdjustments.forEach(adj => {
            if (!paymentMap[adj.date] && !adj.isDeleted && adj.amount > 0) {
                transactions.push({
                    _id: adj._id,
                    date: adj.date,
                    originalDate: new Date(`${adj.date}T12:00:00.000Z`),
                    type: "payment",
                    description: adj.description,
                    remarks: "",
                    amount: adj.amount
                });
            }
        });

        // =============================
        // ADD INCOMES
        // =============================

        incomes.forEach(i => {
            transactions.push({
                _id: i._id,
                date: formatDate(i.date),
                originalDate: i.date,
                type: "income",
                description: i.description,
                remarks: "",
                amount: Number(i.amount || 0)
            });
        });

        // =============================
        // ADD EXPENSES
        // =============================

        expenses.forEach(e => {
            transactions.push({
                _id: e._id,
                date: formatDate(e.date),
                originalDate: e.date,
                type: "expense",
                description: e.description,
                remarks: "",
                amount: Number(e.amount || 0)
            });
        });

        // =============================
        // SORT TRANSACTIONS BY DATE
        // =============================

        transactions.sort((a, b) => {
            return new Date(a.originalDate) - new Date(b.originalDate);
        });

        // =============================
        // RESPONSE
        // =============================

        res.json({
            openingBalance,
            transactions
        });

    } catch (error) {
        console.error("GET ACCOUNTS ERROR:", error);
        res.status(500).json({
            message: "Failed to load accounts"
        });
    }
};

// =============================
// UPDATE MONTHLY PAYMENT IN CASHBOOK
// =============================
exports.updatePaymentAccount = async (req, res) => {
    try {
        const { date } = req.params;
        const { description, amount } = req.body;

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const adj = await AccountAdjustment.findOneAndUpdate(
            { date },
            {
                date,
                description: description || "Monthly Payment",
                amount: Number(amount) || 0,
                isDeleted: false
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: "Monthly payment updated in cash book",
            adjustment: adj
        });
    } catch (error) {
        console.error("Update payment in accounts error:", error);
        res.status(500).json({
            message: error.message || "Failed to update payment in accounts"
        });
    }
};

// =============================
// DELETE MONTHLY PAYMENT FROM CASHBOOK
// =============================
exports.deletePaymentAccount = async (req, res) => {
    try {
        const { date } = req.params;

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const adj = await AccountAdjustment.findOneAndUpdate(
            { date },
            {
                date,
                description: "Monthly Payment (Removed)",
                amount: 0,
                isDeleted: true
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: "Monthly payment removed from cash book",
            adjustment: adj
        });
    } catch (error) {
        console.error("Delete payment in accounts error:", error);
        res.status(500).json({
            message: error.message || "Failed to delete payment from accounts"
        });
    }
};
