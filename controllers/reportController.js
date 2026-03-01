const Family = require("../models/Family");
const Payment = require("../models/Payment");

exports.getMonthlyReport = async (req, res) => {
    try {

        // 1️⃣ Get year from URL
        const year = Number(req.params.year);

        if (!year) {
            return res.status(400).json({
                message: "Year is required"
            });
        }

        // 2️⃣ Get all families sorted by familyId
        const families = await Family.find()
            .sort({ familyId: 1 });

        // 3️⃣ Get all payments for that year
        const payments = await Payment.find({
            year: year
        });

        // 4️⃣ Send both to frontend
        res.json({
            families,
            payments
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};