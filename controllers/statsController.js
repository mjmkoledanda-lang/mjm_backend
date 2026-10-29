const Family = require("../models/Family");
const Member = require("../models/Member");

// Helper: Calculate age category from Date of Birth
const categorizeAge = (dob) => {
    if (!dob) return "Not Specified";
    const d = new Date(dob);
    if (isNaN(d.getTime())) return "Not Specified";
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
        age--;
    }
    if (age < 0 || age > 130) return "Not Specified";
    if (age <= 12) return "Children (0-12 yrs)";
    if (age <= 19) return "Teens (13-19 yrs)";
    if (age <= 35) return "Youth (20-35 yrs)";
    if (age <= 59) return "Adults (36-59 yrs)";
    return "Seniors (60+ yrs)";
};

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
                disability: h.headDisabilityDetails,
                ageGroup: categorizeAge(h.headDateOfBirth)
            });
        });

        members.forEach(m => {
            people.push({
                gender: m.gender,
                occupation: m.occupation,
                education: m.educationLevel,
                marital: m.maritalStatus,
                disability: m.disabilityDetails,
                ageGroup: categorizeAge(m.dob || m.dateOfBirth)
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

        const ageOrder = [
            "Children (0-12 yrs)",
            "Teens (13-19 yrs)",
            "Youth (20-35 yrs)",
            "Adults (36-59 yrs)",
            "Seniors (60+ yrs)",
            "Not Specified"
        ];
        const ageCategories = ageOrder
            .map(cat => ({
                _id: cat,
                count: people.filter(p => p.ageGroup === cat).length
            }))
            .filter(item => item.count > 0);

        res.json({
            totalPeople: people.length,
            gender: groupBy("gender"),
            occupation: groupBy("occupation"),
            education: groupBy("education"),
            marital: groupBy("marital"),
            disability: groupBy("disability"),
            ageCategories
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
        const heads = await Family.find();

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

        const ageOrder = [
            "Children (0-12 yrs)",
            "Teens (13-19 yrs)",
            "Youth (20-35 yrs)",
            "Adults (36-59 yrs)",
            "Seniors (60+ yrs)",
            "Not Specified"
        ];
        const headAgeCounts = {};
        heads.forEach(h => {
            const cat = categorizeAge(h.headDateOfBirth);
            headAgeCounts[cat] = (headAgeCounts[cat] || 0) + 1;
        });
        const ageCategories = ageOrder
            .map(cat => ({
                _id: cat,
                count: headAgeCounts[cat] || 0
            }))
            .filter(item => item.count > 0);

        res.json({
            total,
            gender: await groupByField("headGender"),
            occupation: await groupByField("headOccupation"),
            education: await groupByField("headEducationLevel"),
            marital: await groupByField("headMaritalStatus"),
            disability: await groupByField("headDisabilityDetails"),
            ageCategories
        });

    } catch (err) {
        console.log("HEAD STATS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};