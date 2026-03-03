const Family = require("../models/Family");
const Member = require("../models/Member");   // 🔥 THIS IS REQUIRED


exports.filterFamilies = async (req, res) => {
    try {

        const {
            gender,
            occupation,
            educationLevel,
            gsDivision,
            houseType,
            landOwnership,
            disasterStatus,
            program,
            disability
        } = req.body;

        let results = [];

        // ================= HEAD FILTER =================
        let headQuery = {};

        if (gsDivision) headQuery.gsDivision = gsDivision;
        if (houseType) headQuery.houseType = houseType;
        if (landOwnership) headQuery.landOwnership = landOwnership;
        if (disasterStatus) headQuery.disasterStatus = disasterStatus;

        if (gender === "HEAD_MALE") headQuery.headGender = "MALE";
        if (gender === "HEAD_FEMALE") headQuery.headGender = "FEMALE";

        if (occupation) headQuery.headOccupation = occupation;
        if (educationLevel) headQuery.headEducationLevel = educationLevel;

        if (disability) {
            headQuery.headDisabilityDetails = {
                $regex: disability,
                $options: "i"
            };
        }

        const heads = await Family.find(headQuery);

        heads.forEach(f => {
            results.push({
                type: "HEAD",
                name: f.headName || "",
                gender: f.headGender || "",
                familyId: f.familyId || "",
                occupation: f.headOccupation || "",
                disability: f.headDisabilityDetails || ""
            });
        });

        // ================= MEMBER FILTER =================
        let memberQuery = {};

        if (gender === "MALE") memberQuery.gender = "MALE";
        if (gender === "FEMALE") memberQuery.gender = "FEMALE";
        if (occupation) memberQuery.occupation = occupation;
        if (educationLevel) memberQuery.educationLevel = educationLevel;
        if (program) memberQuery.programs = program;

        if (disability) {
            memberQuery.disabilityDetails = {
                $regex: disability,
                $options: "i"
            };
        }

        const members = await Member.find(memberQuery).populate("family");

        members.forEach(m => {
            results.push({
                type: "MEMBER",
                name: m.name || "",
                gender: m.gender || "",
                familyId: m.family ? m.family.familyId : "",
                occupation: m.occupation || "",
                disability: m.disabilityDetails || ""
            });
        });

        res.json(results);

    } catch (err) {
        console.log("FILTER ERROR:", err);   // 🔥 show real error
        res.status(500).json({ message: err.message });
    }
};