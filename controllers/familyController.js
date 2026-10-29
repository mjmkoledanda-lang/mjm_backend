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

        const qrData = `https://mjmk.lk/qr/scan/${qrId}`;

        const qrImage = await QRCode.toDataURL(qrData);

        // ============================
        // Create Family
        // ============================

        const family = await Family.create({

            familyId,

            ...rest,

            headDateOfBirth: rest.headDateOfBirth ? new Date(rest.headDateOfBirth) : null,

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
        const members = await Member.find().select("family gender name").lean();

        const memberMap = {};
        members.forEach(m => {
            const famId = m.family?.toString();
            if (!famId) return;
            if (!memberMap[famId]) memberMap[famId] = { male: 0, female: 0, memberNames: [] };
            if (m.gender?.toUpperCase() === "MALE") memberMap[famId].male++;
            if (m.gender?.toUpperCase() === "FEMALE") memberMap[famId].female++;
            if (m.name) memberMap[famId].memberNames.push(m.name);
        });

        const familiesWithStats = await Promise.all(
            families.map(async family => {
                const stats = memberMap[family._id.toString()] || { male: 0, female: 0, memberNames: [] };
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
                }

                return {
                    ...family,
                    totalMembers: maleCount + femaleCount,
                    maleCount,
                    femaleCount,
                    memberNames: stats.memberNames || []
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
        const keyword = (req.params.keyword || "").trim();
        if (!keyword) {
            return res.json([]);
        }

        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedKeyword, "i");

        // 1. Search Families by familyId, headName, nic, houseNumber, address, phone
        const familiesDirect = await Family.find({
            $or: [
                { familyId: regex },
                { headName: regex },
                { nic: regex },
                { houseNumber: regex },
                { address: regex },
                { phone: regex }
            ]
        }).lean();

        // 2. Search Members by name, registerNumber, nic
        const matchingMembers = await Member.find({
            $or: [
                { name: regex },
                { registerNumber: regex },
                { nic: regex }
            ]
        }).select("family name registerNumber").lean();

        const memberByFamilyId = {};
        const memberFamilyIds = [];
        matchingMembers.forEach(m => {
            if (m.family) {
                const fId = m.family.toString();
                if (!memberByFamilyId[fId]) {
                    memberByFamilyId[fId] = [];
                    memberFamilyIds.push(m.family);
                }
                const label = m.name || m.registerNumber;
                if (label && !memberByFamilyId[fId].includes(label)) {
                    memberByFamilyId[fId].push(label);
                }
            }
        });

        // 3. Find families of matching members that weren't found directly
        const familiesFromMembers = memberFamilyIds.length > 0
            ? await Family.find({ _id: { $in: memberFamilyIds } }).lean()
            : [];

        // 4. Merge all families into a map
        const familyMap = new Map();

        familiesDirect.forEach(f => {
            const id = f._id.toString();
            familyMap.set(id, {
                ...f,
                matchedMember: memberByFamilyId[id]?.join(", ") || ""
            });
        });

        familiesFromMembers.forEach(f => {
            const id = f._id.toString();
            if (familyMap.has(id)) {
                const existing = familyMap.get(id);
                if (!existing.matchedMember && memberByFamilyId[id]) {
                    existing.matchedMember = memberByFamilyId[id].join(", ");
                }
            } else {
                familyMap.set(id, {
                    ...f,
                    matchedMember: memberByFamilyId[id]?.join(", ") || ""
                });
            }
        });

        const allFamilies = Array.from(familyMap.values());

        // 5. Smart sort:
        // Priority 1: Exact or startsWith match on familyId or headName
        // Priority 2: Word boundary match on headName
        // Priority 3: Substring match
        // Tie-breaker: Natural sort on familyId
        const upperQuery = keyword.toUpperCase();

        allFamilies.sort((a, b) => {
            const idA = String(a.familyId || "").toUpperCase();
            const idB = String(b.familyId || "").toUpperCase();
            const headA = String(a.headName || "").toUpperCase();
            const headB = String(b.headName || "").toUpperCase();

            const aStarts = idA.startsWith(upperQuery) || headA.startsWith(upperQuery);
            const bStarts = idB.startsWith(upperQuery) || headB.startsWith(upperQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: "base" });
        });

        res.json(allFamilies);

    } catch (error) {
        console.error("Search Families Error:", error);
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

        if (updateData.headDateOfBirth !== undefined) {
            updateData.headDateOfBirth = updateData.headDateOfBirth ? new Date(updateData.headDateOfBirth) : null;
        }

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