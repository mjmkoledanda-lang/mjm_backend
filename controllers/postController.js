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