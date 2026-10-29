const Family = require("../models/Family");
const Member = require("../models/Member");

/**
 * Accurately calculate age in full years as of a specific target date
 * @param {Date|string} dob - Date of birth
 * @param {Date|string} asOfDate - Target reference date (defaults to current date)
 * @returns {number|null} Age in years, or null if dob is missing/invalid
 */
function calculateAge(dob, asOfDate = new Date()) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;

    const target = asOfDate ? new Date(asOfDate) : new Date();
    if (isNaN(target.getTime())) return null;

    let age = target.getFullYear() - birthDate.getFullYear();
    const monthDiff = target.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= 0 ? age : 0;
}

exports.filterFamilies = async (req, res) => {
    try {
        const {
            gender,
            occupation,
            educationLevel,
            gsDivision,
            houseType,
            landOwnership,
            disasterStatus,
            program,
            disability,
            maritalStatus,
            converted,
            color,
            minAge,
            maxAge,
            asOfDate,
            personType = "ALL" // "ALL", "HEAD", "MEMBER"
        } = req.body || {};

        const targetDate = asOfDate ? new Date(asOfDate) : new Date();

        const hasMinAge = minAge !== undefined && minAge !== null && minAge !== "" && !isNaN(Number(minAge));
        const hasMaxAge = maxAge !== undefined && maxAge !== null && maxAge !== "" && !isNaN(Number(maxAge));
        const minAgeNum = hasMinAge ? Number(minAge) : null;
        const maxAgeNum = hasMaxAge ? Number(maxAge) : null;

        // =========================
        // 1. BUILD HEAD QUERY
        // =========================
        const shouldQueryHeads = personType === "ALL" || personType === "HEAD";
        let headResults = [];

        if (shouldQueryHeads) {
            let headQuery = {};

            if (gender === "MALE") {
                headQuery.headGender = { $regex: "^male$", $options: "i" };
            } else if (gender === "FEMALE") {
                headQuery.headGender = { $regex: "^female$", $options: "i" };
            }

            if (color) {
                headQuery.color = color;
            }

            if (occupation) {
                headQuery.headOccupation = occupation;
            }

            if (educationLevel) {
                headQuery.headEducationLevel = educationLevel;
            }

            if (maritalStatus) {
                headQuery.headMaritalStatus = maritalStatus;
            }

            if (converted !== undefined && converted !== "") {
                headQuery.converted = converted === "true";
            }

            if (gsDivision) {
                headQuery.gsDivision = gsDivision;
            }

            if (houseType) {
                headQuery.houseType = houseType;
            }

            if (landOwnership) {
                headQuery.landOwnership = landOwnership;
            }

            if (disasterStatus) {
                headQuery.disasterStatus = disasterStatus;
            }

            // Disability filter for head
            if (disability === "true") {
                headQuery.headDisabilityDetails = { $ne: "" };
            } else if (disability === "false") {
                headQuery.$or = [
                    { headDisabilityDetails: "" },
                    { headDisabilityDetails: null },
                    { headDisability: false }
                ];
            }

            const heads = await Family.find(headQuery).lean();

            heads.forEach(f => {
                const dob = f.headDateOfBirth || null;
                const age = calculateAge(dob, targetDate);

                // Apply age filter if specified
                if (hasMinAge && (age === null || age < minAgeNum)) return;
                if (hasMaxAge && (age === null || age > maxAgeNum)) return;

                const street = f.address === "Other" ? (f.addressOther || "") : (f.address || f.addressOther || "");
                const fullAddress = [f.houseNumber, street].filter(Boolean).join(", ");

                headResults.push({
                    type: "HEAD",
                    relation: "HEAD",
                    name: f.headName || "N/A",
                    title: f.headTitle || "",
                    gender: f.headGender || "",
                    familyId: f.familyId || "",
                    phone: f.phone || "",
                    whatsapp: f.whatsapp || "",
                    address: fullAddress || street || "",
                    houseNumber: f.houseNumber || "",
                    dob: dob,
                    age: age,
                    nic: f.nic || "",
                    occupation: f.headOccupation || "",
                    educationLevel: f.headEducationLevel || "",
                    maritalStatus: f.headMaritalStatus || "",
                    disability: f.headDisabilityDetails || "",
                    color: Array.isArray(f.color) ? f.color : (f.color ? [f.color] : [])
                });
            });
        }

        // =========================
        // 2. BUILD MEMBER QUERY
        // =========================
        const shouldQueryMembers = (personType === "ALL" || personType === "MEMBER") &&
                                   (converted === undefined || converted === ""); // Converted is family-level only
        let memberResults = [];

        if (shouldQueryMembers) {
            let memberQuery = {};

            if (gender === "MALE") {
                memberQuery.gender = { $regex: "^male$", $options: "i" };
            } else if (gender === "FEMALE") {
                memberQuery.gender = { $regex: "^female$", $options: "i" };
            }

            if (occupation) {
                memberQuery.occupation = occupation;
            }

            if (educationLevel) {
                memberQuery.educationLevel = educationLevel;
            }

            if (maritalStatus) {
                memberQuery.maritalStatus = maritalStatus;
            }

            if (program) {
                memberQuery.programs = program;
            }

            if (disability === "true") {
                memberQuery.disabilityDetails = { $ne: "" };
            } else if (disability === "false") {
                memberQuery.$or = [
                    { disabilityDetails: "" },
                    { disabilityDetails: null }
                ];
            }

            let members = await Member.find(memberQuery).populate("family").lean();

            // Additional family-level filters on populated member.family
            if (color) {
                members = members.filter(m => {
                    const famColors = Array.isArray(m.family?.color) ? m.family.color : (m.family?.color ? [m.family.color] : []);
                    return famColors.includes(color);
                });
            }

            if (gsDivision) {
                members = members.filter(m => m.family && m.family.gsDivision === gsDivision);
            }

            if (houseType) {
                members = members.filter(m => m.family && m.family.houseType === houseType);
            }

            if (landOwnership) {
                members = members.filter(m => m.family && m.family.landOwnership === landOwnership);
            }

            if (disasterStatus) {
                members = members.filter(m => m.family && m.family.disasterStatus === disasterStatus);
            }

            members.forEach(m => {
                const dob = m.dob || null;
                const age = calculateAge(dob, targetDate);

                // Apply age filter if specified
                if (hasMinAge && (age === null || age < minAgeNum)) return;
                if (hasMaxAge && (age === null || age > maxAgeNum)) return;

                const fam = m.family || {};
                const street = fam.address === "Other" ? (fam.addressOther || "") : (fam.address || fam.addressOther || "");
                const fullAddress = [fam.houseNumber, street].filter(Boolean).join(", ");

                memberResults.push({
                    type: "MEMBER",
                    relation: m.relation || "MEMBER",
                    name: m.name || "N/A",
                    title: "",
                    gender: m.gender || "",
                    familyId: fam.familyId || "",
                    familyHeadName: fam.headName || "",
                    phone: fam.phone || "",
                    whatsapp: fam.whatsapp || "",
                    address: fullAddress || street || "",
                    houseNumber: fam.houseNumber || "",
                    dob: dob,
                    age: age,
                    nic: m.nic || "",
                    occupation: m.occupation || "",
                    educationLevel: m.educationLevel || "",
                    maritalStatus: m.maritalStatus || "",
                    disability: m.disabilityDetails || "",
                    color: Array.isArray(fam.color) ? fam.color : (fam.color ? [fam.color] : [])
                });
            });
        }

        const combinedResults = [...headResults, ...memberResults];

        res.json(combinedResults);

    } catch (err) {
        console.error("FILTER ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};
