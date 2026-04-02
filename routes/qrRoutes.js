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

// QR
router.get("/generate/:id", generateQR);
router.get("/generate-all", generateAllQR);

// Scan
router.get("/scan/:id", scanQR);

// Status
router.get("/status/:id", getStatus);

// Mark actions
router.put("/kanji/:id", markKanji);
router.put("/qurban/:id", markQurban);

module.exports = router;