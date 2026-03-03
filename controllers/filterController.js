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
            disability
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

        // =========================
        // BUILD MEMBER QUERY
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

        // =========================
        // GENDER LOGIC (FIXED)
        // =========================
        if (gender === "MALE") {
            headQuery.headGender = { $regex: "^male$", $options: "i" };
            memberQuery.gender = { $regex: "^male$", $options: "i" };
        }

        else if (gender === "FEMALE") {
            headQuery.headGender = { $regex: "^female$", $options: "i" };
            memberQuery.gender = { $regex: "^female$", $options: "i" };
        }

        else if (gender === "HEAD_MALE") {
            headQuery.headGender = { $regex: "^male$", $options: "i" };
            memberQuery._id = null; // block members
        }

        else if (gender === "HEAD_FEMALE") {
            headQuery.headGender = { $regex: "^female$", $options: "i" };
            memberQuery._id = null; // block members
        }

        // =========================
        // EXECUTE QUERIES
        // =========================
        const heads = await Family.find(headQuery);
        const members = await Member.find(memberQuery).populate("family");

        // =========================
        // PUSH HEAD RESULTS
        // =========================
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

        // =========================
        // PUSH MEMBER RESULTS
        // =========================
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