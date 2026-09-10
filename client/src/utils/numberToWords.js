/**
 * Converts a numerical amount into Indian Currency Words.
 * e.g., 2950 -> "INR Two Thousand Nine Hundred and Fifty Rupees Only"
 */
export function convertNumberToWords(num) {
  if (num === null || num === undefined || isNaN(num)) return 'INR Zero Rupees Only';
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.round(Number(num));
  if (n === 0) return 'INR Zero Rupees Only';

  function convertSection(number) {
    if (number === 0) return '';
    if (number < 20) return a[number];
    const tens = b[Math.floor(number / 10)];
    const units = a[number % 10];
    return tens + (units ? ' ' + units : '');
  }

  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore > 0) str += convertSection(crore).trim() + ' Crore ';
  if (lakh > 0) str += convertSection(lakh).trim() + ' Lakh ';
  if (thousand > 0) str += convertSection(thousand).trim() + ' Thousand ';
  if (hundred > 0) str += convertSection(hundred).trim() + ' Hundred ';
  if (rest > 0) {
    if (str !== '') str += 'and ';
    str += convertSection(rest).trim();
  }

  return `INR ${str.replace(/\s+/g, ' ').trim()} Rupees Only`;
}

export function convertTaxToWords(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = Math.round(Number(num));
  if (n === 0) return 'Zero Rupees Only';

  function convertSection(number) {
    if (number === 0) return '';
    if (number < 20) return a[number];
    const tens = b[Math.floor(number / 10)];
    const units = a[number % 10];
    return tens + (units ? ' ' + units : '');
  }

  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore > 0) str += convertSection(crore).trim() + ' Crore ';
  if (lakh > 0) str += convertSection(lakh).trim() + ' Lakh ';
  if (thousand > 0) str += convertSection(thousand).trim() + ' Thousand ';
  if (hundred > 0) str += convertSection(hundred).trim() + ' Hundred ';
  if (rest > 0) {
    if (str !== '') str += 'and ';
    str += convertSection(rest).trim();
  }

  return `${str.replace(/\s+/g, ' ').trim()} Rupees Only`;
}

