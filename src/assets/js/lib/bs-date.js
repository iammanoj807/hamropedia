// Bikram Sambat (BS) <-> Gregorian (AD) date conversion.
//
// Month lengths come from the published BS calendar data used by the
// open-source "nepali-date-converter" package, cross-checked against an
// independent table (@remotemerge/nepali-date-converter): both agree for every
// year from 2000 to 2083 BS. They disagree from 2084 onwards because the
// official calendar for those years is not final, so 2084+ is "provisional".
//
// Anchor: 1 Baisakh 2000 BS = 14 April 1943 AD.

export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;
export const BS_PROVISIONAL_FROM = 2084;

const MONTH_DAYS = [
  [30,32,31,32,31,30,30,30,29,30,29,31], // 2000
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2001
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2002
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2003
  [30,32,31,32,31,30,30,30,29,30,29,31], // 2004
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2005
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2006
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2007
  [31,31,31,32,31,31,29,30,30,29,29,31], // 2008
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2009
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2010
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2011
  [31,31,31,32,31,31,29,30,30,29,30,30], // 2012
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2013
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2014
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2015
  [31,31,31,32,31,31,29,30,30,29,30,30], // 2016
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2017
  [31,32,31,32,31,30,30,29,30,29,30,30], // 2018
  [31,32,31,32,31,30,30,30,29,30,29,31], // 2019
  [31,31,31,32,31,31,30,29,30,29,30,30], // 2020
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2021
  [31,32,31,32,31,30,30,30,29,29,30,30], // 2022
  [31,32,31,32,31,30,30,30,29,30,29,31], // 2023
  [31,31,31,32,31,31,30,29,30,29,30,30], // 2024
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2025
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2026
  [30,32,31,32,31,30,30,30,29,30,29,31], // 2027
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2028
  [31,31,32,31,32,30,30,29,30,29,30,30], // 2029
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2030
  [30,32,31,32,31,30,30,30,29,30,29,31], // 2031
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2032
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2033
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2034
  [30,32,31,32,31,31,29,30,30,29,29,31], // 2035
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2036
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2037
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2038
  [31,31,31,32,31,31,29,30,30,29,30,30], // 2039
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2040
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2041
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2042
  [31,31,31,32,31,31,29,30,30,29,30,30], // 2043
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2044
  [31,32,31,32,31,30,30,29,30,29,30,30], // 2045
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2046
  [31,31,31,32,31,31,30,29,30,29,30,30], // 2047
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2048
  [31,32,31,32,31,30,30,30,29,29,30,30], // 2049
  [31,32,31,32,31,30,30,30,29,30,29,31], // 2050
  [31,31,31,32,31,31,30,29,30,29,30,30], // 2051
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2052
  [31,32,31,32,31,30,30,30,29,29,30,30], // 2053
  [31,32,31,32,31,30,30,30,29,30,29,31], // 2054
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2055
  [31,31,32,31,32,30,30,29,30,29,30,30], // 2056
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2057
  [30,32,31,32,31,30,30,30,29,30,29,31], // 2058
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2059
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2060
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2061
  [30,32,31,32,31,31,29,30,29,30,29,31], // 2062
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2063
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2064
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2065
  [31,31,31,32,31,31,29,30,30,29,29,31], // 2066
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2067
  [31,31,32,32,31,30,30,29,30,29,30,30], // 2068
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2069
  [31,31,31,32,31,31,29,30,30,29,30,30], // 2070
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2071
  [31,32,31,32,31,30,30,29,30,29,30,30], // 2072
  [31,32,31,32,31,30,30,30,29,29,30,31], // 2073
  [31,31,31,32,31,31,30,29,30,29,30,30], // 2074
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2075
  [31,32,31,32,31,30,30,30,29,29,30,30], // 2076
  [31,32,31,32,31,30,30,30,29,30,29,31], // 2077
  [31,31,31,32,31,31,30,29,30,29,30,30], // 2078
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2079
  [31,32,31,32,31,30,30,30,29,29,30,30], // 2080
  [31,32,31,32,31,30,30,30,29,30,29,31], // 2081
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2082
  [31,31,32,31,31,31,30,29,30,29,30,30], // 2083
  [31,31,32,31,31,30,30,30,29,30,30,30], // 2084
  [31,32,31,32,30,31,30,30,29,30,30,30], // 2085
  [30,32,31,32,31,30,30,30,29,30,30,30], // 2086
  [31,31,32,31,31,31,30,30,29,30,30,30], // 2087
  [30,31,32,32,30,31,30,30,29,30,30,30], // 2088
  [30,32,31,32,31,30,30,30,29,30,30,30], // 2089
  [30,32,31,32,31,30,30,30,29,30,30,30], // 2090
];

const EPOCH_UTC = Date.UTC(1943, 3, 14);
const DAY = 86400000;

export const BS_MONTHS_EN = ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'];
export const BS_MONTHS_NE = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कात्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'];
export const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAYS_NE = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
export const AD_MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
export const toNepaliDigits = (v) => String(v).replace(/[0-9]/g, (d) => NE_DIGITS[d]);

export function daysInBsMonth(year, month) {
  checkBsYear(year);
  if (month < 1 || month > 12) throw new RangeError('Month must be 1 to 12');
  return MONTH_DAYS[year - BS_MIN_YEAR][month - 1];
}

export function daysInBsYear(year) {
  checkBsYear(year);
  return MONTH_DAYS[year - BS_MIN_YEAR].reduce((a, b) => a + b, 0);
}

function checkBsYear(year) {
  if (!Number.isInteger(year) || year < BS_MIN_YEAR || year > BS_MAX_YEAR) {
    throw new RangeError(`BS year must be between ${BS_MIN_YEAR} and ${BS_MAX_YEAR}`);
  }
}

export const AD_MAX = (() => {
  const end = bsToAd(BS_MAX_YEAR, 12, MONTH_DAYS[BS_MAX_YEAR - BS_MIN_YEAR][11]);
  return end;
})();

/** Convert a BS date to AD. Months are 1-based. Returns { year, month, day, weekday }. */
export function bsToAd(year, month, day) {
  const dim = daysInBsMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > dim) {
    throw new RangeError(`${BS_MONTHS_EN[month - 1]} ${year} has ${dim} days`);
  }
  let days = 0;
  for (let y = BS_MIN_YEAR; y < year; y++) days += daysInBsYear(y);
  for (let m = 1; m < month; m++) days += MONTH_DAYS[year - BS_MIN_YEAR][m - 1];
  days += day - 1;
  const d = new Date(EPOCH_UTC + days * DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay() };
}

/** Convert an AD date to BS. Months are 1-based. Returns { year, month, day, weekday }. */
export function adToBs(year, month, day) {
  const t = Date.UTC(year, month - 1, day);
  const check = new Date(t);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new RangeError('That AD date does not exist');
  }
  let offset = Math.round((t - EPOCH_UTC) / DAY);
  if (offset < 0) throw new RangeError('Dates before 14 April 1943 AD are not supported');
  const weekday = check.getUTCDay();
  for (let y = BS_MIN_YEAR; y <= BS_MAX_YEAR; y++) {
    const months = MONTH_DAYS[y - BS_MIN_YEAR];
    for (let m = 0; m < 12; m++) {
      if (offset < months[m]) return { year: y, month: m + 1, day: offset + 1, weekday };
      offset -= months[m];
    }
  }
  throw new RangeError(`Dates after the end of ${BS_MAX_YEAR} BS are not supported`);
}

/** Today's date in Nepal (UTC+5:45), as BS. */
export function todayInNepal(now = new Date()) {
  const npt = new Date(now.getTime() + (5 * 60 + 45) * 60000);
  return adToBs(npt.getUTCFullYear(), npt.getUTCMonth() + 1, npt.getUTCDate());
}

export function formatBs({ year, month, day, weekday }, lang = 'ne') {
  if (lang === 'ne') {
    const w = weekday === undefined ? '' : `, ${WEEKDAYS_NE[weekday]}`;
    return `${toNepaliDigits(year)} ${BS_MONTHS_NE[month - 1]} ${toNepaliDigits(day)}${w}`;
  }
  const w = weekday === undefined ? '' : `${WEEKDAYS_EN[weekday]}, `;
  return `${w}${day} ${BS_MONTHS_EN[month - 1]} ${year} BS`;
}

export function formatAd({ year, month, day, weekday }) {
  const w = weekday === undefined ? '' : `${WEEKDAYS_EN[weekday]}, `;
  return `${w}${day} ${AD_MONTHS_EN[month - 1]} ${year}`;
}
