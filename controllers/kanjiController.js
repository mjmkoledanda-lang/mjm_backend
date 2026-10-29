const Kanji = require("../models/Kanji");
const { getNoambuNumber } = require("../utils/noambuCalculator");

exports.getKanjiStatus = async (req, res) => {

    const today = new Date().toISOString().split("T")[0];

    const record = await Kanji.findOne({
        familyId: req.params.familyId,
        date: today
    });

    res.json({
        noambu: getNoambuNumber(),
        taken: !!record
    });
};


exports.takeKanji = async (req, res) => {

    try {

        const today = new Date().toISOString().split("T")[0];

        const exist = await Kanji.findOne({
            familyId: req.body.familyId,
            date: today
        });

        if (exist)
            return res.status(400).json("Already taken today");

        await Kanji.create({
            familyId: req.body.familyId,
            date: today,
            noambuNumber: getNoambuNumber(),
            taken: true,
            takenTime: new Date()
        });

        res.json("Kanji given");

    } catch (err) {

        res.status(500).json(err.message);
    }
};