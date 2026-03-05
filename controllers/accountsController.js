const Payment = require("../models/Payment");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getAccounts = async (req, res) => {

    try {

        const { year, month } = req.params;

        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));

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
        // GROUP PAYMENTS
        // =============================
        const paymentMap = {};

        payments.forEach(p => {

            const date = new Date(p.paidDate).toLocaleDateString("en-CA", {
                timeZone: "Asia/Colombo"
            });

            if (!paymentMap[date]) {
                paymentMap[date] = {
                    total: 0,
                    originalDate: p.paidDate
                };
            }

            paymentMap[date].total += p.amount;

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
        // INCOMES
        // =============================

        incomes.forEach(i => {

            const date = new Date(i.date).toLocaleDateString("en-CA", {
                timeZone: "Asia/Colombo"
            });

            transactions.push({
                _id: i._id,
                date,
                originalDate: i.date,
                type: "income",
                description: i.description,
                remarks: "",
                amount: i.amount
            });

        });

        // =============================
        // EXPENSES
        // =============================

        expenses.forEach(e => {

            const date = new Date(e.date).toLocaleDateString("en-CA", {
                timeZone: "Asia/Colombo"
            });

            transactions.push({
                _id: e._id,
                date,
                originalDate: e.date,
                type: "expense",
                description: e.description,
                remarks: "",
                amount: e.amount
            });

        });

        // =============================
        // SORT TRANSACTIONS
        // =============================

        transactions.sort((a, b) => {
            return new Date(a.originalDate) - new Date(b.originalDate);
        });

        // ⭐ YOU MISSED THIS LINE
        res.json({ transactions });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load accounts"
        });

    }

};