const Family = require("../models/Family");
const Member = require("../models/Member");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");



// ============================
// CREATE FAMILY
// ============================





// ============================
// CREATE FAMILY
// ============================

exports.createFamily = async (req, res) => {
    try {

        const {
            familyId,
            headDisabilityType,
            headDisabilityDetails,
            headDisability,
            manualArrears,
            ...rest
        } = req.body;

        // remove empty enum
        if (rest.headMaritalStatus === "") {
            delete rest.headMaritalStatus;
        }

        // check duplicate familyId
        const existing = await Family.findOne({ familyId });

        if (existing) {
            return res.status(400).json({
                message: "Family ID already exists"
            });
        }

        // ============================
        // Disability logic
        // ============================

        const finalHeadDisability =
            headDisabilityType === "OTHER"
                ? headDisabilityDetails
                : headDisabilityType;

        // ============================
        // QR Generation
        // ============================

        const qrId = uuidv4();

        const qrData = `https://mjmk.lk/qr/scan/${family.qrId}`;

        const qrImage = await QRCode.toDataURL(qrData);

        // ============================
        // Create Family
        // ============================

        const family = await Family.create({

            familyId,

            ...rest,

            headDateOfBirth: rest.headDateOfBirth || null,

            headDisability: headDisability || false,

            headDisabilityType: headDisabilityType || "",

            headDisabilityDetails: headDisability
                ? finalHeadDisability
                : "",

            manualArrears: manualArrears || 0,

            qrId: qrId,

            qrCode: qrImage
        });

        res.status(201).json({
            success: true,
            message: "Family created with QR",
            data: family
        });

    } catch (error) {

        console.error("Create Family Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================
// GET FAMILY BY FAMILY ID
// ============================
exports.getFamilyById = async (req, res) => {
    try {

        const family = await Family.findOne({
            familyId: req.params.id
        });

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        const members = await Member.find({
            family: family._id
        });


        // ✅ Generate QR if not already saved
        if (!family.qrCode) {

            const qrId = family.qrId || uuidv4();

            const qrData = `https://mjmk.lk/scan/${qrId}`;

            const qrImage = await QRCode.toDataURL(qrData);

            family.qrId = qrId;
            family.qrCode = qrImage;

            await family.save();
        }


        res.json({
            family,
            members
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ============================
// GET ALL FAMILIES
// ============================


exports.getAllFamilies = async (req, res) => {
    try {
        const families = await Family.find().sort({ familyId: 1 }).lean();
        const members = await Member.find().select("family gender").lean();

        const memberMap = {};
        members.forEach(m => {
            const famId = m.family.toString();
            if (!memberMap[famId]) memberMap[famId] = { male: 0, female: 0 };
            if (m.gender?.toUpperCase() === "MALE") memberMap[famId].male++;
            if (m.gender?.toUpperCase() === "FEMALE") memberMap[famId].female++;
        });

        const familiesWithStats = await Promise.all(
            families.map(async family => {
                const stats = memberMap[family._id.toString()] || { male: 0, female: 0 };
                let maleCount = stats.male;
                let femaleCount = stats.female;

                if (family.headGender?.toUpperCase() === "MALE") maleCount++;
                if (family.headGender?.toUpperCase() === "FEMALE") femaleCount++;

                // ✅ Generate QR if missing
                if (!family.qrCode) {
                    const qrId = family.qrId || uuidv4();

                    const qrImage = await QRCode.toDataURL(
                        `https://mjmk.lk/scan/${qrId}`
                    );

                    family.qrId = qrId;
                    family.qrCode = qrImage;

                    await Family.findByIdAndUpdate(
                        family._id,
                        {
                            qrId,
                            qrCode: qrImage
                        }
                    );
                    family.qrCode = qrImage;
                    await Family.findByIdAndUpdate(family._id, { qrCode: qrImage });
                }

                return {
                    ...family,
                    totalMembers: maleCount + femaleCount,
                    maleCount,
                    femaleCount
                };
            })
        );

        res.json(familiesWithStats);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============================
// SEARCH FAMILY
// ============================
exports.searchFamilies = async (req, res) => {
    try {
        const keyword = req.params.keyword;

        // ✅ Search by Family ID
        const familiesById = await Family.find({
            familyId: { $regex: keyword, $options: "i" }
        });

        // ✅ Search by Head Name (better matching)
        const familiesByHead = await Family.find({
            headName: {
                $regex: `\\b${keyword}`,
                $options: "i"
            }
        });

        // ✅ Search by Member Register Number
        const members = await Member.find({
            registerNumber: { $regex: keyword, $options: "i" }
        });

        const familyIdsFromMembers = members.map(m => m.family);

        const familiesByRegister = await Family.find({
            _id: { $in: familyIdsFromMembers }
        });

        // ✅ Merge all results
        const allFamilies = [
            ...familiesById,
            ...familiesByHead,
            ...familiesByRegister
        ];

        // ✅ Remove duplicates
        const uniqueFamilies = Array.from(
            new Map(
                allFamilies.map(f => [f._id.toString(), f])
            ).values()
        );

        res.json(uniqueFamilies);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ============================
// UPDATE FAMILY
// ============================
exports.updateFamily = async (req, res) => {
    try {

        const updateData = { ...req.body };

        delete updateData._id;

        // ❗ protect QR fields
        delete updateData.qrId;
        delete updateData.qrCode;

        if (updateData.headMaritalStatus === "")
            delete updateData.headMaritalStatus;

        const family = await Family.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        res.json(family);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// ============================
// DELETE FAMILY
// ============================
exports.deleteFamily = async (req, res) => {
    try {

        const familyId = req.params.id;

        const family = await Family.findById(familyId);

        if (!family) {
            return res.status(404).json({
                message: "Family not found"
            });
        }

        await Member.deleteMany({ family: familyId });

        await Family.findByIdAndDelete(familyId);

        res.json({
            message: "Family deleted successfully"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: error.message
        });
    }
};

// ============================
// GET LAST FAMILY
// ============================
exports.getLastFamily = async (req, res) => {
    try {

        const lastFamily = await Family
            .findOne()
            .sort({ createdAt: -1 })
            .select("familyId headName");

        res.json(lastFamily);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};