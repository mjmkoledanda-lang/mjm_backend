const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createSuperAdmin = async () => {
    const existing = await User.findOne({ role: "superadmin" });

    if (!existing) {
        const hashedPassword = await bcrypt.hash("", 12);

        await User.create({
            name: "Super Admin",
            email: "",
            password: hashedPassword,
            role: "superadmin"
        });

        console.log("✅ Super Admin Created");
    } else {
        console.log("ℹ️ Super Admin Already Exists");
    }
};

module.exports = createSuperAdmin;