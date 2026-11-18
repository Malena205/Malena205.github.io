// Dates are handled as plain 'YYYY-MM-DD' strings in UTC so that nothing
// shifts with the visitor's timezone.
export const parseDay = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const toISO = (date: Date) => date.toISOString().slice(0, 10);

export function addDays(iso: string, days: number) {
  const date = parseDay(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toISO(date);
}

/** Monday = 0 … Sunday = 6 */
export const weekday = (iso: string) => (parseDay(iso).getUTCDay() + 6) % 7;

export const todayISO = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());

// Formatted by hand rather than with Intl so the statically built HTML and the
// browser always produce identical text.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Accepts 'YYYY-MM' or 'YYYY-MM-DD' */
export const formatMonth = (iso: string) => MONTHS[Number(iso.slice(5, 7)) - 1];
/** Accepts 'YYYY-MM' or 'YYYY-MM-DD' */
export const formatMonthYear = (iso: string) => `${formatMonth(iso)} ${iso.slice(0, 4)}`;
export const formatShortDay = (iso: string) => `${Number(iso.slice(8, 10))} ${formatMonthYear(iso)}`;
export const formatLongDay = (iso: string) => `${WEEKDAYS[weekday(iso)]} ${formatShortDay(iso)}`;

/** Every 'YYYY-MM' from first to last, inclusive. */
export function monthRange(first: string, last: string) {
  const months: string[] = [];
  let [year, month] = first.split('-').map(Number);
  const [lastYear, lastMonth] = last.split('-').map(Number);
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
