const Family = require("../models/Family");

// ===============================
// 📱 SCAN QR
// ===============================
exports.scanQR = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the family and populate only the head
        const family = await Family.findById(id).populate("head", "name"); // populate only name of head

        if (!family) {
            return res.status(404).json({
                success: false,
                message: "Family not found"
            });
        }

        res.json({
            success: true,
            data: {
                id: family._id,
                head: family.head?.name || "N/A"
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};