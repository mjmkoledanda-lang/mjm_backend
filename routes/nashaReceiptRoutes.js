const express = require("express");

const router = express.Router();

const {
    createNashaReceipt,
    getNashaReceipts,
    getNashaReceipt,
    getNashaReceiptSummary,
} = require("../controllers/nashaReceiptController");


// =====================================================
// CREATE RECEIPT
// POST /api/nasha-receipts
// =====================================================

router.post(
    "/",
    createNashaReceipt
);


// =====================================================
// RECEIPT SUMMARY
// GET /api/nasha-receipts/summary
// =====================================================

router.get(
    "/summary",
    getNashaReceiptSummary
);


// =====================================================
// RECEIPT LIST
// GET /api/nasha-receipts
// =====================================================

router.get(
    "/",
    getNashaReceipts
);


// =====================================================
// SINGLE RECEIPT
// GET /api/nasha-receipts/:id
// =====================================================

router.get(
    "/:id",
    getNashaReceipt
);


module.exports = router;