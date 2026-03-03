const Family = require("../models/Family");
const Member = require("../models/Member");

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
            disability,
            widow,
            converted
        } = req.body || {};

        let results = [];

        // =========================
        // 1️⃣ WIDOW / CONVERTED → HEAD ONLY
        // =========================
        if (widow || converted) {

            let headQuery = {};

            if (widow !== undefined && widow !== "") {
                headQuery.widow = widow === "true";
            }

            if (converted !== undefined && converted !== "") {
                headQuery.converted = converted === "true";
            }

            const heads = await Family.find(headQuery);

            heads.forEach(f => {
                results.push({
                    type: "HEAD",
                    name: f.headName,
                    gender: f.headGender,
                    familyId: f.familyId,
                    occupation: f.headOccupation,
                    disability: f.headDisabilityDetails
                });
            });

            return res.json(results);
        }

        // =========================
        // 2️⃣ BUILD HEAD QUERY
        // =========================
        let headQuery = {};

        if (gender === "MALE")
            headQuery.headGender = { $regex: "^male$", $options: "i" };

        if (gender === "FEMALE")
            headQuery.headGender = { $regex: "^female$", $options: "i" };

        if (occupation)
            headQuery.headOccupation = occupation;

        if (educationLevel)
            headQuery.headEducationLevel = educationLevel;

        if (disability) {
            headQuery.headDisabilityDetails = {
                $regex: disability,
                $options: "i"
            };
        }

        // =========================
        // 3️⃣ BUILD MEMBER QUERY
        // =========================
        let memberQuery = {};

        if (gender === "MALE")
            memberQuery.gender = { $regex: "^male$", $options: "i" };

        if (gender === "FEMALE")
            memberQuery.gender = { $regex: "^female$", $options: "i" };

        if (occupation)
            memberQuery.occupation = occupation;

        if (educationLevel)
            memberQuery.educationLevel = educationLevel;

        if (program)
            memberQuery.programs = program;

        if (disability) {
            memberQuery.disabilityDetails = {
                $regex: disability,
                $options: "i"
            };
        }

        // =========================
        // 4️⃣ EXECUTE QUERIES
        // =========================
        const heads = await Family.find(headQuery);
        const members = await Member.find(memberQuery).populate("family");

        // =========================
        // 5️⃣ PUSH HEAD RESULTS
        // =========================
        heads.forEach(f => {
            results.push({
                type: "HEAD",
                name: f.headName,
                gender: f.headGender,
                familyId: f.familyId,
                occupation: f.headOccupation,
                disability: f.headDisabilityDetails
            });
        });

        // =========================
        // 6️⃣ PUSH MEMBER RESULTS
        // =========================
        members.forEach(m => {
            results.push({
                type: "MEMBER",
                name: m.name,
                gender: m.gender,
                familyId: m.family ? m.family.familyId : "",
                occupation: m.occupation,
                disability: m.disabilityDetails
            });
        });

        res.json(results);

    } catch (err) {
        console.log("FILTER ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};