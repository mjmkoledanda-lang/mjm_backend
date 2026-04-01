const mongoose = require("mongoose");
const Family = require("../models/Family"); // adjust path if needed

const MONGO_URI = "mongodb://localhost:27017/your-db-name"; // same DB as before

async function main() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected");

        const result = await Family.updateMany(
            { qrCode: { $exists: true } }, // only families that have qrCode
            { $unset: { qrCode: "" } }     // remove the field
        );

        console.log(`✅ QR codes removed from ${result.modifiedCount} families`);
    } catch (error) {
        console.error("Error reverting QR codes:", error);
    } finally {
        await mongoose.disconnect();
    }
}

main();