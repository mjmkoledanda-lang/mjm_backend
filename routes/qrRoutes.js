const express = require("express");
const router = express.Router();

const {
    generateQR,
    generateAllQR,
    scanQR,
    getStatus,
    markKanji,
    markQurban,
} = require("../controllers/qrController");

// ======================
// QR GENERATION
// ======================
router.get("/generate/:id", generateQR);
router.get("/generate-all", generateAllQR);

// ======================
// QR SCAN (FIXED)
// ======================
router.get("/scan/:id", scanQR);

// ======================
// STATUS
// ======================
router.get("/status/:id", getStatus);

// ======================
// ACTIONS
// ======================
router.put("/kanji/:id", markKanji);
router.put("/qurban/:id", markQurban);

module.exports = router;