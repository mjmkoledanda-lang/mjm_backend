const crypto = require("crypto");
const Counter = require("../models/Counter");

const getNextSequence = async (key) => {
    const counter = await Counter.findOneAndUpdate(
        { _id: key },
        {
            $inc: {
                sequence: 1
            }
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );

    return counter.sequence;
};

const generateNashaTicketNumber = async () => {
    const year = new Date().getFullYear();

    const sequence = await getNextSequence(
        `NASHA_${year}`
    );

    return `NASHA-${year}-${String(sequence).padStart(
        5,
        "0"
    )}`;
};

const generateQRToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

module.exports = {
    generateNashaTicketNumber,
    generateQRToken
};