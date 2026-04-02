const Family = require("../models/Family");

exports.getQRByNIC = async (req, res) => {
    try {

        const { nic } = req.params;

        const family = await Family.findOne({ nic });

        if (!family) {
            return res.status(404).json({
                success: false,
                message: "Family not found"
            });
        }

        res.json({
            success: true,
            familyId: family.familyId,
            headName: family.headName,
            qrCode: family.qrCode,
            qrId: family.qrId
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};