const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// ✅ NEW: Cloudinary upload
const upload = require("../config/multerCloudinary");


// ============================
// CREATE POST (ADMIN)
// ============================
router.post("/", upload.array("images", 5), async (req, res) => {
    try {

        console.log("FILES:", req.files);

        // ✅ Cloudinary URLs (IMPORTANT CHANGE)
        const imageUrls = req.files
            ? req.files.map(file => file.path)
            : [];

        const post = await Post.create({
            title: req.body.title,
            content: req.body.content,
            images: imageUrls
        });

        res.json(post);

    } catch (err) {
        console.error("CREATE POST ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


// ============================
// GET ALL POSTS (PUBLIC)
// ============================
router.get("/public", async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error("FETCH POSTS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;