import { depression, elevation, JournalEntry, psychosis } from "../types";
import { sortEntriesByDate } from "./dates";

export function averageOfPeriod(
  period: JournalEntry[],
  evaluator: (entry: JournalEntry) => number
): number {
  const summed = period.map((day) => evaluator(day)).reduce((x, y) => x + y, 0);
  return summed / period.length;
}

export function findPeriods(
  evaluator: (entry: JournalEntry) => number,
  entries: JournalEntry[]
): JournalEntry[][] {
  const periods: JournalEntry[][] = [];
  let currentPeriod: JournalEntry[] = [];

  entries.sort(sortEntriesByDate);

  for (const entry of entries) {
    if (evaluator(entry) > 1) {
      currentPeriod.push(entry);
    } else if (currentPeriod.length > 0) {
      periods.push(currentPeriod);
      currentPeriod = [];
    }
  }

  if (currentPeriod.length > 0) {
    periods.push(currentPeriod);
  }

  const onlyPeriodsWithAnAverageOf2OrHigher = periods.filter((period) => {
    return averageOfPeriod(period, evaluator) >= 2;
  });

  return onlyPeriodsWithAnAverageOf2OrHigher;
}

export function getElevatedPeriods(
  journalEntries: JournalEntry[]
): JournalEntry[][] {
  return findPeriods(elevation, journalEntries);
}

export function getDepressedPeriods(
  journalEntries: JournalEntry[]
): JournalEntry[][] {
  return findPeriods(depression, journalEntries);
}

export function getPsychoticPeriods(
  journalEntries: JournalEntry[]
): JournalEntry[][] {
  return findPeriods(psychosis, journalEntries);
}

export function sumPeriod(periods: JournalEntry[][]): number {
  let total = 0;

  for (const period of periods) {
    total += period.length;
  }

  return total;
}
