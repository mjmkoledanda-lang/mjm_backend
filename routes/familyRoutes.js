const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { filterFamilies } = require("../controllers/filterController");
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
router.get("/search/:keyword", protect, searchFamilies);

router.post("/filter", filterFamilies);

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