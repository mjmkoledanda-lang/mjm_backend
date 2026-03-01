const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            minlength: 8
        },

        role: {
            type: String,
            enum: ["superadmin", "admin"],
            default: "admin"
        },

        failedLoginAttempts: {
            type: Number,
            default: 0
        },

        lockUntil: Date,

        resetPasswordToken: String,
        resetPasswordExpire: Date,

        refreshToken: String
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);