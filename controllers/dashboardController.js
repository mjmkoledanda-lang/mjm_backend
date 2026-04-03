const Kanji = require("../models/Kanji");
const Qurban = require("../models/Qurban");

exports.getDashboardStats = async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split("T")[0];
        const year = new Date().getFullYear();

        // 🕌 Today Kanji
        const kanjiToday = await Kanji.countDocuments({
            date: todayStr
        });

        // 🐄 Qurban this year
        const qurbanThisYear = await Qurban.countDocuments({
            year: year
        });

        res.json({
            kanjiToday,
            qurbanThisYear
        });

    } catch (err) {
        console.log("Dashboard Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.getKanjiDailyCounts = async (req, res) => {
    try {
        const data = await Kanji.aggregate([
            {
                $group: {
                    _id: "$date", // group by date
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 } // oldest → newest
            }
        ]);

        res.json(data);

    } catch (err) {
        console.log("Kanji Daily Error:", err);
        res.status(500).json({ message: err.message });
    }
};