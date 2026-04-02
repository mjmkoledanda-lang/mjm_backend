const express = require("express");
const router = express.Router();

const Family = require("../models/Family");
const Payment = require("../models/Payment");
const { sendContactEmail } = require("../controllers/contactController");
const {getQRByNIC} = require("../controllers/publicController");

// ===============================
// SUMMARY ROUTE
// ===============================
router.get("/summary/:familyCode/:year", async (req, res) => {
    try {
        const { familyCode, year } = req.params;

        const value = familyCode.trim().toUpperCase();

        const cleanNIC = familyCode.trim().toUpperCase();

        const family = await Family.findOne({
            nic: cleanNIC
        });

        if (!family) {
            return res.status(404).json({ message: "Invalid Family ID" });
        }

        const monthlyAmount = parseFloat(family.monthlyAmount) || 0;

        const allPayments = await Payment.find({
            family: family._id
        });

        const paymentsByYear = {};
        let allPaidRecords = [];

        allPayments.forEach(p => {
            if (!paymentsByYear[p.year]) {
                paymentsByYear[p.year] = new Set();
            }

            paymentsByYear[p.year].add(Number(p.month));

            allPaidRecords.push({
                year: Number(p.year),
                month: Number(p.month)
            });
        });

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        let totalArrearsAllYears = 0;
        let totalUnpaidMonthsAllYears = 0;

        for (let y = 2020; y <= currentYear; y++) {
            const paidMonthsSet = paymentsByYear[y] || new Set();

            const totalMonths =
                y === currentYear ? currentMonth : 12;

            const unpaid = Math.max(
                0,
                totalMonths - paidMonthsSet.size
            );

            totalUnpaidMonthsAllYears += unpaid;
            totalArrearsAllYears += unpaid * monthlyAmount;
        }

        let lastPaid = null;

        if (allPaidRecords.length > 0) {
            lastPaid = allPaidRecords.reduce((latest, current) => {
                if (!latest) return current;

                if (
                    current.year > latest.year ||
                    (current.year === latest.year && current.month > latest.month)
                ) {
                    return current;
                }

                return latest;
            }, null);
        }

        const currentYearPayments = await Payment.find({
            family: family._id,
            year: Number(year)
        });

        const paidMonthsSet = new Set(
            currentYearPayments.map(p => Number(p.month))
        );

        const totalMonths =
            Number(year) === currentYear ? currentMonth : 12;

        const unpaidMonths = Math.max(
            0,
            totalMonths - paidMonthsSet.size
        );

        const arrears = unpaidMonths * monthlyAmount;

        res.json({
            headTitle: family.headTitle,
            headName: family.headName,
            familyId: family.familyId,
            monthlyAmount,

            paidMonths: [...paidMonthsSet],
            unpaidMonths,
            arrears,

            totalArrearsAllYears,
            totalUnpaidMonthsAllYears,

            lastPaidMonth: lastPaid ? lastPaid.month : null,
            lastPaidYear: lastPaid ? lastPaid.year : null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching summary" });
    }
});

// ===============================
// CONTACT ROUTE (ADD HERE ONLY)
// ===============================
router.post("/contact", sendContactEmail);


router.get("/qr-by-nic/:nic", getQRByNIC);
module.exports = router;