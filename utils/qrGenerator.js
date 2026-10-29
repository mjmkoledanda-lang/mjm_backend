const crypto = require("crypto");

// =====================================================
// GENERATE SECURE QR TOKEN
// =====================================================
//
// This value is actually stored inside the QR code.
//
// Example:
// NASHA-QR-8F3A91D4C2B7E901
//
// Each QR gets a unique cryptographically secure token.
// =====================================================

const generateQRToken = () => {
    return `NASHA-QR-${crypto
        .randomBytes(8)
        .toString("hex")
        .toUpperCase()}`;
};

// =====================================================
// GENERATE HUMAN-READABLE QR NUMBER
// =====================================================
//
// Example:
// NQ-MD7X8K2A-A7F31C
//
// This is displayed in the admin system.
// It does NOT need to be the QR scanning value.
// =====================================================

const generateQRNumber = () => {
    const timestamp =
        Date.now()
            .toString(36)
            .toUpperCase();

    const random =
        crypto
            .randomBytes(3)
            .toString("hex")
            .toUpperCase();

    return `NQ-${timestamp}-${random}`;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
    generateQRToken,
    generateQRNumber,
};