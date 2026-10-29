const mongoose = require("mongoose");
const NashaQR = require("../models/NashaQR");
const NashaTicket = require("../models/NashaTicket");

const {
    generateQRToken,
    generateQRNumber,
} = require("../utils/qrGenerator");

// =====================================================
// HELPER - GET USER ID
// =====================================================

const getUserId = (req) => {
    return req.user?._id || req.user?.id || null;
};

// =====================================================
// HELPER - TODAY RANGE
// =====================================================

const getTodayRange = () => {
    const start = new Date();

    start.setHours(0, 0, 0, 0);

    const end = new Date(start);

    end.setDate(end.getDate() + 1);

    return {
        start,
        end,
    };
};

// =====================================================
// GENERATE NASHA QR CODES
// POST /api/nasha-qr/generate
// =====================================================

const generateNashaQRs = async (req, res) => {
    try {
        const quantity = Number(req.body?.quantity);

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid QR quantity is required.",
            });
        }

        if (quantity > 5000) {
            return res.status(400).json({
                success: false,
                message:
                    "Maximum 5000 QR codes can be generated in one batch.",
            });
        }

        const documents = [];

        for (let i = 0; i < quantity; i++) {
            documents.push({
                qrNumber: generateQRNumber(),
                token: generateQRToken(),

                qrIssued: false,
                qrIssuedAt: null,
                qrIssuedBy: null,

                nashaIssued: false,
                nashaIssuedAt: null,
                nashaIssuedBy: null,

                printed: false,
                printedAt: null,
                printedBy: null,

                nashaTicket: null,

                customerName: "",
                customerMobile: "",

                nashaQuantity: 1,
                amountPaid: 0,
                paymentDate: null,

                notes: "",
            });
        }

        const createdQRs =
            await NashaQR.insertMany(
                documents,
                {
                    ordered: true,
                }
            );

        return res.status(201).json({
            success: true,
            message: `${createdQRs.length} QR codes generated successfully.`,
            count: createdQRs.length,
            data: createdQRs,
        });
    } catch (error) {
        console.error(
            "GENERATE NASHA QR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to generate Nasha QR codes.",
        });
    }
};

// =====================================================
// ALIAS
// =====================================================

const generateNashaQR = generateNashaQRs;

// =====================================================
// GET AVAILABLE QR CODES
// GET /api/nasha-qr/available
// =====================================================

const getAvailableNashaQRs = async (req, res) => {
    try {
        const qrs = await NashaQR.find({
            qrIssued: false,
            nashaIssued: false,
        })
            .sort({
                createdAt: 1,
            })
            .lean({
                virtuals: true,
            });

        return res.json({
            success: true,
            count: qrs.length,
            data: qrs,
        });
    } catch (error) {
        console.error(
            "GET AVAILABLE NASHA QR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load available QR codes.",
        });
    }
};

// =====================================================
// GET ALL QR CODES
// GET /api/nasha-qr
// =====================================================

const getNashaQRs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
            qrIssued,
            nashaIssued,
            printed,
        } = req.query;

        const pageNumber = Math.max(
            Number(page) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(
                Number(limit) || 50,
                1
            ),
            200
        );

        const filter = {};

        // -------------------------------------------------
        // SEARCH
        // -------------------------------------------------

        if (search?.trim()) {
            const searchValue =
                search.trim();

            filter.$or = [
                {
                    qrNumber: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
                {
                    customerName: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
                {
                    customerMobile: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
            ];
        }

        // -------------------------------------------------
        // FILTERS
        // -------------------------------------------------

        if (
            qrIssued !== undefined
        ) {
            filter.qrIssued =
                qrIssued === "true";
        }

        if (
            nashaIssued !== undefined
        ) {
            filter.nashaIssued =
                nashaIssued === "true";
        }

        if (
            printed !== undefined
        ) {
            filter.printed =
                printed === "true";
        }

        const [
            qrs,
            total,
        ] = await Promise.all([
            NashaQR.find(filter)
                .sort({
                    createdAt: -1,
                })
                .skip(
                    (pageNumber - 1) *
                    limitNumber
                )
                .limit(limitNumber)
                .lean({
                    virtuals: true,
                }),

            NashaQR.countDocuments(
                filter
            ),
        ]);

        return res.json({
            success: true,
            data: qrs,

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages: Math.ceil(
                    total /
                    limitNumber
                ),
            },
        });
    } catch (error) {
        console.error(
            "GET NASHA QRS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load QR codes.",
        });
    }
};

// =====================================================
// GET SINGLE QR
// GET /api/nasha-qr/:id
// =====================================================

const getNashaQR = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR ID.",
            });
        }

        const qr =
            await NashaQR.findById(id)
                .populate(
                    "nashaTicket"
                )
                .populate(
                    "qrIssuedBy",
                    "name email"
                )
                .populate(
                    "nashaIssuedBy",
                    "name email"
                )
                .populate(
                    "printedBy",
                    "name email"
                )
                .lean({
                    virtuals: true,
                });

        if (!qr) {
            return res.status(404).json({
                success: false,
                message:
                    "Nasha QR code not found.",
            });
        }

        return res.json({
            success: true,
            data: qr,
        });
    } catch (error) {
        console.error(
            "GET SINGLE NASHA QR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load QR code.",
        });
    }
};

// =====================================================
// SCAN QR
// GET /api/nasha-qr/scan/:token
// =====================================================

// =====================================================
// SCAN NASHA QR
// GET /api/nasha-qr/scan/:token
// =====================================================
//
// The scanner sends:
//
// /api/nasha-qr/scan/NASHA-QR-47CC037A85384
//
// The function finds the QR by:
//
// 1. token
// 2. qrNumber
//
// This makes the scanner more tolerant of QR formats.
//
// =====================================================

const scanNashaQR = async (req, res) => {
    try {

        let token = String(
            req.params.token || ""
        ).trim();

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "QR token is required.",
            });
        }

        // Decode URL encoded token
        try {
            token = decodeURIComponent(token);
        } catch (error) {
            // Keep original token
        }

        token = token.trim();

        console.log(
            "NASHA QR SCAN TOKEN:",
            token
        );

        // -------------------------------------------------
        // FIND QR
        // -------------------------------------------------

        const qr = await NashaQR.findOne({
            $or: [
                {
                    token: token,
                },
                {
                    qrNumber: token,
                },
            ],
        }).lean();

        // -------------------------------------------------
        // QR NOT FOUND
        // -------------------------------------------------

        if (!qr) {

            console.log(
                "NASHA QR NOT FOUND:",
                token
            );

            return res.status(404).json({
                success: false,
                message: "Invalid Nasha QR code.",
            });
        }

        // -------------------------------------------------
        // CANCELLED
        // -------------------------------------------------

        if (qr.cancelled) {
            return res.status(400).json({
                success: false,
                message: "This Nasha QR has been cancelled.",
                data: qr,
            });
        }

        // -------------------------------------------------
        // ALREADY USED
        // -------------------------------------------------

        if (qr.nashaIssued) {

            return res.status(400).json({
                success: false,
                message:
                    "Nasha has already been issued for this QR.",
                data: qr,
                action: "COMPLETED",
            });
        }

        // -------------------------------------------------
        // FIRST SCAN
        // -------------------------------------------------
        //
        // QR exists but has not been issued.
        //
        // Show:
        //
        // ISSUE QR
        //
        // -------------------------------------------------

        if (!qr.qrIssued) {

            return res.json({
                success: true,

                message:
                    "QR found. QR can be issued.",

                action: "ISSUE_QR",

                data: qr,
            });
        }

        // -------------------------------------------------
        // SECOND SCAN
        // -------------------------------------------------
        //
        // QR already issued.
        //
        // Nasha has not been issued.
        //
        // Show:
        //
        // ISSUE NASHA
        //
        // -------------------------------------------------

        return res.json({
            success: true,

            message:
                "QR found. Nasha can be issued.",

            action: "ISSUE_NASHA",

            data: qr,
        });

    } catch (error) {

        console.error(
            "SCAN NASHA QR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to scan Nasha QR.",
        });
    }
};
// =====================================================
// ISSUE QR
//
// FIRST TRANSACTION
//
// Scan QR
// Enter customer/account information
// Click "Issue QR"
//
// QR:
// qrIssued = true
//
// Nasha:
// nashaIssued = false
//
// This gives:
// QR Issued Count +1
// Pending Nasha Count +1
// =====================================================

const issueQR = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            customerName,
            customerMobile,
            amountPaid,
            nashaQuantity,
            notes,
        } = req.body || {};

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR ID.",
            });
        }

        // -------------------------------------------------
        // CUSTOMER
        // -------------------------------------------------

        const cleanCustomerName =
            customerName !== undefined && customerName !== null
                ? String(customerName).trim()
                : "";

        const cleanCustomerMobile =
            customerMobile !== undefined && customerMobile !== null
                ? String(customerMobile).trim()
                : "";

        // -------------------------------------------------
        // ONE QR = ONE NASHA
        // -------------------------------------------------

        const quantity =
            nashaQuantity === undefined
                ? 1
                : Number(nashaQuantity);

        if (quantity !== 1) {
            return res.status(400).json({
                success: false,
                message:
                    "One QR code can be used for only one Nasha.",
            });
        }

        const amount =
            Number(amountPaid);

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid amount paid.",
            });
        }

        // -------------------------------------------------
        // ATOMIC UPDATE
        //
        // Important:
        // Prevent two users from issuing
        // the same QR simultaneously.
        // -------------------------------------------------

        const userId =
            getUserId(req);

        const qr =
            await NashaQR.findOneAndUpdate(
                {
                    _id: id,
                    qrIssued: false,
                    nashaIssued: false,
                },
                {
                    $set: {
                        qrIssued: true,
                        qrIssuedAt:
                            new Date(),
                        qrIssuedBy:
                        userId,

                        customerName: cleanCustomerName,

                        customerMobile: cleanCustomerMobile,

                        nashaQuantity: 1,

                        amountPaid:
                        amount,

                        paymentDate:
                            new Date(),

                        notes:
                            notes?.trim() ||
                            "",
                    },
                },
                {
                    new: true,
                }
            );

        if (!qr) {
            const existing =
                await NashaQR.findById(
                    id
                ).lean();

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message:
                        "QR code not found.",
                });
            }

            if (existing.qrIssued) {
                return res.status(409).json({
                    success: false,
                    message:
                        "QR issue has already been completed for this QR code.",
                });
            }

            return res.status(409).json({
                success: false,
                message:
                    "This QR code cannot be issued.",
            });
        }

        // -------------------------------------------------
        // CREATE NASHA TICKET
        //
        // Ticket is created at QR issue time.
        // Nasha itself will be marked issued
        // during the second transaction.
        // -------------------------------------------------

        try {
            const ticket =
                await NashaTicket.create({
                    ticketNo:
                        `NASHA-${Date.now()}-${Math.random()
                            .toString(36)
                            .substring(2, 7)
                            .toUpperCase()}`,

                    customerName:
                        customerName.trim(),

                    mobileNumber:
                        customerMobile.trim(),

                    amountPaid:
                    amount,

                    paymentDate:
                        new Date(),

                    nashaQuantity: 1,

                    issuedQuantity: 0,

                    status:
                        "NOT_ISSUED",

                    notes:
                        notes?.trim() ||
                        "",
                });

            // Link ticket to QR
            qr.nashaTicket =
                ticket._id;

            await qr.save();

            return res.json({
                success: true,

                message:
                    "QR issued successfully. Nasha is pending for this QR.",

                data: {
                    qr,
                    ticket,
                },
            });
        } catch (ticketError) {
            console.error(
                "CREATE NASHA TICKET ERROR:",
                ticketError
            );

            // Roll back QR issue if ticket
            // creation fails.
            await NashaQR.findByIdAndUpdate(
                id,
                {
                    $set: {
                        qrIssued: false,
                        qrIssuedAt: null,
                        qrIssuedBy: null,

                        customerName: "",
                        customerMobile: "",

                        nashaQuantity: 1,
                        amountPaid: 0,
                        paymentDate: null,
                        notes: "",

                        nashaTicket: null,
                    },
                }
            );

            throw ticketError;
        }
    } catch (error) {
        console.error(
            "ISSUE QR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to issue QR.",
        });
    }
};

// =====================================================
// ALIAS
// =====================================================
//
// Your older routes used different names.
// Keep aliases so the route does not crash.
//

const markNashaQRIssued = issueQR;

// =====================================================
// ISSUE NASHA
//
// SECOND TRANSACTION
//
// Scan SAME QR
// Click "Issue Nasha"
//
// QR:
// qrIssued = true
//
// Nasha:
// nashaIssued = true
//
// One QR = ONE NASHA
// =====================================================

const issueNasha = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR ID.",
            });
        }

        const userId =
            getUserId(req);

        // -------------------------------------------------
        // FIND QR
        // -------------------------------------------------

        const existing =
            await NashaQR.findById(id);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message:
                    "QR code not found.",
            });
        }

        // -------------------------------------------------
        // QR MUST HAVE BEEN ISSUED
        // -------------------------------------------------

        if (!existing.qrIssued) {
            return res.status(409).json({
                success: false,
                message:
                    "QR must be issued before Nasha can be issued.",
            });
        }

        // -------------------------------------------------
        // PREVENT SECOND NASHA
        // -------------------------------------------------

        if (existing.nashaIssued) {
            return res.status(409).json({
                success: false,
                message:
                    "Nasha has already been issued for this QR code.",
            });
        }

        // -------------------------------------------------
        // TICKET REQUIRED
        // -------------------------------------------------

        if (!existing.nashaTicket) {
            return res.status(409).json({
                success: false,
                message:
                    "Nasha ticket is not linked to this QR.",
            });
        }

        // -------------------------------------------------
        // ATOMIC QR UPDATE
        // -------------------------------------------------

        const qr =
            await NashaQR.findOneAndUpdate(
                {
                    _id: id,
                    qrIssued: true,
                    nashaIssued: false,
                    nashaTicket: {
                        $ne: null,
                    },
                },
                {
                    $set: {
                        nashaIssued: true,
                        nashaIssuedAt:
                            new Date(),
                        nashaIssuedBy:
                        userId,
                    },
                },
                {
                    new: true,
                }
            );

        if (!qr) {
            return res.status(409).json({
                success: false,
                message:
                    "Nasha has already been issued or QR is not eligible.",
            });
        }

        // -------------------------------------------------
        // UPDATE NASHA TICKET
        // -------------------------------------------------

        const ticket =
            await NashaTicket.findOneAndUpdate(
                {
                    _id:
                    qr.nashaTicket,

                    issuedQuantity: {
                        $lt: 1,
                    },

                    status: {
                        $ne: "CANCELLED",
                    },
                },
                {
                    $set: {
                        issuedQuantity: 1,

                        issuedAt:
                            new Date(),

                        issuedBy:
                        userId,

                        status:
                            "ISSUED",
                    },
                },
                {
                    new: true,
                }
            );

        if (!ticket) {
            // Roll back QR if ticket update fails.
            await NashaQR.findByIdAndUpdate(
                id,
                {
                    $set: {
                        nashaIssued: false,
                        nashaIssuedAt:
                            null,
                        nashaIssuedBy:
                            null,
                    },
                }
            );

            return res.status(409).json({
                success: false,
                message:
                    "Nasha ticket is already issued or unavailable.",
            });
        }

        return res.json({
            success: true,

            message:
                "Nasha issued successfully.",

            data: {
                qr,
                ticket,
            },
        });
    } catch (error) {
        console.error(
            "ISSUE NASHA ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error?.message ||
                "Failed to issue Nasha.",
        });
    }
};

// =====================================================
// ALIAS
// =====================================================

const markNashaIssued = issueNasha;

// =====================================================
// PRINT QR CODES
//
// POST /api/nasha-qr/print
// Body:
// {
//    "qrIds": ["id1", "id2"]
// }
// =====================================================

const printNashaQRs = async (req, res) => {
    try {
        const {
            qrIds,
        } = req.body || {};

        if (
            !Array.isArray(qrIds) ||
            qrIds.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Select at least one QR code.",
            });
        }

        const validIds =
            qrIds.filter((id) =>
                mongoose.Types.ObjectId.isValid(
                    id
                )
            );

        if (
            validIds.length !==
            qrIds.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "One or more QR IDs are invalid.",
            });
        }

        const userId =
            getUserId(req);

        const result =
            await NashaQR.updateMany(
                {
                    _id: {
                        $in: validIds,
                    },
                },
                {
                    $set: {
                        printed: true,
                        printedAt:
                            new Date(),
                        printedBy:
                        userId,
                    },
                }
            );

        return res.json({
            success: true,

            message:
                `${result.modifiedCount} QR codes marked as printed.`,

            modifiedCount:
            result.modifiedCount,
        });
    } catch (error) {
        console.error(
            "PRINT NASHA QRS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to mark QR codes as printed.",
        });
    }
};

// =====================================================
// QR IMAGE
//
// GET /api/nasha-qr/:id/image
//
// Returns QR information.
// Frontend can use token to render QR.
// =====================================================

const getNashaQRImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR ID.",
            });
        }

        const qr =
            await NashaQR.findById(id)
                .select(
                    "qrNumber token qrIssued nashaIssued"
                )
                .lean();

        if (!qr) {
            return res.status(404).json({
                success: false,
                message:
                    "QR code not found.",
            });
        }

        return res.json({
            success: true,
            data: qr,
        });
    } catch (error) {
        console.error(
            "GET NASHA QR IMAGE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load QR information.",
        });
    }
};

// =====================================================
// UPDATE QR DETAILS
// =====================================================

const updateNashaQRDetails = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR ID.",
            });
        }

        const {
            customerName,
            customerMobile,
            amountPaid,
            notes,
        } = req.body || {};

        const update = {};

        if (
            customerName !== undefined
        ) {
            update.customerName =
                String(
                    customerName
                ).trim();
        }

        if (
            customerMobile !==
            undefined
        ) {
            update.customerMobile =
                String(
                    customerMobile
                ).trim();
        }

        if (
            amountPaid !== undefined
        ) {
            const amount =
                Number(amountPaid);

            if (
                !Number.isFinite(
                    amount
                ) ||
                amount < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid amount.",
                });
            }

            update.amountPaid =
                amount;
        }

        if (
            notes !== undefined
        ) {
            update.notes =
                String(notes).trim();
        }

        const qr =
            await NashaQR.findByIdAndUpdate(
                id,
                {
                    $set: update,
                },
                {
                    new: true,
                    runValidators: true,
                }
            ).lean({
                virtuals: true,
            });

        if (!qr) {
            return res.status(404).json({
                success: false,
                message:
                    "QR code not found.",
            });
        }

        return res.json({
            success: true,
            message:
                "QR details updated successfully.",
            data: qr,
        });
    } catch (error) {
        console.error(
            "UPDATE NASHA QR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update QR details.",
        });
    }
};

// =====================================================
// CANCEL QR
// =====================================================

const cancelNashaQR = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR ID.",
            });
        }

        const {
            reason = "",
        } = req.body || {};

        const qr =
            await NashaQR.findById(
                id
            );

        if (!qr) {
            return res.status(404).json({
                success: false,
                message:
                    "QR code not found.",
            });
        }

        if (qr.nashaIssued) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot cancel a QR after Nasha has been issued.",
            });
        }

        qr.notes =
            reason?.trim() ||
            qr.notes;

        // We don't have a cancelled
        // field in your current schema.
        // Therefore mark it unavailable
        // by leaving the QR issued state.
        //
        // Better to add cancelled field later
        // if cancellation is required.

        await qr.save();

        return res.json({
            success: true,
            message:
                "QR cancellation note saved.",
            data: qr,
        });
    } catch (error) {
        console.error(
            "CANCEL NASHA QR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to cancel QR.",
        });
    }
};

// =====================================================
// ALLOCATE QR
//
// Kept for compatibility with older frontend.
// Current system does not need separate allocation.
// =====================================================

const allocateNashaQR = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const {
            nashaTicketId,
        } = req.body || {};

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid QR ID.",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(
                nashaTicketId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid Nasha ticket ID.",
            });
        }

        const ticket =
            await NashaTicket.findById(
                nashaTicketId
            );

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message:
                    "Nasha ticket not found.",
            });
        }

        const qr =
            await NashaQR.findOneAndUpdate(
                {
                    _id: id,
                    nashaIssued: false,
                },
                {
                    $set: {
                        nashaTicket:
                        ticket._id,

                        customerName:
                        ticket.customerName,

                        customerMobile:
                        ticket.mobileNumber,

                        amountPaid:
                        ticket.amountPaid,

                        paymentDate:
                        ticket.paymentDate,

                        nashaQuantity: 1,
                    },
                },
                {
                    new: true,
                }
            );

        if (!qr) {
            return res.status(404).json({
                success: false,
                message:
                    "QR code not found or already used.",
            });
        }

        return res.json({
            success: true,
            message:
                "Nasha ticket allocated to QR.",
            data: qr,
        });
    } catch (error) {
        console.error(
            "ALLOCATE NASHA QR ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to allocate QR.",
        });
    }
};

// =====================================================
// NASHA QR REPORT
//
// GET /api/nasha-qr/reports/summary
// =====================================================

const getNashaQRReport = async (
    req,
    res
) => {
    try {
        const {
            startDate,
            endDate,
        } = req.query;

        // -------------------------------------------------
        // TODAY
        // -------------------------------------------------

        const {
            start: todayStart,
            end: todayEnd,
        } = getTodayRange();

        // -------------------------------------------------
        // MAIN QR COUNTS
        // -------------------------------------------------

        const [
            totalQR,
            qrIssued,
            nashaIssued,
            availableQR,
        ] = await Promise.all([
            NashaQR.countDocuments(),

            NashaQR.countDocuments({
                qrIssued: true,
            }),

            NashaQR.countDocuments({
                nashaIssued: true,
            }),

            NashaQR.countDocuments({
                qrIssued: false,
                nashaIssued: false,
            }),
        ]);

        // -------------------------------------------------
        // PENDING NASHA
        // -------------------------------------------------

        const pendingNasha =
            Math.max(
                qrIssued -
                nashaIssued,
                0
            );

        // -------------------------------------------------
        // TODAY'S NASHA
        // -------------------------------------------------

        const todayResult =
            await NashaQR.aggregate([
                {
                    $match: {
                        nashaIssued:
                            true,

                        nashaIssuedAt: {
                            $gte:
                            todayStart,

                            $lt:
                            todayEnd,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,

                        nashaIssued: {
                            $sum: 1,
                        },

                        totalAmount: {
                            $sum:
                                "$amountPaid",
                        },

                        customers: {
                            $sum: 1,
                        },
                    },
                },
            ]);

        const today =
            todayResult[0] || {
                nashaIssued: 0,
                totalAmount: 0,
                customers: 0,
            };

        // -------------------------------------------------
        // TODAY'S QR ISSUED
        // -------------------------------------------------

        const todayQRIssued =
            await NashaQR.countDocuments({
                qrIssued: true,

                qrIssuedAt: {
                    $gte:
                    todayStart,

                    $lt:
                    todayEnd,
                },
            });

        // -------------------------------------------------
        // TODAY'S COLLECTION
        // -------------------------------------------------

        const todayCollectionResult =
            await NashaQR.aggregate([
                {
                    $match: {
                        qrIssued: true,

                        qrIssuedAt: {
                            $gte:
                            todayStart,

                            $lt:
                            todayEnd,
                        },
                    },
                },
                {
                    $group: {
                        _id: null,

                        total: {
                            $sum:
                                "$amountPaid",
                        },
                    },
                },
            ]);

        const todayCollection =
            todayCollectionResult[0]
                ?.total || 0;

        // -------------------------------------------------
        // DATE FILTER REPORT
        // -------------------------------------------------

        let dateReport = null;

        if (
            startDate ||
            endDate
        ) {
            const filter = {};

            if (startDate) {
                const start =
                    new Date(
                        startDate
                    );

                if (
                    !Number.isNaN(
                        start.getTime()
                    )
                ) {
                    start.setHours(
                        0,
                        0,
                        0,
                        0
                    );

                    filter.qrIssuedAt =
                        {
                            $gte: start,
                        };
                }
            }

            if (endDate) {
                const end =
                    new Date(
                        endDate
                    );

                if (
                    !Number.isNaN(
                        end.getTime()
                    )
                ) {
                    end.setHours(
                        23,
                        59,
                        59,
                        999
                    );

                    filter.qrIssuedAt =
                        filter.qrIssuedAt ||
                        {};

                    filter.qrIssuedAt.$lte =
                        end;
                }
            }

            const result =
                await NashaQR.aggregate([
                    {
                        $match:
                        filter,
                    },
                    {
                        $group: {
                            _id: null,

                            qrIssued: {
                                $sum: 1,
                            },

                            totalAmount: {
                                $sum:
                                    "$amountPaid",
                            },
                        },
                    },
                ]);

            dateReport =
                result[0] || {
                    qrIssued: 0,
                    totalAmount: 0,
                };
        }

        return res.json({
            success: true,

            data: {
                // -----------------------------------------
                // OVERALL
                // -----------------------------------------

                totalQR,

                qrIssued,

                availableQR,

                nashaIssued,

                pendingNasha,

                // -----------------------------------------
                // TODAY
                // -----------------------------------------

                today: {
                    nashaIssued:
                    today.nashaIssued,

                    totalAmount:
                    today.totalAmount,

                    customers:
                    today.customers,

                    qrIssued:
                    todayQRIssued,

                    collection:
                    todayCollection,
                },

                // -----------------------------------------
                // OPTIONAL DATE REPORT
                // -----------------------------------------

                dateReport,
            },
        });
    } catch (error) {
        console.error(
            "NASHA QR REPORT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate Nasha QR report.",
        });
    }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    generateNashaQRs,
    generateNashaQR,

    getAvailableNashaQRs,
    getNashaQRs,
    getNashaQR,

    getNashaQRImage,

    printNashaQRs,

    scanNashaQR,

    issueQR,
    markNashaQRIssued,

    issueNasha,
    markNashaIssued,

    allocateNashaQR,

    updateNashaQRDetails,

    getNashaQRReport,

    cancelNashaQR,
};