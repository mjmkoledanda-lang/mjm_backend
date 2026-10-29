const START_YEAR = 2020;
const START_MONTH = 1;

/**
 * Calculates arrears for a family given their payments.
 * Ensures changing monthlyAmount does NOT retroactively penalize past paid months.
 * Only unpaid / pending months from 2020 to current month are charged at current monthlyAmount.
 *
 * @param {Object} family - Family document or object with monthlyAmount, manualArrears
 * @param {Array} payments - Array of payment objects for this family
 * @param {Date} [referenceDate] - Optional date (defaults to now)
 * @returns {Object} { totalMonths, paidMonthsCount, unpaidMonths, monthlyAmount, arrearsAfter2020, manualArrears, totalArrears }
 */
function calculateFamilyArrears(family, payments = [], referenceDate = new Date()) {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth() + 1;

    const totalMonths = (currentYear - START_YEAR) * 12 + (currentMonth - START_MONTH + 1);

    // Count distinct paid months from START_YEAR (2020) onwards
    const paidSet = new Set();
    for (const p of payments || []) {
        const y = Number(p.year);
        const m = Number(p.month);
        const amt = Number(p.amount || 0);
        if (y >= START_YEAR && amt > 0) {
            paidSet.add(`${y}_${m}`);
        }
    }

    const paidMonthsCount = paidSet.size;
    const unpaidMonths = Math.max(0, totalMonths - paidMonthsCount);
    const monthlyAmount = Number(family?.monthlyAmount || 0);
    const arrearsAfter2020 = unpaidMonths * monthlyAmount;
    const manualArrears = Number(family?.manualArrears || 0);
    const totalArrears = arrearsAfter2020 + manualArrears;

    return {
        totalMonths,
        paidMonthsCount,
        unpaidMonths,
        monthlyAmount,
        arrearsAfter2020,
        manualArrears,
        totalArrears
    };
}

module.exports = {
    START_YEAR,
    START_MONTH,
    calculateFamilyArrears
};
