const QRCode = require("qrcode");
const Family = require("../models/Family");
const KANJI_CONFIG = require("../config/kanjiConfig");
const Kanji = require("../models/Kanji");
const Qurban = require("../models/Qurban");
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

        const todayStr = new Date().toISOString().split("T")[0];
        const year = new Date().getFullYear();

        const kanji = await Kanji.findOne({
            familyId: family._id,
            date: todayStr
        });

        const qurban = await Qurban.findOne({
            familyId: family._id,
            year
        });

        res.json({
            canTakeKanji: !kanji,
            alreadyTakenToday: !!kanji,
            canTakeQurban: !qurban
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
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

        const todayStr = new Date().toISOString().split("T")[0];

        // Ramadan check (keep your existing logic)

        // Check already taken
        const exist = await Kanji.findOne({
            familyId: family._id,
            date: todayStr
        });

        if (exist) {
            return res.status(400).json({
                message: "Kanji already taken today"
            });
        }

        // Save
        await Kanji.create({
            familyId: family._id,
            date: todayStr
        });

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

        const year = new Date().getFullYear();

        const exist = await Qurban.findOne({
            familyId: family._id,
            year
        });

        if (exist) {
            return res.status(400).json({
                message: "Qurban already taken this year"
            });
        }

        await Qurban.create({
            familyId: family._id,
            year
        });

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