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

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// ======================
// QR GENERATION
// ======================
router.get("/generate/:id", protect, generateQR);
router.get("/generate-all", protect, generateAllQR);
router.post("/generate-all", protect, generateAllQR);

// ======================
// QR SCAN / STATUS
// ======================
router.get("/scan/:id", scanQR);
router.get("/status/:id", getStatus);

// ======================
// ACTIONS
// ======================
router.put("/kanji/:id", protect, markKanji);
router.put("/qurban/:id", protect, markQurban);

module.exports = router;