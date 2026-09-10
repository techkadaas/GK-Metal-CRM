/**
 * Calculates complete GST, line items, and totals based on state codes and items
 */
export function calculateInvoiceTotals({
  items = [],
  companyStateCode = '33',
  buyerStateCode = '33',
  forcedInterstate = null,
  cgstRate = 9,
  sgstRate = 9,
  igstRate = 18,
  manualRoundOff = null
}) {
  const isInterstate = forcedInterstate !== null 
    ? Boolean(forcedInterstate)
    : (String(buyerStateCode || '33').trim() !== String(companyStateCode || '33').trim());

  let subtotal = 0;
  let taxableTotal = 0;

  const calculatedItems = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discountPct = Number(item.discountPercent) || 0;
    const gross = qty * rate;
    const discountVal = (gross * discountPct) / 100;
    const taxable = gross - discountVal;

    subtotal += gross;
    taxableTotal += taxable;

    return {
      ...item,
      slNo: idx + 1,
      quantity: qty,
      rate,
      discountPercent: discountPct,
      taxableAmount: taxable
    };
  });

  const discountTotal = subtotal - taxableTotal;

  let calculatedCgstAmount = 0;
  let calculatedSgstAmount = 0;
  let calculatedIgstAmount = 0;

  if (isInterstate) {
    calculatedIgstAmount = (taxableTotal * (Number(igstRate) || 18)) / 100;
  } else {
    calculatedCgstAmount = (taxableTotal * (Number(cgstRate) || 9)) / 100;
    calculatedSgstAmount = (taxableTotal * (Number(sgstRate) || 9)) / 100;
  }

  const totalTax = calculatedCgstAmount + calculatedSgstAmount + calculatedIgstAmount;
  const rawGrandTotal = taxableTotal + totalTax;

  let roundOff = 0;
  let grandTotal = 0;

  if (manualRoundOff !== null && manualRoundOff !== undefined && !isNaN(Number(manualRoundOff))) {
    roundOff = Number(manualRoundOff);
    grandTotal = Math.round(rawGrandTotal + roundOff);
  } else {
    const rounded = Math.round(rawGrandTotal);
    roundOff = Number((rounded - rawGrandTotal).toFixed(2));
    grandTotal = rounded;
  }

  return {
    items: calculatedItems,
    subtotal: Number(subtotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxableTotal: Number(taxableTotal.toFixed(2)),
    isInterstate,
    cgstRate: isInterstate ? 0 : cgstRate,
    cgstAmount: Number(calculatedCgstAmount.toFixed(2)),
    sgstRate: isInterstate ? 0 : sgstRate,
    sgstAmount: Number(calculatedSgstAmount.toFixed(2)),
    igstRate: isInterstate ? igstRate : 0,
    igstAmount: Number(calculatedIgstAmount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    roundOff,
    grandTotal
  };
}

export const INDIAN_STATES = [
  { code: '33', name: 'Tamil Nadu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '32', name: 'Kerala' },
  { code: '24', name: 'Gujarat' },
  { code: '07', name: 'Delhi' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '08', name: 'Rajasthan' },
  { code: '19', name: 'West Bengal' },
  { code: '21', name: 'Odisha' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '06', name: 'Haryana' },
  { code: '03', name: 'Punjab' },
  { code: '34', name: 'Puducherry' }
];
