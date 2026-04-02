const QRCode = require("qrcode");
const Family = require("../models/Family");

// Generate QR for one family
const generateQR = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);
        if (!family) return res.status(404).json({ success: false, message: "Family not found" });

        const qrData = `https://mjmk.lk/scan/${family._id}`;
        const qrImage = await QRCode.toDataURL(qrData);

        family.qrCode = qrImage;
        await family.save();

        res.json({ success: true, qrCode: qrImage });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Generate QR for all families
const generateAllQR = async (req, res) => {
    try {
        const families = await Family.find();
        for (let fam of families) {
            const qrData = `https://mjmk.lk/scan/${fam._id}`;
            const qrImage = await QRCode.toDataURL(qrData);
            fam.qrCode = qrImage;
            await fam.save();
        }
        res.json({ success: true, message: "All QR generated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Scan QR (only return family ID and head)
const scanQR = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id).select("_id head");
        if (!family) return res.status(404).json({ success: false, message: "Family not found" });

        res.json({ success: true, data: family });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { generateQR, generateAllQR, scanQR };