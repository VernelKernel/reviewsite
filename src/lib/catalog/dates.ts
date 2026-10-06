export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function initialAnchor(today: string, lagDays: number): string {
  return addDays(today, -lagDays);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function asUtcDate(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function ymd(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

export function parseSteamDate(value: string): string | null {
  const text = value.replace(/\s+/g, " ").trim();
  const dayFirst = text.match(/^(\d{1,2}) ([A-Za-z]+),? (\d{4})$/);
  if (dayFirst) {
    const month = MONTHS[dayFirst[2].toLowerCase()];
    if (!month) return null;
    return ymd(Number(dayFirst[3]), month, Number(dayFirst[1]));
  }
  const monthFirst = text.match(/^([A-Za-z]+) (\d{1,2}),? (\d{4})$/);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()];
    if (!month) return null;
    return ymd(Number(monthFirst[3]), month, Number(monthFirst[2]));
  }
  return null;
}
