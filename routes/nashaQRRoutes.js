const express = require("express");

const router = express.Router();

const {
    generateNashaQRs,
    getAvailableNashaQRs,
    getNashaQRs,
    getNashaQR,
    getNashaQRImage,
    printNashaQRs,
    scanNashaQR,
    issueQR,
    issueNasha,
    updateNashaQRDetails,
    getNashaQRReport,
    cancelNashaQR,
} = require("../controllers/nashaQRController");

const {
    protect,
} = require("../middleware/authMiddleware");


// =====================================================
// AUTHENTICATION
// =====================================================

router.use(protect);


// =====================================================
// GENERATE
// POST /api/nasha-qr/generate
// =====================================================

router.post(
    "/generate",
    generateNashaQRs
);


// =====================================================
// AVAILABLE
// GET /api/nasha-qr/available
// =====================================================

router.get(
    "/available",
    getAvailableNashaQRs
);


// =====================================================
// REPORT
// GET /api/nasha-qr/reports/summary
// =====================================================

router.get(
    "/reports/summary",
    getNashaQRReport
);


// =====================================================
// SCAN
// GET /api/nasha-qr/scan/:token
// =====================================================

router.get(
    "/scan/:token",
    scanNashaQR
);


// =====================================================
// ALL QRS
// GET /api/nasha-qr
// =====================================================

router.get(
    "/",
    getNashaQRs
);


// =====================================================
// PRINT
// POST /api/nasha-qr/print
// =====================================================

router.post(
    "/print",
    printNashaQRs
);


// =====================================================
// QR IMAGE
// GET /api/nasha-qr/:id/image
// =====================================================

router.get(
    "/:id/image",
    getNashaQRImage
);


// =====================================================
// ISSUE QR
//
// FIRST TIME
//
// POST /api/nasha-qr/:id/issue-qr
// =====================================================

router.post(
    "/:id/issue-qr",
    issueQR
);


// =====================================================
// ISSUE NASHA
//
// SECOND TIME
//
// POST /api/nasha-qr/:id/issue-nasha
// =====================================================

router.post(
    "/:id/issue-nasha",
    issueNasha
);


// =====================================================
// UPDATE DETAILS
// PUT /api/nasha-qr/:id
// =====================================================

router.put(
    "/:id",
    updateNashaQRDetails
);


// =====================================================
// CANCEL
// POST /api/nasha-qr/:id/cancel
// =====================================================

router.post(
    "/:id/cancel",
    cancelNashaQR
);


// =====================================================
// SINGLE QR
//
// MUST BE LAST
// =====================================================

router.get(
    "/:id",
    getNashaQR
);


module.exports = router;