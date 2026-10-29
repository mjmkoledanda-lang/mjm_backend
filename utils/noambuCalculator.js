exports.getNoambuNumber = () => {

    const ramadanStart = new Date("2026-04-01");

    const today = new Date();

    const diff = Math.floor(
        (today - ramadanStart) / (1000 * 60 * 60 * 24)
    ) + 1;

    return diff;
};