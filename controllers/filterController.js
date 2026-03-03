// controllers/filterController.js
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
            disability
        } = req.body;

        let familyQuery = {};
        let memberQuery = {};

        // ===== FAMILY LEVEL FILTERS =====
        if (gsDivision) familyQuery.gsDivision = gsDivision;
        if (houseType) familyQuery.houseType = houseType;
        if (landOwnership) familyQuery.landOwnership = landOwnership;
        if (disasterStatus) familyQuery.disasterStatus = disasterStatus;

        // ===== HEAD GENDER FILTER =====
        if (gender === "HEAD_MALE") familyQuery.headGender = "MALE";
        if (gender === "HEAD_FEMALE") familyQuery.headGender = "FEMALE";

        const families = await Family.find(familyQuery);

        // ===== MEMBER FILTERS =====
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

        const members = await Member.find(memberQuery)
            .populate("family");

        // Combine head + members
        const result = {
            families,
            members
        };

        res.json(result);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};