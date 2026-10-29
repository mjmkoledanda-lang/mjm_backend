const Advertisement = require("../models/Advertisement");

// ==========================================
// 1. GET PUBLIC ADS (FOR TV DISPLAY)
// ==========================================
exports.getPublicAds = async (req, res) => {
    try {
        const ads = await Advertisement.find({ active: true }).sort({ slot: 1, updatedAt: -1 });

        // Map into slots 1, 2, 3
        const slots = {
            1: null,
            2: null,
            3: null
        };

        ads.forEach(ad => {
            if (!slots[ad.slot]) {
                slots[ad.slot] = ad;
            }
        });

        res.status(200).json({
            success: true,
            slots,
            allActiveAds: ads
        });
    } catch (error) {
        console.error("Error fetching public ads:", error);
        res.status(500).json({ success: false, message: "Failed to fetch advertisements" });
    }
};

// ==========================================
// 2. GET ALL ADS (ADMIN)
// ==========================================
exports.getAllAds = async (req, res) => {
    try {
        const ads = await Advertisement.find().sort({ slot: 1, createdAt: -1 });
        res.status(200).json({ success: true, data: ads });
    } catch (error) {
        console.error("Error fetching ads:", error);
        res.status(500).json({ success: false, message: "Failed to load advertisements" });
    }
};

// ==========================================
// 3. CREATE OR UPDATE AD FOR A SLOT
// ==========================================
exports.saveSlotAd = async (req, res) => {
    try {
        const slot = Number(req.body.slot);
        const { title, sponsor, linkUrl, active } = req.body;

        if (!slot || slot < 1 || slot > 3) {
            return res.status(400).json({ success: false, message: "Slot must be 1, 2, or 3" });
        }

        let imageUrl = req.body.imageUrl || "";

        // If a file was uploaded via multerCloudinary
        if (req.file && (req.file.path || req.file.secure_url)) {
            imageUrl = req.file.path || req.file.secure_url;
        }

        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                message: "Image is required. Please upload a portrait flyer image or provide an image URL."
            });
        }

        // Upsert by slot: replace existing or create new
        const ad = await Advertisement.findOneAndUpdate(
            { slot: slot },
            {
                slot: slot,
                title: title || `Advertisement Slot ${slot}`,
                sponsor: sponsor || "",
                imageUrl: imageUrl,
                linkUrl: linkUrl || "",
                active: active !== undefined ? Boolean(active) : true
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            message: `Advertisement for Slot ${slot} saved successfully`,
            data: ad
        });
    } catch (error) {
        console.error("Error saving slot ad:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to save advertisement" });
    }
};

// ==========================================
// 4. TOGGLE AD ACTIVE STATUS
// ==========================================
exports.toggleAdStatus = async (req, res) => {
    try {
        const ad = await Advertisement.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: "Advertisement not found" });
        }

        ad.active = !ad.active;
        await ad.save();

        res.status(200).json({
            success: true,
            message: `Slot ${ad.slot} is now ${ad.active ? "Active" : "Hidden"}`,
            data: ad
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

// ==========================================
// 5. DELETE AD
// ==========================================
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Advertisement.findByIdAndDelete(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: "Advertisement not found" });
        }

        res.status(200).json({ success: true, message: `Slot ${ad.slot} ad removed` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete ad" });
    }
};
