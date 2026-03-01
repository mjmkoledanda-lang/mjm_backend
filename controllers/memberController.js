const Member = require("../models/Member");

// CREATE MEMBER
exports.createMember = async (req, res) => {
    try {
        const member = await Member.create(req.body);
        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMember = async (req, res) => {
    try {

        const deleted = await Member.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json({ message: "Member deleted successfully" });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// UPDATE MEMBER
exports.updateMember = async (req, res) => {
    try {
        const updated = await Member.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json(updated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};