const express = require("express");
const router = express.Router();
const upload = require("../config/multerCloudinary");
const {
    getPublicAds,
    getAllAds,
    saveSlotAd,
    toggleAdStatus,
    deleteAd
} = require("../controllers/adController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Public endpoint for TV Display & public site
router.get("/public", getPublicAds);

// Admin endpoints (Protected)
router.get("/", protect, authorizeRoles("superadmin", "admin"), getAllAds);
router.post(
    "/slot",
    protect,
    authorizeRoles("superadmin", "admin"),
    upload.single("image"),
    saveSlotAd
);
router.patch(
    "/:id/toggle",
    protect,
    authorizeRoles("superadmin", "admin"),
    toggleAdStatus
);
router.delete(
    "/:id",
    protect,
    authorizeRoles("superadmin", "admin"),
    deleteAd
);

module.exports = router;
