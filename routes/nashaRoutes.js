const express = require("express");

const router = express.Router();

// =====================================================
// NASHA TICKET CONTROLLER
// =====================================================

const {
    createNashaTicket,
    getNashaTickets,
    getNashaTicket,
    getNashaReport,
} = require("../controllers/nashaController");

// =====================================================
// AUTHENTICATION
// =====================================================

const {
    protect,
} = require("../middleware/authMiddleware");

// =====================================================
// PROTECT ALL NASHA ROUTES
// =====================================================

router.use(protect);

// =====================================================
// CREATE NASHA TICKET
// POST /api/nasha
//
// Used for accounts:
// - Customer name
// - Mobile number
// - Nasha quantity
// - Amount paid
// - Payment date
// =====================================================

router.post(
    "/",
    createNashaTicket
);

// =====================================================
// GET ALL NASHA TICKETS
// GET /api/nasha
//
// Optional query parameters can be used:
// ?page=1
// ?limit=20
// ?search=...
// ?status=...
// =====================================================

router.get(
    "/",
    getNashaTickets
);

// =====================================================
// NASHA REPORT
// GET /api/nasha/reports/summary
//
// Used for accounts/reporting:
// - Today's Nasha
// - Total Nasha
// - Total amount
// - Pending Nasha
// - Issued Nasha
// =====================================================

router.get(
    "/reports/summary",
    getNashaReport
);

// =====================================================
// GET SINGLE NASHA TICKET
// GET /api/nasha/:id
//
// IMPORTANT:
// Keep this route AFTER /reports/summary
// =====================================================

router.get(
    "/:id",
    getNashaTicket
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;