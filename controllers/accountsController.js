const Payment = require("../models/Payment");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getAccounts = async (req, res) => {

    try {

        const { year, month, day } = req.params;

        // Create day start and end (Sri Lanka timezone safe)
        const start = new Date(Date.UTC(year, month - 1, day));
        const end = new Date(Date.UTC(year, month - 1, Number(day) + 1));

        // =============================
        // FETCH DATA
        // =============================

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
        // PAYMENTS
        // =============================

        payments.forEach(p => {

            const date = new Date(p.paidDate).toLocaleDateString("en-CA", {
                timeZone: "Asia/Colombo"
            });

            transactions.push({
                _id: p._id,
                date,
                type: "payment",
                description: "Monthly Payment",
                remarks: "",
                amount: p.amount
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
                type: "expense",
                description: e.description,
                remarks: "",
                amount: e.amount
            });

        });

        // =============================
        // SORT
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