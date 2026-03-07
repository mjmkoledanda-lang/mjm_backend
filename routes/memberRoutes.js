const express = require("express");
const router = express.Router();

const {
    createMember,
    updateMember,
    deleteMember,
    getMemberById,
    getAllMembers,
    getMembersByFamily
} = require("../controllers/memberController");


// CREATE MEMBER
router.post("/", createMember);

// GET ALL MEMBERS
router.get("/", getAllMembers);

// GET MEMBERS BY FAMILY (131, 131A, 131B, 131C)
router.get("/family/:familyId", getMembersByFamily);

// GET SINGLE MEMBER
router.get("/:id", getMemberById);

// UPDATE MEMBER
router.put("/:id", updateMember);

// DELETE MEMBER
router.delete("/:id", deleteMember);


module.exports = router;