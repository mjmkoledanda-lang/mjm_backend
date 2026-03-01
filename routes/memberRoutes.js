const express = require("express");
const router = express.Router();

const {
    createMember,
    updateMember,
    deleteMember

} = require("../controllers/memberController");

router.post("/", createMember);
router.put("/:id", updateMember);
router.delete("/:id", deleteMember);

module.exports = router;