const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

// ✅ Cloudinary upload
const upload = require("../config/multerCloudinary");


// ============================
// CREATE POST / NOTICE (ADMIN)
// ============================
router.post("/", upload.array("images", 5), async (req, res) => {
    try {
        const imageUrls = req.files?.map(file => file.path) || [];

        const post = await Post.create({
            title: req.body.title,
            content: req.body.content,
            images: imageUrls,
            type: req.body.type || "post" // ✅ DEFAULT FIXED
        });

        res.json(post);

    } catch (err) {
        console.error("CREATE POST ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


// ============================
// UPDATE POST (ADMIN)
// ============================
router.put("/:id", upload.array("images", 5), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        let imageUrls = post.images;

        if (req.files?.length > 0) {
            const newImages = req.files.map(file => file.path);

            // ✅ Append images (safe)
            imageUrls = [...post.images, ...newImages];
        }

        post.title = req.body.title || post.title;
        post.content = req.body.content || post.content;
        post.type = req.body.type || post.type;
        post.images = imageUrls;

        const updatedPost = await post.save();

        res.json(updatedPost);

    } catch (err) {
        console.error("UPDATE POST ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


// ============================
// DELETE POST (ADMIN) ✅ NEW
// ============================
router.delete("/:id", async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ============================
// GET ALL (ADMIN ONLY)
// ============================
router.get("/public", async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (err) {
        console.error("FETCH POSTS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


// ============================
// GET NOTICES ONLY
// ============================
router.get("/notices", async (req, res) => {
    try {
        const posts = await Post.find({ type: "notice" })
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ============================
// GET POSTS (INFORMATION)
// ============================
router.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find({ type: "post" })
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ============================
// GET LATEST NOTICE (LAST 24H)
// ============================
// ============================
// GET LATEST NOTICE OR INFO
// ============================
router.get("/latest-notice", async (req, res) => {
    try {
        const latest = await Post.findOne({
            type: { $in: ["notice", "information"] } // ✅ CRITICAL FIX
        }).sort({ createdAt: -1 });

        res.json(latest);
    } catch (err) {
        console.error("LATEST ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;