// scripts/generateQr.js
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const Family = require("../models/Family");

const MONGO_URI = "mongodb://localhost:27017/your-db-name"; // replace with your DB

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
        generateQRCodes();
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
    });

async function generateQRCodes() {
    try {
        const families = await Family.find({});

        for (let family of families) {
            if (!family.qrId) {
                console.log(`Skipping ${family.familyId} (no qrId)`);
                continue;
            }

            const qrData = `https://mjmk.lk/qr/scan/${family.qrId}`;
            const qrImage = await QRCode.toDataURL(qrData);

            await Family.updateOne(
                { _id: family._id },
                { $set: { qrCode: qrImage } }
            );

            console.log(`✅ QR fixed for ${family.familyId}`);
        }

        console.log("🎉 All QR codes regenerated correctly");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}