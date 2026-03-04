const Payment = require("../models/Payment");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getAccounts = async (req, res) => {

    try {

        const { year, month } = req.params;

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        const payments = await Payment.find({
            paidDate: { $gte: start, $lt: end }
        });

        const incomes = await Income.find({
            date: { $gte: start, $lt: end }
        });

        const expenses = await Expense.find({
            date: { $gte: start, $lt: end }
        });

        const transactions = [];

        // =============================
        // GROUP PAYMENTS BY LOCAL DATE
        // =============================

        const paymentMap = {};

        payments.forEach(p => {

            const d = new Date(p.paidDate);

            const date =
                d.getFullYear() +
                "-" +
                String(d.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(d.getDate()).padStart(2, "0");

            if (!paymentMap[date]) {
                paymentMap[date] = 0;
            }

            paymentMap[date] += p.amount;

        });

        Object.keys(paymentMap).forEach(date => {

            transactions.push({
                date: date,
                type: "payment",
                description: "Monthly Payment",
                remarks: "",
                amount: paymentMap[date]
            });

        });

        // =============================
        // INCOME TRANSACTIONS
        // =============================

        incomes.forEach(i => {

            const d = new Date(i.date);

            const date =
                d.getFullYear() +
                "-" +
                String(d.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(d.getDate()).padStart(2, "0");

            transactions.push({
                _id: i._id,
                date: date,
                type: "income",
                description: i.description,
                remarks: "",
                amount: i.amount
            });

        });

        // =============================
        // EXPENSE TRANSACTIONS
        // =============================

        expenses.forEach(e => {

            const d = new Date(e.date);

            const date =
                d.getFullYear() +
                "-" +
                String(d.getMonth() + 1).padStart(2, "0") +
                "-" +
                String(d.getDate()).padStart(2, "0");

            transactions.push({
                _id: e._id,
                date: date,
                type: "expense",
                description: e.description,
                remarks: "",
                amount: e.amount
            });

        });

        // =============================
        // SORT BY DATE
        // =============================

        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ transactions });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load accounts"
        });

    }

};