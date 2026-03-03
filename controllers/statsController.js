const Family = require("../models/Family");
const Member = require("../models/Member");

// ================= FULL STATS =================
exports.getFullStats = async (req, res) => {
    try {

        const heads = await Family.find();
        const members = await Member.find();

        const people = [];

        heads.forEach(h => {
            people.push({
                gender: h.headGender,
                occupation: h.headOccupation,
                education: h.headEducationLevel,
                marital: h.headMaritalStatus,
                disability: h.headDisabilityDetails
            });
        });

        members.forEach(m => {
            people.push({
                gender: m.gender,
                occupation: m.occupation,
                education: m.educationLevel,
                marital: m.maritalStatus,
                disability: m.disabilityDetails
            });
        });

        const groupBy = (field) => {
            const map = {};
            people.forEach(p => {
                const key = p[field] || "N/A";
                map[key] = (map[key] || 0) + 1;
            });

            return Object.keys(map).map(k => ({
                _id: k,
                count: map[k]
            }));
        };

        res.json({
            totalPeople: people.length,
            gender: groupBy("gender"),
            occupation: groupBy("occupation"),
            education: groupBy("education"),
            marital: groupBy("marital"),
            disability: groupBy("disability")
        });

    } catch (err) {
        console.log("STATS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};

// ================= HEAD ONLY STATS =================
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

        res.json({
            total,
            gender: await groupByField("headGender"),
            occupation: await groupByField("headOccupation"),
            education: await groupByField("headEducationLevel"),
            marital: await groupByField("headMaritalStatus"),
            disability: await groupByField("headDisabilityDetails")
        });

    } catch (err) {
        console.log("HEAD STATS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};