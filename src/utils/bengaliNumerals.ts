const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toBengaliNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)] || digit);
}

export function toEnglishNumber(bengaliStr: string | undefined | null): string {
  if (!bengaliStr) return '';
  let res = String(bengaliStr);
  BENGALI_DIGITS.forEach((bDigit, idx) => {
    res = res.replaceAll(bDigit, String(idx));
  });
  return res;
}

export function parseAcreValue(areaStr: string | undefined): number {
  if (!areaStr) return 0;
  // Try to find numbers (supports both Bengali and English digits)
  const eng = toEnglishNumber(areaStr);
  const match = eng.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  if (isNaN(val)) return 0;

  // If the unit specifies শতাংশ / shotok / decimal / decimal, convert to acre
  if (areaStr.includes('শতাংশ') || areaStr.includes('শতক') || areaStr.includes('decimal')) {
    return val / 100;
  }
  return val;
}

export function formatAreaBengali(acreValue: number): string {
  const acreFormatted = acreValue.toFixed(4);
  const shotok = (acreValue * 100).toFixed(2);
  return `${toBengaliNumber(acreFormatted)} একর (${toBengaliNumber(shotok)} শতাংশ)`;
}

export function convertAcreToKatha(acre: number): string {
  // 1 acre = 60.5 katha (standard BD conversion: 1 katha = 1.65 shotok)
  const katha = acre * 60.5;
  return `${toBengaliNumber(katha.toFixed(2))} কাঠা`;
}

export function convertAcreToBigha(acre: number): string {
  // 1 acre = 3.025 bigha (1 bigha = 20 katha = 33 shotok)
  const bigha = acre * 3.025;
  return `${toBengaliNumber(bigha.toFixed(2))} বিঘা`;
}
