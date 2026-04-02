const QRCode = require("qrcode");
const Family = require("../models/Family");

// ===============================
// 🔳 GENERATE QR FOR ONE FAMILY
// ===============================
const generateQR = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);

        if (!family) {
            return res.status(404).json({ success: false, message: "Family not found" });
        }

        const qrData = `https://mjmk.lk/scan/${family.familyId}`;
        const qrImage = await QRCode.toDataURL(qrData);

        family.qrCode = qrImage;
        await family.save();

        res.json({ success: true, qrCode: qrImage });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ===============================
// 🔳 GENERATE QR FOR ALL
// ===============================
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

// ===============================
// 📱 SCAN QR
// ===============================
const scanQR = async (req, res) => {
    try {
        const family = await Family.findOne({ familyId: req.params.id });

        if (!family) {
            return res.status(404).json({
                success: false,
                message: "Family not found",
            });
        }

        // 🔥 DEBUG LOG
        console.log("FOUND FAMILY:", family);

        res.json({
            success: true,
            data: {
                family: {
                    _id: family._id,
                    familyId: family.familyId,
                    headName: family.headName,
                    address: family.address,
                },
            },
        });

    } catch (err) {
        console.log("SCAN ERROR:", err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// ===============================
// ✅ GET STATUS
// ===============================
const getStatus = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);

        if (!family) {
            return res.status(404).json({ message: "Family not found" });
        }

        res.json({
            kanjiTaken: family.kanjiTaken || false,
            qurbanTaken: family.qurbanTaken || false,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===============================
// ✅ MARK KANJI
// ===============================
const markKanji = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);

        if (!family) {
            return res.status(404).json({ message: "Family not found" });
        }

        if (family.kanjiTaken) {
            return res.status(400).json({ message: "Kanji already taken" });
        }

        family.kanjiTaken = true;
        await family.save();

        res.json({ message: "Kanji marked as taken" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ===============================
// ✅ MARK QURBAN
// ===============================
const markQurban = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);

        if (!family) {
            return res.status(404).json({ message: "Family not found" });
        }

        if (family.qurbanTaken) {
            return res.status(400).json({ message: "Qurban already taken" });
        }

        family.qurbanTaken = true;
        await family.save();

        res.json({ message: "Qurban marked as taken" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
    generateQR,
    generateAllQR,
    scanQR,
    getStatus,
    markKanji,
    markQurban,
};