const Member = require("../models/Member");
const Family = require("../models/Family");

// ==================================
// CREATE MEMBER
// ==================================
exports.createMember = async (req, res) => {
    try {

        const { familyId, ...memberData } = req.body;

        if (!familyId) {
            return res.status(400).json({
                message: "familyId is required"
            });
        }

        // Find family using familyId (131, 131A, 131B, 131C)
        const family = await Family.findOne({ familyId });

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        // Remove empty enum values
        if (memberData.gender === "") delete memberData.gender;
        if (memberData.maritalStatus === "") delete memberData.maritalStatus;

        const member = await Member.create({
            ...memberData,
            family: family._id
        });

        res.status(201).json(member);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ==================================
// GET MEMBERS BY FAMILY
// ==================================
exports.getMembersByFamily = async (req, res) => {
    try {

        const familyId = req.params.familyId;

        const family = await Family.findOne({ familyId });

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        const members = await Member.find({
            family: family._id
        }).sort({ createdAt: 1 });

        res.json(members);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ==================================
// UPDATE MEMBER
// ==================================
exports.updateMember = async (req, res) => {
    try {

        const updateData = { ...req.body };

        delete updateData._id;

        // Prevent enum errors
        if (updateData.gender === "") delete updateData.gender;
        if (updateData.maritalStatus === "") delete updateData.maritalStatus;

        const member = await Member.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json(member);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ==================================
// DELETE MEMBER
// ==================================
exports.deleteMember = async (req, res) => {
    try {

        const deleted = await Member.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json({
            message: "Member deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ==================================
// GET SINGLE MEMBER
// ==================================
exports.getMemberById = async (req, res) => {
    try {

        const member = await Member
            .findById(req.params.id)
            .populate("family", "familyId headName");

        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json(member);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// ==================================
// GET ALL MEMBERS
// ==================================
exports.getAllMembers = async (req, res) => {
    try {

        const members = await Member
            .find()
            .populate("family", "familyId headName")
            .sort({ createdAt: -1 });

        res.json(members);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};