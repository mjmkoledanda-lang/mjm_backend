const Member = require("../models/Member");
const Family = require("../models/Family");

// ==================================
// CREATE MEMBER
// ==================================
exports.createMember = async (req, res) => {
    try {

        let { familyId, family, ...memberData } = req.body;

        // Validate family input
        if (!familyId && !family) {
            return res.status(400).json({
                message: "Family ID is required"
            });
        }

        let familyDoc;

        // Find family by familyId or ObjectId
        if (familyId) {
            familyDoc = await Family.findOne({ familyId });
        } else {
            familyDoc = await Family.findById(family);
        }

        if (!familyDoc) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        // Clean empty enum values
        if (!memberData.gender) delete memberData.gender;
        if (!memberData.maritalStatus) delete memberData.maritalStatus;

        // Normalize uppercase
        if (memberData.gender) {
            memberData.gender = memberData.gender.toUpperCase();
        }

        if (memberData.maritalStatus) {
            memberData.maritalStatus = memberData.maritalStatus.toUpperCase();
        }

        const member = new Member({
            ...memberData,
            family: familyDoc._id
        });

        await member.save();

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

        const { familyId } = req.params;

        const family = await Family.findOne({ familyId });

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        const members = await Member
            .find({ family: family._id })
            .sort({ createdAt: 1 });

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

        let updateData = { ...req.body };

        delete updateData._id;

        // Handle family change
        if (updateData.familyId) {

            const family = await Family.findOne({
                familyId: updateData.familyId
            });

            if (!family) {
                return res.status(404).json({
                    message: "Family not found"
                });
            }

            updateData.family = family._id;
            delete updateData.familyId;
        }

        // Clean empty enum values
        if (!updateData.gender) delete updateData.gender;
        if (!updateData.maritalStatus) delete updateData.maritalStatus;

        // Normalize uppercase
        if (updateData.gender) {
            updateData.gender = updateData.gender.toUpperCase();
        }

        if (updateData.maritalStatus) {
            updateData.maritalStatus = updateData.maritalStatus.toUpperCase();
        }

        const member = await Member.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
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