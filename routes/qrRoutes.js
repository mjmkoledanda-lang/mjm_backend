const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { generateQR, generateAllQR, scanQR } = require("../controllers/qrController");

// Generate QR for one family (protected)
router.post("/generate/:id", protect, authorizeRoles("superadmin", "admin"), generateQR);

// Generate QR for all families (protected)
router.post("/generate-all", protect, authorizeRoles("superadmin", "admin"), generateAllQR);

// Scan QR (public)
router.get("/scan/:id", scanQR);

module.exports = router;