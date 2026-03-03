const Family = require("../models/Family");
const Member = require("../models/Member");

exports.filterFamilies = async (req, res) => {
    try {

        const filters = req.body || {};
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
        } = filters;

        let results = [];

        // =========================
        // BUILD HEAD QUERY
        // =========================
        let headQuery = {};

        if (gsDivision) headQuery.gsDivision = gsDivision;
        if (houseType) headQuery.houseType = houseType;
        if (landOwnership) headQuery.landOwnership = landOwnership;
        if (disasterStatus) headQuery.disasterStatus = disasterStatus;
        if (occupation) headQuery.headOccupation = occupation;
        if (educationLevel) headQuery.headEducationLevel = educationLevel;

        if (disability) {
            headQuery.headDisabilityDetails = {
                $regex: disability,
                $options: "i"
            };
        }

        if (widow !== undefined && widow !== "") {
            headQuery.widow = widow === "true";
        }

        if (converted !== undefined && converted !== "") {
            headQuery.converted = converted === "true";
        }

        // =========================
        // GENDER LOGIC (HEAD ONLY IF WIDOW/CONVERTED)
        // =========================
        if (gender === "HEAD_MALE") {
            headQuery.headGender = { $regex: "^male$", $options: "i" };
        }

        else if (gender === "HEAD_FEMALE") {
            headQuery.headGender = { $regex: "^female$", $options: "i" };
        }

        // =========================
        // IF WIDOW OR CONVERTED → ONLY HEAD
        // =========================
        if (widow || converted) {

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

            return res.json(results);
        }

        // =========================
        // OTHERWISE NORMAL FILTER (HEAD + MEMBERS)
        // =========================

        let memberQuery = {};

        if (occupation) memberQuery.occupation = occupation;
        if (educationLevel) memberQuery.educationLevel = educationLevel;
        if (program) memberQuery.programs = program;

        if (disability) {
            memberQuery.disabilityDetails = {
                $regex: disability,
                $options: "i"
            };
        }

        if (gender === "MALE") {
            headQuery.headGender = { $regex: "^male$", $options: "i" };
            memberQuery.gender = { $regex: "^male$", $options: "i" };
        }

        else if (gender === "FEMALE") {
            headQuery.headGender = { $regex: "^female$", $options: "i" };
            memberQuery.gender = { $regex: "^female$", $options: "i" };
        }

        const heads = await Family.find(headQuery);
        const members = await Member.find(memberQuery).populate("family");

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
        console.log("FILTER ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};