const Payment = require("../models/Payment");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getAccounts = async (req, res) => {

    try {

        const { year, month } = req.params;

        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));

        // =============================
        // FETCH DATA (FAST QUERIES)
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

            transactions.push({
                date,
                originalDate: paymentMap[date].originalDate,
                type: "payment",
                description: "Monthly Payment",
                remarks: "",
                amount: paymentMap[date].total
            });

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

        res.json({ transactions });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load accounts"
        });

    }

};