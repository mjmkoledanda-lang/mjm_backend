const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
        const cleanName = file.originalname.replace(/\s/g, "_");
        cb(null, Date.now() + "-" + cleanName);
    }
});

// ✅ EXPORT INSTANCE (NOT array here)
const upload = multer({ storage });

module.exports = upload;