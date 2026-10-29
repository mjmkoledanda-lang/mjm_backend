exports.createPost = async (req, res) => {
    try {
        const { title, content } = req.body;

        const imageUrls = req.files?.map(file => file.path) || [];

        const post = await Post.create({
            title,
            content,
            images: imageUrls
        });

        res.status(201).json(post);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { title, content } = req.body;

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // If new images uploaded → replace or append
        let imageUrls = post.images;

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);

            // 🔁 OPTION 1: Replace images
            imageUrls = newImages;

            // 🔁 OPTION 2 (better): Append images
            // imageUrls = [...post.images, ...newImages];
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.images = imageUrls;

        const updatedPost = await post.save();

        res.json(updatedPost);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};