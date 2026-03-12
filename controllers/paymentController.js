const Payment = require("../models/Payment");
const Family = require("../models/Family");
const sendSMS = require("../utils/sendSMS");

// ================================
// CREATE OR MARK PAYMENT
// ================================
exports.markPayment = async (req, res) => {
    try {

        const { family, year, month } = req.body;

        if (!family || !year || !month) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const familyData = await Family.findById(family);

        if (!familyData)
            return res.status(404).json({ message: "Family not found" });

        const yearNum = Number(year);
        const monthNum = Number(month);

        const amountNum = Number(familyData.monthlyAmount);

        let payment = await Payment.findOne({
            family,
            year: yearNum,
            month: monthNum
        });

        if (payment) {

            payment.paidDate = new Date();
            payment.amount = amountNum;
            await payment.save();

        } else {

            payment = await Payment.create({
                family,
                year: yearNum,
                month: monthNum,
                amount: amountNum,
                paidDate: new Date(),
                receiptPrinted: false
            });

        }

        res.status(200).json(payment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ================================
// TOGGLE PAYMENT STATUS
// ================================
exports.togglePaymentStatus = async (req, res) => {
    try {

        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        payment.paid = !payment.paid;

        await payment.save();

        res.json(payment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ================================
// GET PAYMENTS BY FAMILY + YEAR
// ================================
exports.getPayments = async (req, res) => {
    try {

        const familyId = req.params.familyId;
        const year = Number(req.params.year);

        if (!familyId || !year) {
            return res.status(400).json({
                message: "Family and year required"
            });
        }

        const payments = await Payment.find({
            family: familyId,
            year
        }).sort({ month: 1 });

        res.json(payments);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ================================
// MARK RECEIPT AS PRINTED + SEND SMS
// ================================
exports.markReceiptPrinted = async (req, res) => {
    try {

        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        payment.receiptPrinted = true;
        await payment.save();

        const family = await Family.findById(payment.family);

        if (family && family.phone) {

            const phone = "94" + family.phone.replace(/^0/, "");

            // months and year coming from frontend
            const { months, year } = req.body;

            const monthNames = [
                "Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"
            ];

            let paidFor = "N/A";

            if (months && months.length > 0) {

                const uniqueMonths = [...new Set(months)].sort((a,b)=>a-b);

                paidFor = uniqueMonths
                    .map(m => `${monthNames[m-1]} ${year}`)
                    .join(", ");
            }

            // 🔥 Calculate arrears
            const payments = await Payment.find({
                family: family._id
            });

            const START_YEAR = 2020;
            const START_MONTH = 1;

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;

            const totalMonths =
                (currentYear - START_YEAR) * 12 +
                (currentMonth - START_MONTH + 1);

            const expectedTotal =
                totalMonths * Number(family.monthlyAmount || 0);

            const totalPaid = payments.reduce(
                (sum, p) => sum + Number(p.amount || 0),
                0
            );

            const totalArrears = Math.max(expectedTotal - totalPaid, 0);

            const amount =
                (months?.length || 1) * Number(family.monthlyAmount || 0);

            const message = `Muhiyaddeen Jummah Masjid, Koledanda, Weligama.

Payment Receipt

Family ID: ${family.familyId}
Name: ${family.headTitle ? family.headTitle + " " : ""}${family.headName}

Paid For: ${paidFor}

Amount: Rs.${amount.toLocaleString()}
Total Arrears: Rs.${totalArrears.toLocaleString()}

Date: ${new Date().toLocaleDateString()}

Jazakallah Khair.`;

            await sendSMS(phone, message);
        }

        res.json({
            message: "Receipt printed & SMS sent",
            payment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// ================================
// PAYMENT SUMMARY
// ================================
exports.getPaymentSummary = async (req, res) => {
    try {

        const { familyId } = req.params;

        const family = await Family.findOne({ familyId });

        if (!family) {
            return res.status(404).json({ message: "Family not found" });
        }

        const payments = await Payment.find({
            family: family._id
        }).sort({ year: -1, month: -1 });

        const START_YEAR = 2020;
        const START_MONTH = 1;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const totalMonths =
            (currentYear - START_YEAR) * 12 +
            (currentMonth - START_MONTH + 1);

        const expectedTotal =
            totalMonths * Number(family.monthlyAmount || 0);

        const totalPaid = payments.reduce(
            (sum, p) => sum + Number(p.amount || 0),
            0
        );

        const totalArrears = Math.max(expectedTotal - totalPaid, 0);

        const lastPayment = payments.length > 0 ? payments[0] : null;

        return res.json({
            lastPaymentDate: lastPayment ? lastPayment.paidDate : null,
            lastPaidMonth: lastPayment
                ? `${lastPayment.month}/${lastPayment.year}`
                : null,
            totalArrears
        });

    } catch (err) {
        console.error("Summary Error:", err);
        res.status(500).json({ message: err.message });
    }
};


// ================================
// MANUAL SMS SEND
// ================================
exports.sendPaymentSMS = async (req, res) => {
    try {

        const payment = await Payment.findById(req.params.id);

        if (!payment)
            return res.status(404).json({ message: "Payment not found" });

        const family = await Family.findById(payment.family);

        if (!family || !family.phone)
            return res.status(400).json({ message: "Family phone not found" });

        const phone = "94" + family.phone.replace(/^0/, "");

        const { months, year } = req.body;

        const monthNames = [
            "Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"
        ];

        let paidFor = "N/A";

        if (months && months.length > 0) {

            const uniqueMonths = [...new Set(months)].sort((a,b)=>a-b);

            paidFor = uniqueMonths
                .map(m => `${monthNames[m-1]} ${year}`)
                .join(", ");
        }

        // 🔥 Calculate arrears
        const payments = await Payment.find({
            family: family._id
        });

        const START_YEAR = 2020;
        const START_MONTH = 1;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const totalMonths =
            (currentYear - START_YEAR) * 12 +
            (currentMonth - START_MONTH + 1);

        const expectedTotal =
            totalMonths * Number(family.monthlyAmount || 0);

        const totalPaid = payments.reduce(
            (sum, p) => sum + Number(p.amount || 0),
            0
        );

        const totalArrears = Math.max(expectedTotal - totalPaid, 0);

        const amount =
            (months?.length || 1) * Number(family.monthlyAmount || 0);

        const message = `Muhiyaddeen Jummah Masjid, Koledanda, Weligama.

Payment Receipt

Family ID: ${family.familyId}
Name: ${family.headTitle ? family.headTitle + " " : ""}${family.headName}

Paid For: ${paidFor}

Amount: Rs.${amount.toLocaleString()}
Total Arrears: Rs.${totalArrears.toLocaleString()}

Date: ${new Date().toLocaleDateString()}

Jazakallah Khair.`;

        await sendSMS(phone, message);

        res.json({ message: "SMS sent successfully" });

    } catch (error) {

        console.log(error);
        res.status(500).json({ message: "SMS failed" });

    }
};


// ================================
// DELETE PAYMENT
// ================================
exports.deletePayment = async (req, res) => {
    try {

        await Payment.findByIdAndDelete(req.params.id);

        res.json({ message: "Payment removed" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};