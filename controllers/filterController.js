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
            maritalStatus,
            converted,
            color   // ✅ ADD THIS
        } = req.body || {};

        let results = [];

        // =========================
        // CONVERTED → HEAD ONLY
        // =========================
        if (converted !== undefined && converted !== "") {

            let headQuery = {
                converted: converted === "true"
            };

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
        // BUILD HEAD QUERY
        // =========================
        let headQuery = {};

        if (gender === "MALE")
            headQuery.headGender = { $regex: "^male$", $options: "i" };

        if (color) {
            headQuery.color = color;
        }

        if (gender === "FEMALE")
            headQuery.headGender = { $regex: "^female$", $options: "i" };

        if (occupation)
            headQuery.headOccupation = occupation;

        if (educationLevel)
            headQuery.headEducationLevel = educationLevel;

        if (maritalStatus)
            headQuery.headMaritalStatus = maritalStatus;

        // =============================
        // DISABILITY FILTER FOR HEAD
        // =============================
        if (disability === "true") {
            headQuery.headDisabilityDetails = { $ne: "" };
        }

        if (disability === "false") {
            headQuery.$or = [
                { headDisabilityDetails: "" },
                { headDisabilityDetails: null }
            ];
        }

        // =========================
// COLOR FILTER → HEAD ONLY
// =========================
        if (color) {

            let headQuery = { color };

            if (gender === "MALE")
                headQuery.headGender = { $regex: "^male$", $options: "i" };

            if (gender === "FEMALE")
                headQuery.headGender = { $regex: "^female$", $options: "i" };

            if (occupation)
                headQuery.headOccupation = occupation;

            if (educationLevel)
                headQuery.headEducationLevel = educationLevel;

            if (maritalStatus)
                headQuery.headMaritalStatus = maritalStatus;

            if (disability === "true")
                headQuery.headDisabilityDetails = { $ne: "" };

            if (disability === "false")
                headQuery.$or = [
                    { headDisabilityDetails: "" },
                    { headDisabilityDetails: null }
                ];

            const heads = await Family.find(headQuery);

            const results = heads.map(f => ({
                type: "HEAD",
                name: f.headName,
                gender: f.headGender,
                familyId: f.familyId,
                occupation: f.headOccupation,
                maritalStatus: f.headMaritalStatus,
                disability: f.headDisabilityDetails,
                color: f.color
            }));

            return res.json(results);
        }

        // =========================
        // BUILD MEMBER QUERY
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

        if (maritalStatus)
            memberQuery.maritalStatus = maritalStatus;

        if (program)
            memberQuery.programs = program;

        // =============================
        // DISABILITY FILTER FOR MEMBERS
        // =============================
        if (disability === "true") {
            memberQuery.disabilityDetails = { $ne: "" };
        }

        if (disability === "false") {
            memberQuery.$or = [
                { disabilityDetails: "" },
                { disabilityDetails: null }
            ];
        }

        // =========================
        // EXECUTE QUERIES
        // =========================
        const heads = await Family.find(headQuery);
        let members = await Member.find(memberQuery).populate("family");

        if (color) {
            members = members.filter(m => m.family && m.family.color === color);
        }

        // =========================
        // PUSH HEAD RESULTS
        // =========================
        heads.forEach(f => {
            results.push({
                type: "HEAD",
                name: f.headName,
                gender: f.headGender,
                familyId: f.familyId,
                occupation: f.headOccupation,
                maritalStatus: f.headMaritalStatus,
                disability: f.headDisabilityDetails,
                color: f.color   // ✅ ADD
            });
        });

        // =========================
        // PUSH MEMBER RESULTS
        // =========================
        members.forEach(m => {
            results.push({
                type: "MEMBER",
                name: m.name,
                gender: m.gender,
                familyId: m.family ? m.family.familyId : "",
                occupation: m.occupation,
                maritalStatus: m.maritalStatus,
                disability: m.disabilityDetails
            });
        });

        res.json(results);

    } catch (err) {
        console.log("FILTER ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};