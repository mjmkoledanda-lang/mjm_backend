const Family = require("../models/Family");
const Member = require("../models/Member");

exports.getFullStats = async (req, res) => {
    try {

        // Get all heads
        const heads = await Family.find();

        // Get all members
        const members = await Member.find();

        // Combine into single array
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