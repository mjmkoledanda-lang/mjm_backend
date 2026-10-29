const mongoose = require("mongoose");

// =====================================================
// NASHA QR SCHEMA
// =====================================================
//
// QR LIFECYCLE:
//
// GENERATED
//    ↓
// PRINTED
//    ↓
// QR ISSUED
//    ↓
// NASHA ISSUED
//
// ONE PHYSICAL QR = ONE NASHA
//
// First scan:
//     Issue QR
//
// Second scan:
//     Issue Nasha
//
// =====================================================

const NashaQRSchema = new mongoose.Schema(
    {
        // =====================================================
        // QR IDENTIFICATION
        // =====================================================

        qrNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        /*
         * IMPORTANT:
         *
         * This is the exact value stored inside the QR code.
         *
         * Example:
         *
         * NASHA-QR-47CC037A85384
         *
         * Do NOT store a URL here unless your QR generator
         * actually generates a URL.
         */

        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        // =====================================================
        // PRINT STATUS
        // =====================================================

        printed: {
            type: Boolean,
            default: false,
            index: true,
        },

        printedAt: {
            type: Date,
            default: null,
        },

        printedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // =====================================================
        // QR ISSUANCE
        // =====================================================
        //
        // First scan.
        //
        // Customer receives the QR.
        //
        // =====================================================

        qrIssued: {
            type: Boolean,
            default: false,
            index: true,
        },

        qrIssuedAt: {
            type: Date,
            default: null,
            index: true,
        },

        qrIssuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // =====================================================
        // NASHA ISSUANCE
        // =====================================================
        //
        // Second scan.
        //
        // Actual Nasha is issued.
        //
        // =====================================================

        nashaIssued: {
            type: Boolean,
            default: false,
            index: true,
        },

        nashaIssuedAt: {
            type: Date,
            default: null,
            index: true,
        },

        nashaIssuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // =====================================================
        // CUSTOMER
        // =====================================================

        customerName: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

        customerMobile: {
            type: String,
            trim: true,
            maxlength: 20,
            default: "",
            index: true,
        },

        // =====================================================
        // NASHA ACCOUNT / QUANTITY
        // =====================================================
        //
        // One QR = one Nasha.
        //
        // Therefore this is always 1 for QR-issued Nasha.
        //
        // =====================================================

        nashaQuantity: {
            type: Number,
            default: 1,
            min: 1,
            max: 1,
        },

        // =====================================================
        // PAYMENT
        // =====================================================

        amountPaid: {
            type: Number,
            default: 0,
            min: 0,
        },

        paymentDate: {
            type: Date,
            default: null,
            index: true,
        },

        // =====================================================
        // NASHA TICKET
        // =====================================================

        nashaTicket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NashaTicket",
            default: null,
            index: true,
        },

        // =====================================================
        // NOTES
        // =====================================================

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        // =====================================================
        // CANCEL STATUS
        // =====================================================

        cancelled: {
            type: Boolean,
            default: false,
            index: true,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        cancellationReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
    },

    {
        timestamps: true,

        toJSON: {
            virtuals: true,
        },

        toObject: {
            virtuals: true,
        },
    }
);


// =====================================================
// INDEXES
// =====================================================

// QR status
NashaQRSchema.index({
    qrIssued: 1,
    qrIssuedAt: -1,
});


// Nasha status
NashaQRSchema.index({
    nashaIssued: 1,
    nashaIssuedAt: -1,
});


// Pending Nasha
NashaQRSchema.index({
    qrIssued: 1,
    nashaIssued: 1,
});


// Printing
NashaQRSchema.index({
    printed: 1,
    createdAt: -1,
});


// Payment reports
NashaQRSchema.index({
    paymentDate: -1,
});


// Customer search
NashaQRSchema.index({
    customerName: 1,
    createdAt: -1,
});


// Mobile search
NashaQRSchema.index({
    customerMobile: 1,
    createdAt: -1,
});


// Cancelled records
NashaQRSchema.index({
    cancelled: 1,
    createdAt: -1,
});


// =====================================================
// VIRTUAL: QR STATUS
// =====================================================

NashaQRSchema.virtual("qrStatus").get(function () {

    if (this.cancelled) {
        return "CANCELLED";
    }

    if (this.qrIssued) {
        return "ISSUED";
    }

    if (this.printed) {
        return "PRINTED";
    }

    return "AVAILABLE";
});


// =====================================================
// VIRTUAL: NASHA STATUS
// =====================================================

NashaQRSchema.virtual("nashaStatus").get(function () {

    if (this.cancelled) {
        return "CANCELLED";
    }

    if (this.nashaIssued) {
        return "ISSUED";
    }

    if (this.qrIssued) {
        return "PENDING";
    }

    return "NOT_AVAILABLE";
});


// =====================================================
// VIRTUAL: FULL STATUS
// =====================================================

NashaQRSchema.virtual("status").get(function () {

    if (this.cancelled) {
        return "CANCELLED";
    }

    if (this.nashaIssued) {
        return "NASHA_ISSUED";
    }

    if (this.qrIssued) {
        return "QR_ISSUED";
    }

    if (this.printed) {
        return "PRINTED";
    }

    return "AVAILABLE";
});


// =====================================================
// VIRTUAL: CAN ISSUE QR
// =====================================================

NashaQRSchema.virtual("canIssueQR").get(function () {

    return (
        !this.cancelled &&
        this.qrIssued === false
    );
});


// =====================================================
// VIRTUAL: CAN ISSUE NASHA
// =====================================================

NashaQRSchema.virtual("canIssueNasha").get(function () {

    return (
        !this.cancelled &&
        this.qrIssued === true &&
        this.nashaIssued === false
    );
});


// =====================================================
// VIRTUAL: CAN SCAN
// =====================================================

NashaQRSchema.virtual("canScan").get(function () {

    return !this.cancelled;
});


// =====================================================
// NORMALIZE TOKEN
// =====================================================

NashaQRSchema.pre("validate", function (next) {

    if (this.token) {
        this.token = String(this.token).trim();
    }

    if (this.qrNumber) {
        this.qrNumber = String(this.qrNumber).trim();
    }

    next();
});


// =====================================================
// VALIDATION
// =====================================================

NashaQRSchema.pre("validate", function (next) {

    // -----------------------------------------------------
    // Cancelled QR cannot be issued
    // -----------------------------------------------------

    if (
        this.cancelled &&
        (
            this.qrIssued ||
            this.nashaIssued
        )
    ) {
        return next(
            new Error(
                "A cancelled QR cannot be issued."
            )
        );
    }


    // -----------------------------------------------------
    // Nasha cannot be issued before QR
    // -----------------------------------------------------

    if (
        this.nashaIssued === true &&
        this.qrIssued === false
    ) {
        return next(
            new Error(
                "Nasha cannot be issued before the QR is issued."
            )
        );
    }


    // -----------------------------------------------------
    // QR issued timestamp
    // -----------------------------------------------------

    if (
        this.qrIssued === true &&
        !this.qrIssuedAt
    ) {
        this.qrIssuedAt = new Date();
    }


    // -----------------------------------------------------
    // Nasha issued timestamp
    // -----------------------------------------------------

    if (
        this.nashaIssued === true &&
        !this.nashaIssuedAt
    ) {
        this.nashaIssuedAt = new Date();
    }


    // -----------------------------------------------------
    // Payment date
    //
    // Only set when Nasha is actually issued.
    //
    // -----------------------------------------------------

    if (
        this.nashaIssued === true &&
        !this.paymentDate
    ) {
        this.paymentDate = new Date();
    }


    // -----------------------------------------------------
    // One QR = One Nasha
    // -----------------------------------------------------

    this.nashaQuantity = 1;


    // -----------------------------------------------------
    // Amount protection
    // -----------------------------------------------------

    if (
        this.amountPaid === null ||
        this.amountPaid === undefined ||
        Number.isNaN(Number(this.amountPaid))
    ) {
        this.amountPaid = 0;
    }


    next();
});


// =====================================================
// MODEL
// =====================================================

module.exports = mongoose.model(
    "NashaQR",
    NashaQRSchema
);