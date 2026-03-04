const Payment = require("../models/Payment");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getAccounts = async (req, res) => {

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

    // GROUP PAYMENTS BY DATE
    const paymentMap = {};

    payments.forEach(p => {

        const date = new Date(p.paidDate).toISOString().split("T")[0];

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

    // INCOMES
    incomes.forEach(i => {

        transactions.push({
            id: i._id,
            date: i.date,
            type: "income",
            description: i.description,
            amount: i.amount
        });
    });

    // EXPENSES
    expenses.forEach(e => {

        transactions.push({
            id: e._id,
            date: e.date,
            type: "expense",
            description: e.description,
            amount: e.amount
        });

    });

    // SORT BY DATE
    transactions.sort((a,b)=> new Date(a.date) - new Date(b.date));

    res.json({ transactions });

};