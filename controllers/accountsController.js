const Payment = require("../models/Payment");
const Income = require("../models/Income");
const Expense = require("../models/Expense");

exports.getAccounts = async (req, res) => {

    const { year, month } = req.params;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const payments = await Payment.find({
        paidDate: { $gte: start, $lt: end }
    }).populate("family");

    const incomes = await Income.find({
        date: { $gte: start, $lt: end }
    });

    const expenses = await Expense.find({
        date: { $gte: start, $lt: end }
    });

    const transactions = [];

    payments.forEach(p => {

        transactions.push({
            date: p.paidDate,
            type: "payment",
            description: `Family ${p.family.familyId}`,
            remarks: p.remarks || "",
            amount: p.amount
        });

    });

    incomes.forEach(i => {

        transactions.push({
            date: i.date,
            type: "income",
            description: i.description,
            amount: i.amount
        });

    });

    expenses.forEach(e => {

        transactions.push({
            date: e.date,
            type: "expense",
            description: e.description,
            amount: e.amount
        });

    });

    transactions.sort((a,b)=> new Date(a.date) - new Date(b.date));

    res.json({ transactions });

};