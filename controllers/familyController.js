const Family = require("../models/Family");
const Member = require("../models/Member");

exports.createFamily = async (req, res) => {
    try {
        const existing = await Family.findOne({ familyId: req.body.familyId });

        if (existing) {
            return res.status(400).json({ message: "Family ID already exists" });
        }

        const family = await Family.create(req.body);
        res.status(201).json(family);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


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

        // 🔥 Fetch members linked to this family
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
exports.getAllFamilies = async (req, res) => {
    try {
        const families = await Family.find().sort({ familyId: 1 });

        const familiesWithCount = await Promise.all(
            families.map(async (family) => {
                const memberCount = await Member.countDocuments({
                    family: family._id
                });

                return {
                    ...family.toObject(),
                    totalMembers: memberCount + 1   // +1 for head
                };
            })
        );

        res.json(familiesWithCount);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


exports.searchFamilies = async (req, res) => {
    try {
        const keyword = req.params.keyword;

        // 1️⃣ Search by head name
        const familiesByHead = await Family.find({
            headName: { $regex: keyword, $options: "i" }
        });

        // 2️⃣ Search members by register number
        const members = await Member.find({
            registerNumber: { $regex: keyword, $options: "i" }
        });

        // Get family IDs from members
        const familyIdsFromMembers = members.map(m => m.family);

        const familiesByRegister = await Family.find({
            _id: { $in: familyIdsFromMembers }
        });

        // Combine & remove duplicates
        const allFamilies = [
            ...familiesByHead,
            ...familiesByRegister
        ];

        const uniqueFamilies = Array.from(
            new Map(allFamilies.map(f => [f._id.toString(), f])).values()
        );

        res.json(uniqueFamilies);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
exports.updateFamily = async (req, res) => {
    try {

        const updateData = { ...req.body };
        delete updateData._id;

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

exports.createFamily = async (req, res) => {
    try {

        const {
            headDisabilityType,
            headDisabilityDetails,
            headDisability,
            ...rest
        } = req.body;

        const finalHeadDisability =
            headDisabilityType === "OTHER"
                ? headDisabilityDetails
                : headDisabilityType;

        const family = await Family.create({
            ...rest,
            headDateOfBirth: rest.headDateOfBirth || null,

            // ✅ ADD THIS
            headDisability: headDisability || false,

            headDisabilityDetails: headDisability
                ? finalHeadDisability
                : ""
        });

        res.status(201).json(family);

    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};
// DELETE FAMILY
exports.deleteFamily = async (req, res) => {
    try {

        const familyId = req.params.id;

        const family = await Family.findById(familyId);

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        // 🔥 Delete all members first
        await Member.deleteMany({ family: familyId });

        // 🔥 Delete family
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
exports.getLastFamily = async (req, res) => {
    try {
        const lastFamily = await Family
            .findOne()
            .sort({ createdAt: -1 })
            .select("familyId headName");

        res.json(lastFamily);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
