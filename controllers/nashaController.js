const mongoose = require("mongoose");
const NashaTicket = require("../models/NashaTicket");

// =====================================================
// HELPER - GENERATE UNIQUE TICKET NUMBER
// =====================================================

const generateTicketNumber = async () => {
    const prefix = "NASHA";

    for (let attempt = 0; attempt < 10; attempt++) {
        const ticketNo = `${prefix}-${Date.now()}-${Math.floor(
            1000 + Math.random() * 9000
        )}`;

        const exists = await NashaTicket.exists({
            ticketNo,
        });

        if (!exists) {
            return ticketNo;
        }
    }

    throw new Error(
        "Unable to generate a unique Nasha ticket number."
    );
};

// =====================================================
// CREATE NASHA TICKET
// POST /api/nasha
// =====================================================
//
// This is the ACCOUNTING record.
//
// Customer buys Nasha:
//
// Customer Name
// Mobile Number
// Nasha Quantity
// Amount Paid
//
// issuedQuantity initially = 0
//
// QR issuing / Nasha issuing is handled by
// nashaQRController.js
// =====================================================

const createNashaTicket = async (req, res) => {
    try {
        const {
            customerName,
            mobileNumber,
            amountPaid,
            nashaQuantity,
            paymentDate,
            notes,
        } = req.body;

        // -------------------------------------------------
        // CUSTOMER NAME
        // -------------------------------------------------

        if (
            typeof customerName !== "string" ||
            !customerName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required.",
            });
        }

        // -------------------------------------------------
        // MOBILE NUMBER
        // -------------------------------------------------

        if (
            typeof mobileNumber !== "string" ||
            !mobileNumber.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Mobile number is required.",
            });
        }

        // -------------------------------------------------
        // NASHA QUANTITY
        // -------------------------------------------------

        const quantity = Number(nashaQuantity);

        if (
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nasha quantity must be a whole number greater than 0.",
            });
        }

        // -------------------------------------------------
        // AMOUNT
        // -------------------------------------------------

        const amount = Number(amountPaid);

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Amount paid must be a valid non-negative number.",
            });
        }

        // -------------------------------------------------
        // PAYMENT DATE
        // -------------------------------------------------

        let finalPaymentDate = new Date();

        if (paymentDate) {
            const parsedDate = new Date(paymentDate);

            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid payment date.",
                });
            }

            finalPaymentDate = parsedDate;
        }

        // -------------------------------------------------
        // GENERATE TICKET NUMBER
        // -------------------------------------------------

        const ticketNo =
            await generateTicketNumber();

        // -------------------------------------------------
        // CREATE TICKET
        // -------------------------------------------------

        const ticket =
            await NashaTicket.create({
                ticketNo,

                customerName: cleanCustomerName,

                customerMobile: cleanCustomerMobile,

                amountPaid:
                amount,

                paymentDate:
                finalPaymentDate,

                nashaQuantity:
                quantity,

                issuedQuantity: 0,

                status:
                    "NOT_ISSUED",

                notes:
                    typeof notes === "string"
                        ? notes.trim()
                        : "",
            });

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(201).json({
            success: true,
            message:
                "Nasha ticket created successfully.",
            data: ticket,
        });
    } catch (error) {
        console.error(
            "CREATE NASHA TICKET ERROR:",
            error
        );

        // Duplicate ticket number
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "Ticket number already exists. Please try again.",
            });
        }

        // Mongoose validation
        if (
            error.name ===
            "ValidationError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    Object.values(error.errors)
                        .map((err) => err.message)
                        .join(", "),
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create Nasha ticket.",
        });
    }
};

// =====================================================
// GET NASHA TICKETS
// GET /api/nasha
// =====================================================
//
// Supports:
//
// ?page=1
// ?limit=50
// ?search=077
// ?status=NOT_ISSUED
// ?from=2026-08-23
// ?to=2026-08-23
//
// =====================================================

const getNashaTickets = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
            status,
            from,
            to,
        } = req.query;

        // -------------------------------------------------
        // PAGINATION
        // -------------------------------------------------

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

        // -------------------------------------------------
        // FILTER
        // -------------------------------------------------

        const filter = {};

        // -------------------------------------------------
        // SEARCH
        // -------------------------------------------------

        if (
            typeof search === "string" &&
            search.trim()
        ) {
            const searchValue =
                search.trim();

            filter.$or = [
                {
                    ticketNo: {
                        $regex:
                        searchValue,
                        $options: "i",
                    },
                },
                {
                    customerName: {
                        $regex:
                        searchValue,
                        $options: "i",
                    },
                },
                {
                    mobileNumber: {
                        $regex:
                        searchValue,
                        $options: "i",
                    },
                },
            ];
        }

        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        const validStatuses = [
            "NOT_ISSUED",
            "PARTIALLY_ISSUED",
            "ISSUED",
            "CANCELLED",
        ];

        if (
            status &&
            validStatuses.includes(status)
        ) {
            filter.status = status;
        }

        // -------------------------------------------------
        // DATE FILTER
        // -------------------------------------------------

        if (from || to) {
            filter.paymentDate = {};

            if (from) {
                const startDate =
                    new Date(from);

                if (
                    Number.isNaN(
                        startDate.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid 'from' date.",
                    });
                }

                startDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                filter.paymentDate.$gte =
                    startDate;
            }

            if (to) {
                const endDate =
                    new Date(to);

                if (
                    Number.isNaN(
                        endDate.getTime()
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid 'to' date.",
                    });
                }

                endDate.setHours(
                    23,
                    59,
                    59,
                    999
                );

                filter.paymentDate.$lte =
                    endDate;
            }
        }

        // -------------------------------------------------
        // QUERY
        // -------------------------------------------------

        const skip =
            (pageNumber - 1) *
            limitNumber;

        const [
            tickets,
            total,
        ] = await Promise.all([
            NashaTicket.find(filter)
                .sort({
                    paymentDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber)
                .lean({
                    virtuals: true,
                }),

            NashaTicket.countDocuments(
                filter
            ),
        ]);

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.json({
            success: true,

            data: tickets,

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,

                pages:
                    Math.ceil(
                        total /
                        limitNumber
                    ),

                hasNextPage:
                    pageNumber <
                    Math.ceil(
                        total /
                        limitNumber
                    ),

                hasPreviousPage:
                    pageNumber > 1,
            },
        });
    } catch (error) {
        console.error(
            "GET NASHA TICKETS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load Nasha tickets.",
        });
    }
};

// =====================================================
// GET SINGLE NASHA TICKET
// GET /api/nasha/:id
// =====================================================

const getNashaTicket = async (req, res) => {
    try {
        const { id } = req.params;

        // -------------------------------------------------
        // VALIDATE OBJECT ID
        // -------------------------------------------------

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid Nasha ticket ID.",
            });
        }

        // -------------------------------------------------
        // GET TICKET
        // -------------------------------------------------

        const ticket =
            await NashaTicket.findById(
                id
            ).lean({
                virtuals: true,
            });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message:
                    "Nasha ticket not found.",
            });
        }

        return res.json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        console.error(
            "GET NASHA TICKET ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load Nasha ticket.",
        });
    }
};

// =====================================================
// NASHA REPORT
// GET /api/nasha/reports/summary
// =====================================================
//
// DEFAULT:
//
// Today's report.
//
// Returns:
//
// totalCustomers
// totalNasha
// issuedNasha
// pendingNasha
// totalAmount
//
// =====================================================

const getNashaReport = async (req, res) => {
    try {
        const {
            date,
            from,
            to,
        } = req.query;

        let start;
        let end;

        // =================================================
        // DATE RANGE
        // =================================================

        if (from || to) {
            // ---------------------------------------------
            // FROM
            // ---------------------------------------------

            if (from) {
                start = new Date(from);
            } else {
                start = new Date();
            }

            // ---------------------------------------------
            // TO
            // ---------------------------------------------

            if (to) {
                end = new Date(to);
            } else {
                end = new Date(start);
            }

            if (
                Number.isNaN(
                    start.getTime()
                ) ||
                Number.isNaN(
                    end.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid report date range.",
                });
            }

            start.setHours(
                0,
                0,
                0,
                0
            );

            end.setHours(
                23,
                59,
                59,
                999
            );
        }

            // =================================================
            // SINGLE DATE
        // =================================================

        else {
            const selectedDate =
                date
                    ? new Date(date)
                    : new Date();

            if (
                Number.isNaN(
                    selectedDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid report date.",
                });
            }

            start = new Date(
                selectedDate
            );

            start.setHours(
                0,
                0,
                0,
                0
            );

            end = new Date(
                start
            );

            end.setDate(
                end.getDate() + 1
            );
        }

        // =================================================
        // AGGREGATION
        // =================================================

        const report =
            await NashaTicket.aggregate([
                {
                    $match: {
                        paymentDate: {
                            $gte: start,
                            $lt: end,
                        },
                    },
                },

                {
                    $group: {
                        _id: null,

                        totalCustomers: {
                            $sum: 1,
                        },

                        totalNasha: {
                            $sum:
                                "$nashaQuantity",
                        },

                        issuedNasha: {
                            $sum:
                                "$issuedQuantity",
                        },

                        totalAmount: {
                            $sum:
                                "$amountPaid",
                        },
                    },
                },
            ]);

        // =================================================
        // DEFAULT VALUES
        // =================================================

        const result =
            report[0] || {
                totalCustomers: 0,
                totalNasha: 0,
                issuedNasha: 0,
                totalAmount: 0,
            };

        // =================================================
        // PENDING NASHA
        // =================================================

        result.pendingNasha =
            Math.max(
                result.totalNasha -
                result.issuedNasha,
                0
            );

        // =================================================
        // CLEAN RESPONSE
        // =================================================

        const data = {
            dateFrom: start,
            dateTo: end,

            totalCustomers:
            result.totalCustomers,

            totalNasha:
            result.totalNasha,

            issuedNasha:
            result.issuedNasha,

            pendingNasha:
            result.pendingNasha,

            totalAmount:
            result.totalAmount,
        };

        return res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error(
            "NASHA REPORT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate Nasha report.",
        });
    }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    createNashaTicket,
    getNashaTickets,
    getNashaTicket,
    getNashaReport,
};