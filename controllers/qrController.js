const QRCode = require("qrcode");
const Family = require("../models/Family");
const KANJI_CONFIG = require("../config/kanjiConfig");
// ===============================
// 🔳 GENERATE QR FOR ONE FAMILY
// ===============================
const generateQR = async (req, res) => {
    try {
        const family = await Family.findById(req.params.id);

        if (!family) {
            return res.status(404).json({ success: false, message: "Family not found" });
        }

        const qrData = `https://mjmk.lk/qr/scan/${fam.qrId}`;
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
            const qrData = `https://mjmk.lk/qr/scan/${family.qrId}`;
            const qrImage = await QRCode.toDataURL(qrData);

            await Family.updateOne(
                { _id: fam._id },
                { qrCode: qrImage }
            );
        }

        res.json({ success: true, message: "All QR generated successfully" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ===============================
// 📱 SCAN QR
// ===============================
const Member = require("../models/Member");

const scanQR = async (req, res) => {
    try {
        const family = await Family.findOne({ qrId: req.params.id });

        if (!family) {
            return res.status(404).json({
                success: false,
                message: "Family not found",
            });
        }

        // ✅ GET MEMBERS
        const members = await Member.find({ family: family._id });

        let maleCount = 0;
        let femaleCount = 0;

        members.forEach(m => {
            if (m.gender?.toUpperCase() === "MALE") maleCount++;
            if (m.gender?.toUpperCase() === "FEMALE") femaleCount++;
        });

        // ✅ ADD HEAD ALSO
        if (family.headGender?.toUpperCase() === "MALE") maleCount++;
        if (family.headGender?.toUpperCase() === "FEMALE") femaleCount++;

        const totalMembers = maleCount + femaleCount;

        res.json({
            success: true,
            data: {
                family: {
                    _id: family._id,
                    familyId: family.familyId,
                    headTitle: family.headTitle,
                    headName: family.headName,
                    address: family.address,
                    totalMembers: totalMembers, // ✅ FIXED
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
        const family = await Family.findOne({ qrId: req.params.id });

        if (!family) {
            return res.status(404).json({ message: "Family not found" });
        }

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        const diffDays = Math.floor(
            (today - KANJI_CONFIG.ramadanStart) / (1000 * 60 * 60 * 24)
        );

        const isRamadan =
            diffDays >= 0 && diffDays < KANJI_CONFIG.durationDays;

        // Kanji check
        const alreadyTakenToday = family.kanjiRecords?.some(
            r => r.date === todayStr
        );

        // Qurban check
        const currentYear = new Date().getFullYear();
        const qurbanTaken = family.qurbanYear === currentYear;

        res.json({
            canTakeKanji: isRamadan && !alreadyTakenToday,
            alreadyTakenToday,
            canTakeQurban: !qurbanTaken
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
        const family = await Family.findOne({ qrId: req.params.id });

        if (!family) {
            return res.status(404).json({ message: "Family not found" });
        }

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        // Ramadan check
        const diffDays = Math.floor(
            (today - RAMADAN_START) / (1000 * 60 * 60 * 24)
        );

        const isRamadan = diffDays >= 0 && diffDays < 30;

        if (!isRamadan) {
            return res.status(400).json({
                message: "Kanji only allowed during Ramadan"
            });
        }

        // Already taken today?
        const alreadyTaken = family.kanjiRecords?.some(
            r => r.date === todayStr
        );

        if (alreadyTaken) {
            return res.status(400).json({
                message: "Kanji already taken today"
            });
        }

        // Save record
        family.kanjiRecords = family.kanjiRecords || [];
        family.kanjiRecords.push({ date: todayStr });

        await family.save();

        res.json({ message: "Kanji marked successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ===============================
// ✅ MARK QURBAN
// ===============================
const markQurban = async (req, res) => {
    try {
        const family = await Family.findOne({ qrId: req.params.id });

        if (!family) {
            return res.status(404).json({ message: "Family not found" });
        }

        const currentYear = new Date().getFullYear();

        if (family.qurbanYear === currentYear) {
            return res.status(400).json({
                message: "Qurban already taken this year"
            });
        }

        family.qurbanYear = currentYear;

        await family.save();

        res.json({ message: "Qurban marked successfully" });

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