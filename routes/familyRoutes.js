const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { filterFamilies } = require("../controllers/filterController");
const { getFullStats } = require("../controllers/statsController");
const {
    createFamily,
    getFamilyById,
    updateFamily,
    getAllFamilies,
    searchFamilies,
    deleteFamily,
    getLastFamily,
} = require("../controllers/familyController");

// ✅ CREATE FAMILY
router.post(
    "/",
    protect,
    authorizeRoles("superadmin", "admin"),
    createFamily
);

// ✅ GET ALL
router.get("/", protect, getAllFamilies);

// ✅ SEARCH
router.get("/search/:keyword", searchFamilies);
router.post("/filter", filterFamilies);
const { getHeadStats } = require("../controllers/statsController");
router.get("/stats/full", protect, getFullStats);
router.get("/stats/head", protect, getHeadStats);

router.get("/public/stats", getFullStats);
// 🔥 VERY IMPORTANT — PLACE THIS BEFORE /:id
router.get("/last", protect, getLastFamily);





// ✅ GET SINGLE
router.get("/:id", protect, getFamilyById);

// ✅ UPDATE
router.put("/:id", protect, updateFamily);

// ✅ DELETE
router.delete(
    "/:id",
    protect,
    authorizeRoles("superadmin"),
    deleteFamily
);



module.exports = router;