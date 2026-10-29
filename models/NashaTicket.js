const mongoose = require("mongoose");

// =====================================================
// NASHA TICKET SCHEMA
// =====================================================
//
// NashaTicket is the ACCOUNT / CUSTOMER record.
//
// QR lifecycle is handled separately by NashaQR:
//
//     QR generated
//          ↓
//     QR issued
//          ↓
//     Nasha issued
//
// One QR = one Nasha.
//
// This model stores:
// - Customer details
// - Payment details
// - Purchased Nasha quantity
// - Issued Nasha quantity
// - Account/report information
//
// =====================================================

const NashaTicketSchema = new mongoose.Schema(
    {
        // =====================================================
        // TICKET INFORMATION
        // =====================================================

        ticketNo: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        // =====================================================
        // CUSTOMER INFORMATION
        // =====================================================

        customerName: {
            type: String,

            trim: true,
            maxlength: 150,
        },

        mobileNumber: {
            type: String,

            trim: true,
            maxlength: 20,
            index: true,
        },

        // =====================================================
        // PAYMENT / ACCOUNTS
        // =====================================================

        amountPaid: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentDate: {
            type: Date,
            default: Date.now,
            index: true,
        },

        // =====================================================
        // NASHA QUANTITY
        // =====================================================

        // Number of Nasha purchased for this account.

        nashaQuantity: {
            type: Number,
            required: true,
            min: 1,
        },

        // Number of Nasha already issued.
        //
        // With the new QR system, normally:
        //
        //     0 = pending
        //     1 = issued
        //
        // But keeping this as a quantity allows the existing
        // Nasha ticket system to continue working.

        issuedQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        // =====================================================
        // STATUS
        // =====================================================

        status: {
            type: String,

            enum: [
                "NOT_ISSUED",
                "PARTIALLY_ISSUED",
                "ISSUED",
                "CANCELLED",
            ],

            default: "NOT_ISSUED",

            index: true,
        },

        // =====================================================
        // ISSUE INFORMATION
        // =====================================================

        issuedAt: {
            type: Date,
            default: null,
        },

        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // =====================================================
        // CANCELLATION
        // =====================================================

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
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

// Search customers / tickets.

NashaTicketSchema.index({
    customerName: "text",
    ticketNo: "text",
    mobileNumber: "text",
});

// Latest payments first.

NashaTicketSchema.index({
    paymentDate: -1,
});

// Status + payment date.

NashaTicketSchema.index({
    status: 1,
    paymentDate: -1,
});

// Customer history.

NashaTicketSchema.index({
    mobileNumber: 1,
    paymentDate: -1,
});


// =====================================================
// VIRTUAL
// REMAINING NASHA
// =====================================================

NashaTicketSchema.virtual("remainingQuantity").get(function () {
    return Math.max(
        this.nashaQuantity - this.issuedQuantity,
        0
    );
});


// =====================================================
// VIRTUAL
// IS COMPLETELY ISSUED
// =====================================================

NashaTicketSchema.virtual("isFullyIssued").get(function () {
    return (
        this.issuedQuantity >=
        this.nashaQuantity
    );
});


// =====================================================
// VIRTUAL
// HAS PENDING NASHA
// =====================================================

NashaTicketSchema.virtual("hasPendingNasha").get(function () {
    return (
        this.issuedQuantity <
        this.nashaQuantity
    );
});


// =====================================================
// VALIDATION
// =====================================================

NashaTicketSchema.pre(
    "validate",
    async function () {

        // -----------------------------------------------------
        // Issued quantity cannot exceed purchased quantity.
        // -----------------------------------------------------

        if (
            this.issuedQuantity >
            this.nashaQuantity
        ) {
            throw new Error(
                "Issued Nasha quantity cannot exceed purchased quantity."
            );
        }

        // -----------------------------------------------------
        // Issued quantity cannot be negative.
        // -----------------------------------------------------

        if (
            this.issuedQuantity < 0
        ) {
            throw new Error(
                "Issued Nasha quantity cannot be negative."
            );
        }

        // -----------------------------------------------------
        // Cancelled tickets should not have issued quantity
        // greater than purchased quantity.
        // -----------------------------------------------------

        if (
            this.status === "CANCELLED" &&
            this.issuedQuantity >
            this.nashaQuantity
        ) {
            throw new Error(
                "Invalid cancelled Nasha ticket quantity."
            );
        }
    }
);


// =====================================================
// STATUS MANAGEMENT
// =====================================================

NashaTicketSchema.pre(
    "save",
    async function () {

        // -----------------------------------------------------
        // Do not automatically change a cancelled ticket.
        // -----------------------------------------------------

        if (
            this.status === "CANCELLED"
        ) {
            return;
        }

        // -----------------------------------------------------
        // Only update status when quantity changes.
        // -----------------------------------------------------

        if (
            !this.isModified(
                "issuedQuantity"
            )
        ) {
            return;
        }

        // -----------------------------------------------------
        // Nothing issued.
        // -----------------------------------------------------

        if (
            this.issuedQuantity <= 0
        ) {

            this.status =
                "NOT_ISSUED";

            this.issuedAt = null;

            this.issuedBy = null;

            return;
        }

        // -----------------------------------------------------
        // Partially issued.
        // -----------------------------------------------------

        if (
            this.issuedQuantity <
            this.nashaQuantity
        ) {

            this.status =
                "PARTIALLY_ISSUED";

            // Do not clear issuedAt if something was already
            // issued previously.

            if (!this.issuedAt) {
                this.issuedAt =
                    new Date();
            }

            return;
        }

        // -----------------------------------------------------
        // Completely issued.
        // -----------------------------------------------------

        this.status =
            "ISSUED";

        if (!this.issuedAt) {
            this.issuedAt =
                new Date();
        }
    }
);


// =====================================================
// MODEL
// =====================================================

module.exports = mongoose.model(
    "NashaTicket",
    NashaTicketSchema
);