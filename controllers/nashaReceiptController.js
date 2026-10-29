const NashaReceipt = require("../models/NashaReceipt");
const crypto = require("crypto");

// =====================================================
// GENERATE RECEIPT NUMBER
// =====================================================

const generateReceiptNo = () => {
    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    const random = crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();

    return `NASHA-${year}${month}${day}-${random}`;
};


// =====================================================
// CREATE NASHA RECEIPT
// POST /api/nasha-receipts
// =====================================================

const createNashaReceipt = async (req, res) => {
    try {
        const {
            customerName,
            nashaAccount,
            amountPaid,
            notes = "",
        } = req.body;

        // -------------------------------------------------
        // CUSTOMER NAME
        // -------------------------------------------------

        const name = String(
            customerName || ""
        ).trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required.",
            });
        }

        // -------------------------------------------------
        // NASHA ACCOUNT
        // -------------------------------------------------

        const account = Number(
            nashaAccount
        );

        if (
            !Number.isInteger(account) ||
            account < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nasha account must be a valid positive number.",
            });
        }

        // -------------------------------------------------
        // AMOUNT
        // -------------------------------------------------

        const amount = Number(
            amountPaid
        );

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required.",
            });
        }

        // -------------------------------------------------
        // RECEIPT NUMBER
        // -------------------------------------------------

        const receiptNo =
            generateReceiptNo();

        // -------------------------------------------------
        // CREATE
        // -------------------------------------------------

        const receipt =
            await NashaReceipt.create({
                receiptNo,

                customerName: name,

                nashaAccount: account,

                amountPaid: amount,

                paymentDate: new Date(),

                notes: String(
                    notes || ""
                ).trim(),

                issuedBy:
                    req.user?._id ||
                    req.user?.id ||
                    null,
            });

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(201).json({
            success: true,

            message:
                "Nasha receipt issued successfully.",

            data: receipt,
        });

    } catch (error) {

        console.error(
            "CREATE NASHA RECEIPT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to issue Nasha receipt.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};


// =====================================================
// GET NASHA RECEIPTS
// GET /api/nasha-receipts
// =====================================================

const getNashaReceipts = async (
    req,
    res
) => {
    try {
        const {
            page = 1,
            limit = 50,
            search = "",
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

        const searchValue =
            String(search || "").trim();

        if (searchValue) {
            filter.$or = [
                {
                    receiptNo: {
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
            ];
        }

        const skip =
            (pageNumber - 1) *
            limitNumber;

        const [
            receipts,
            total,
        ] = await Promise.all([
            NashaReceipt.find(filter)
                .sort({
                    paymentDate: -1,
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limitNumber)
                .lean(),

            NashaReceipt.countDocuments(
                filter
            ),
        ]);

        return res.json({
            success: true,

            data: receipts,

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,

                pages: Math.ceil(
                    total / limitNumber
                ),
            },
        });

    } catch (error) {

        console.error(
            "GET NASHA RECEIPTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load Nasha receipts.",
        });
    }
};


// =====================================================
// GET SUMMARY
// GET /api/nasha-receipts/summary
// =====================================================

const getNashaReceiptSummary = async (
    req,
    res
) => {
    try {

        const receipts =
            await NashaReceipt.find({})
                .select(
                    "amountPaid nashaAccount"
                )
                .lean();

        let totalReceipts = 0;
        let totalAmount = 0;
        let totalNashaAccount = 0;

        for (const receipt of receipts) {

            totalReceipts += 1;

            const amount =
                Number(
                    receipt.amountPaid
                );

            const account =
                Number(
                    receipt.nashaAccount
                );

            if (Number.isFinite(amount)) {
                totalAmount += amount;
            }

            if (Number.isFinite(account)) {
                totalNashaAccount += account;
            }
        }

        return res.json({
            success: true,

            data: {
                totalReceipts,

                totalAmount,

                totalNashaAccount,
            },
        });

    } catch (error) {

        console.error(
            "NASHA RECEIPT SUMMARY ERROR:",
            error
        );

        // IMPORTANT:
        // Show the actual backend error while developing.
        console.error(
            error?.stack
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to load receipt summary.",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};


// =====================================================
// GET SINGLE RECEIPT
// GET /api/nasha-receipts/:id
// =====================================================

const getNashaReceipt = async (
    req,
    res
) => {
    try {

        const receipt =
            await NashaReceipt.findById(
                req.params.id
            )
                .populate(
                    "issuedBy",
                    "name username"
                )
                .lean();

        if (!receipt) {
            return res.status(404).json({
                success: false,

                message:
                    "Nasha receipt not found.",
            });
        }

        return res.json({
            success: true,

            data: receipt,
        });

    } catch (error) {

        console.error(
            "GET NASHA RECEIPT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to load receipt.",
        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    createNashaReceipt,
    getNashaReceipts,
    getNashaReceiptSummary,
    getNashaReceipt,
};