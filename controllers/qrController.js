const QRCode = require("qrcode");
const Family = require("../models/Family");
const Member = require("../models/Member");

// ===============================
// 🔳 GENERATE QR FOR ONE FAMILY
// ===============================
exports.generateQR = async (req, res) => {
    try {

        const family = await Family.findById(req.params.id);

        if (!family) {
            return res.status(404).json({
                success: false,
                message: "Family not found"
            });
        }

        const qrData = `https://mjmk.lk/scan/${family._id}`;

        const qrImage = await QRCode.toDataURL(qrData);

        family.qrCode = qrImage;

        await family.save();

        res.json({
            success: true,
            qrCode: qrImage
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};

// ===============================
// 📱 SCAN QR
// ===============================
exports.scanQR = async (req, res) => {

    try {

        const { id } = req.params;

        const family = await Family.findById(id)
            .populate("members")
            .populate("head");

        if (!family) {
            return res.status(404).json({
                success: false,
                message: "Family not found"
            });
        }

        const members = await Member.find({ family: id });

        res.json({
            success: true,
            data: {
                family,
                members
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// ===============================
// 🔳 GENERATE ALL QR
// ===============================
exports.generateAllQR = async (req, res) => {

    try {

        const families = await Family.find();

        for (let fam of families) {

            const qrData = `https://mjmk.lk/scan/${fam._id}`;

            const qrImage = await QRCode.toDataURL(qrData);

            fam.qrCode = qrImage;

            await fam.save();
        }

        res.json({
            success: true,
            message: "All QR generated successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
};