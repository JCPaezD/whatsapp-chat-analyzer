export const WEEKDAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
];

export function parseTwoDigitYear(year: number): number {
  return year >= 70 ? 1900 + year : 2000 + year;
}

export function toMondayFirstWeekdayIndexFromJsDay(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function diffMinutes(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60);
}

export function diffDaysInclusive(start: Date, end: Date): number {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function formatDateTime(date: Date): string {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function formatHourLabel(hour: number): string {
  return `${`${hour}`.padStart(2, "0")}:00`;
}
