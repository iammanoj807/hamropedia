// Exact age, in calendar years, months and days. Pure functions, no DOM.
//
// Rules (also explained on the tool page):
//  - Age counts whole calendar months from the birth date, then the days left over.
//  - If the birth day does not exist in a month (the 31st, or 29 February), the
//    last day of that month counts as the monthly anniversary. So someone born on
//    29 February turns a year older on 28 February in non-leap years.
//  - Dates are calendar dates with no time zone: the page passes the visitor's
//    own local "today".

const DAY = 86400000;
const utc = ({ year, month, day }) => Date.UTC(year, month - 1, day);

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isValidDate({ year, month, day }) {
  if (![year, month, day].every(Number.isInteger)) return false;
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/** The date `months` calendar months after `birth`, clamped to the end of short months. */
function anniversary(birth, months) {
  const index = birth.month - 1 + months;
  const year = birth.year + Math.floor(index / 12);
  const month = (((index % 12) + 12) % 12) + 1;
  return { year, month, day: Math.min(birth.day, daysInMonth(year, month)) };
}

/** Age on a given date. Both arguments are { year, month, day }. */
export function ageOn(birth, on) {
  if (!isValidDate(birth) || !isValidDate(on)) throw new RangeError('Please enter a real date');
  if (utc(on) < utc(birth)) throw new RangeError('The date of birth is after the “age on” date');
  let months = (on.year - birth.year) * 12 + (on.month - birth.month);
  let anchor = anniversary(birth, months);
  if (utc(anchor) > utc(on)) {
    months -= 1;
    anchor = anniversary(birth, months);
  }
  const totalDays = Math.round((utc(on) - utc(birth)) / DAY);
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: Math.round((utc(on) - utc(anchor)) / DAY),
    totalMonths: months,
    totalWeeks: Math.floor(totalDays / 7),
    totalDays,
    weekdayBorn: new Date(utc(birth)).getUTCDay(),
  };
}

/** The next birthday on or after `on` (today counts), with how many days away it is. */
export function nextBirthday(birth, on) {
  let years = on.year - birth.year;
  let date = anniversary(birth, years * 12);
  if (utc(date) < utc(on)) {
    years += 1;
    date = anniversary(birth, years * 12);
  }
  const daysUntil = Math.round((utc(date) - utc(on)) / DAY);
  return { ...date, daysUntil, isToday: daysUntil === 0, turning: years, weekday: new Date(utc(date)).getUTCDay() };
}
