const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Family = require("../models/Family");

const MONGO_URI = "mongodb://127.0.0.1:27017/YOUR_DB_NAME";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB connected");

        const families = await Family.find();

        for (let fam of families) {
            if (!fam.qrId) {
                fam.qrId = uuidv4();
                await fam.save();
                console.log(`✅ qrId added to ${fam.familyId}`);
            }
        }

        console.log("🎉 DONE - qrId added");
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();