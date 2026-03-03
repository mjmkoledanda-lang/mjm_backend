const Family = require("../models/Family");

exports.getHeadStats = async (req, res) => {
    try {

        const total = await Family.countDocuments();

        const groupByField = async (field) => {
            return await Family.aggregate([
                {
                    $group: {
                        _id: `$${field}`,
                        count: { $sum: 1 }
                    }
                }
            ]);
        };

        const gender = await groupByField("headGender");
        const occupation = await groupByField("headOccupation");
        const education = await groupByField("headEducationLevel");
        const marital = await groupByField("headMaritalStatus");
        const disability = await groupByField("headDisabilityDetails");

        res.json({
            total,
            gender,
            occupation,
            education,
            marital,
            disability
        });

    } catch (err) {
        console.log("STATS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};