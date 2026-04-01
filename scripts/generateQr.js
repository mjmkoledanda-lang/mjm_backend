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
            if (!family.qrCode) {
                const qrData = `https://mjmk.lk/scan/${family._id}`;
                const qrImage = await QRCode.toDataURL(qrData);

                // ✅ Force update directly
                await Family.updateOne(
                    { _id: family._id },
                    { $set: { qrCode: qrImage } }
                );

                console.log(`QR generated for family ${family.familyId}`);
            } else {
                console.log(`Family ${family.familyId} already has QR`);
            }
        }

        console.log("✅ All QR codes processed");
        process.exit(0);

    } catch (error) {
        console.error("Error generating QR codes:", error);
        process.exit(1);
    }
}