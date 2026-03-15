const Family = require("../models/Family");
const Member = require("../models/Member");

// ============================
// CREATE FAMILY
// ============================
exports.createFamily = async (req, res) => {
    try {

        const {
            familyId,
            headDisabilityType,
            headDisabilityDetails,
            headDisability,
            manualArrears,
            ...rest
        } = req.body;

        // Remove empty enum values
        if (rest.headMaritalStatus === "") delete rest.headMaritalStatus;

        // Check duplicate family ID
        const existing = await Family.findOne({ familyId });

        if (existing) {
            return res.status(400).json({
                message: "Family ID already exists"
            });
        }

        const finalHeadDisability =
            headDisabilityType === "OTHER"
                ? headDisabilityDetails
                : headDisabilityType;

        const family = await Family.create({
            familyId,
            ...rest,

            headDateOfBirth: rest.headDateOfBirth || null,

            headDisability: headDisability || false,

            headDisabilityDetails: headDisability
                ? finalHeadDisability
                : "",

            manualArrears: manualArrears || 0
        });

        res.status(201).json(family);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

// ============================
// GET FAMILY BY FAMILY ID
// ============================
exports.getFamilyById = async (req, res) => {
    try {

        const family = await Family.findOne({
            familyId: req.params.id
        });

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        const members = await Member.find({
            family: family._id
        });

        res.json({
            family,
            members
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ============================
// GET ALL FAMILIES
// ============================
exports.getAllFamilies = async (req, res) => {
    try {

        // Get all families
        const families = await Family.find()
            .sort({ familyId: 1 })
            .lean();

        // Get all members
        const members = await Member.find()
            .select("family gender")
            .lean();

        // Create member lookup map
        const memberMap = {};

        members.forEach(m => {

            const famId = m.family.toString();

            if (!memberMap[famId]) {
                memberMap[famId] = { male: 0, female: 0 };
            }

            if (m.gender?.toUpperCase() === "MALE")
                memberMap[famId].male++;

            if (m.gender?.toUpperCase() === "FEMALE")
                memberMap[famId].female++;

        });

        const familiesWithStats = families.map(family => {

            const stats = memberMap[family._id.toString()] || {
                male: 0,
                female: 0
            };

            let maleCount = stats.male;
            let femaleCount = stats.female;

            if (family.headGender?.toUpperCase() === "MALE")
                maleCount++;

            if (family.headGender?.toUpperCase() === "FEMALE")
                femaleCount++;

            return {
                ...family,
                totalMembers: maleCount + femaleCount,
                maleCount,
                femaleCount
            };

        });

        res.json(familiesWithStats);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// ============================
// SEARCH FAMILY
// ============================
exports.searchFamilies = async (req, res) => {
    try {

        const keyword = req.params.keyword;

        const familiesByHead = await Family.find({
            headName: { $regex: keyword, $options: "i" }
        });

        const members = await Member.find({
            registerNumber: { $regex: keyword, $options: "i" }
        });

        const familyIdsFromMembers = members.map(m => m.family);

        const familiesByRegister = await Family.find({
            _id: { $in: familyIdsFromMembers }
        });

        const allFamilies = [
            ...familiesByHead,
            ...familiesByRegister
        ];

        const uniqueFamilies = Array.from(
            new Map(
                allFamilies.map(f => [f._id.toString(), f])
            ).values()
        );

        res.json(uniqueFamilies);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ============================
// UPDATE FAMILY
// ============================
exports.updateFamily = async (req, res) => {
    try {

        const updateData = { ...req.body };

        delete updateData._id;

        if (updateData.headMaritalStatus === "")
            delete updateData.headMaritalStatus;

        const family = await Family.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        res.json(family);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ============================
// DELETE FAMILY
// ============================
exports.deleteFamily = async (req, res) => {
    try {

        const familyId = req.params.id;

        const family = await Family.findById(familyId);

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        await Member.deleteMany({ family: familyId });

        await Family.findByIdAndDelete(familyId);

        res.json({
            message: "Family deleted successfully"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
};

// ============================
// GET LAST FAMILY
// ============================
exports.getLastFamily = async (req, res) => {
    try {

        const lastFamily = await Family
            .findOne()
            .sort({ createdAt: -1 })
            .select("familyId headName");

        res.json(lastFamily);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};