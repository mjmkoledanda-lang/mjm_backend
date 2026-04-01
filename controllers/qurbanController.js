const Qurban = require("../models/Qurban");

exports.getQurbanStatus = async (req, res) => {

    const year = new Date().getFullYear();

    const record = await Qurban.findOne({
        familyId: req.params.familyId,
        year
    });

    res.json({
        taken: !!record
    });
};


exports.takeQurban = async (req, res) => {

    try {

        const year = new Date().getFullYear();

        const exist = await Qurban.findOne({
            familyId: req.body.familyId,
            year
        });

        if (exist)
            return res.status(400).json("Already taken");

        await Qurban.create({
            familyId: req.body.familyId,
            year,
            taken: true,
            takenDate: new Date()
        });

        res.json("Qurban given");

    } catch (err) {

        res.status(500).json(err.message);
    }
};