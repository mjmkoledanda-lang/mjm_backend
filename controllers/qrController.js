const QRCode = require("qrcode");
const Family = require("../models/Family");

exports.generateQR = async (req, res) => {

    try {

        const family = await Family.findById(req.params.id);

        if (!family)
            return res.status(404).json("Family not found");

        const qrData = `https://mjmk.lk/scan/${family._id}`;

        const qrImage = await QRCode.toDataURL(qrData);

        family.qrCode = qrImage;

        await family.save();

        res.json(qrImage);

    } catch (err) {

        res.status(500).json(err.message);
    }
};


exports.generateAllQR = async (req, res) => {

    try {

        const families = await Family.find();

        for (let fam of families) {

            const qrData = `https://mjmk.lk/scan/${fam._id}`;

            const qrImage = await QRCode.toDataURL(qrData);

            fam.qrCode = qrImage;

            await fam.save();
        }

        res.json("All QR generated");

    } catch (err) {

        res.status(500).json(err.message);
    }
};