const Payment = require("../models/Payment");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getAccounts = async (req, res) => {

    try {

        const { year, month } = req.params;

        // =============================
        // FETCH DATA
        // =============================

        const payments = await Payment.find({
            year: Number(year),
            month: Number(month)
        });

        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));

        const incomes = await Income.find({
            date: { $gte: start, $lt: end }
        });

        const expenses = await Expense.find({
            date: { $gte: start, $lt: end }
        });

        const transactions = [];

        // =============================
        // GROUP PAYMENTS BY DATE
        // =============================

        const paymentMap = {};

        payments.forEach(p => {

            const date = new Date(p.paidDate).toLocaleDateString("en-CA", {
                timeZone: "Asia/Colombo"
            });

            if (!paymentMap[date]) {
                paymentMap[date] = 0;
            }

            paymentMap[date] += p.amount;

        });

        Object.keys(paymentMap).forEach(date => {

            transactions.push({
                date,
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

            const date = new Date(i.date).toLocaleDateString("en-CA", {
                timeZone: "Asia/Colombo"
            });

            transactions.push({
                _id: i._id,
                date,
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

            const date = new Date(e.date).toLocaleDateString("en-CA", {
                timeZone: "Asia/Colombo"
            });

            transactions.push({
                _id: e._id,
                date,
                type: "expense",
                description: e.description,
                remarks: "",
                amount: e.amount
            });

        });

        // =============================
        // SORT BY DATE
        // =============================

        transactions.sort((a, b) => a.date.localeCompare(b.date));

        res.json({ transactions });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load accounts"
        });

    }

};