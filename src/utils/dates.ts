import { Day, JournalEntry } from "../types";

/**
 * Convert a date to a string in the day format of YYYY-MM-DD
 */
export function dateToDayString(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (
    date.getFullYear() +
    "-" +
    (month < 10 ? "0" + month : month) +
    "-" +
    (day < 10 ? "0" + day : day)
  );
}

/**
 * Compare two journal entries by date
 */
export function sortEntriesByDate(a: JournalEntry, b: JournalEntry): number {
  const firstDay = dayToDate(a.day);
  const secondDay = dayToDate(b.day);
  return firstDay > secondDay ? 1 : firstDay < secondDay ? -1 : 0;
}

/**
 * Check if two day objects represent the same day
 */
export function isSameDay(first: Day, second: Day): boolean {
  return (
    first.year === second.year &&
    first.month === second.month &&
    first.day === second.day
  );
}

export function dayToDate(day: Day): Date {
  return new Date(day.year, day.month - 1, day.day, 0, 0, 0, 0);
}

export function dateToDay(date: Date): Day {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function padDateNumber(number: number): string {
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

export function dayToString(day: Day): string {
  return `${day.year}-${padDateNumber(day.month)}-${padDateNumber(day.day)}`;
}

export function stringToDay(string: string): Day | null {
  const pieces = string.split("-");

  if (pieces.length === 3) {
    const year = parseInt(pieces[0], 10);
    const month = parseInt(pieces[1], 10);
    const day = parseInt(pieces[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    return {
      year,
      month,
      day,
    };
  }

  return null;
}

/**
 * Returns the number of days between two days, with direction
 * (i.e 27/12/2024 to 26/12/2024 is -1, but 26/12/2024 is 1)
 */
export function numberOfDaysBetween(firstDay: Day, secondDay: Day): number {
  const firstDate = dayToDate(firstDay);
  const secondDate = dayToDate(secondDay);

  const diffInMs = firstDate.getTime() - secondDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  return diffInDays;
}

export function previousDay(today: Day): Day {
  const date = dayToDate(today);
  date.setDate(date.getDate() - 1);
  return dateToDay(date);
}

export function nextDay(today: Day): Day {
  const date = dayToDate(today);
  date.setDate(date.getDate() + 1);
  return dateToDay(date);
}
