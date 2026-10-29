require("dotenv").config();
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const Family = require("../models/Family");

const MONGO_URI = process.env.MONGO_URI;

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected");

        const families = await Family.find();

        console.log(`Found ${families.length} families`);

        for (let fam of families) {

            if (!fam.qrId) {
                fam.qrId = uuidv4();
                console.log(`🆕 qrId created for ${fam.familyId}`);
            }

            const qrData = `https://mjmk.lk/qr/scan/${fam.qrId}`;
            const qrImage = await QRCode.toDataURL(qrData);

            fam.qrCode = qrImage;
            await Family.updateOne(
                { _id: fam._id },
                {
                    $set: {
                        qrId: fam.qrId,
                        qrCode: qrImage
                    }
                }
            );

            console.log(`✅ Fixed ${fam.familyId}`);
        }

        console.log("🎉 ALL FIXED SUCCESSFULLY");
        process.exit();

    } catch (err) {
        console.error("❌ ERROR:", err);
        process.exit(1);
    }
}

run();