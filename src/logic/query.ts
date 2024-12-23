import { JournalEntry, MoodValue, Prompt } from "../types";
import { dayToString } from "../utils/dates";

export const MoreThan = { kind: "MoreThan" } as const;
export type MoreThan = typeof MoreThan;

export const LessThan = { kind: "LessThan" } as const;
export type LessThan = typeof LessThan;

export const EqualTo = { kind: "EqualTo" } as const;
export type EqualTo = typeof EqualTo;

/**
 * Representation of logical mathematical operations which are supported by the query builder
 */
export type Comparison = EqualTo | LessThan | MoreThan;

export const COMPARISONS: Comparison[] = [MoreThan, LessThan, EqualTo];

/**
 * A filter for a particular prompt compared against a particular value
 */
export type Filter = {
  kind: "Filter";
  comparison: Comparison;
  value: MoodValue;
  prompt: Prompt;
};
export function Filter(
  comparison: Comparison,
  value: MoodValue,
  prompt: Prompt
): Filter {
  return {
    kind: "Filter",
    comparison,
    value,
    prompt,
  };
}

export type And = { kind: "And"; left: Query; right: Query };
export function And(left: Query, right: Query): And {
  return {
    kind: "And",
    left,
    right,
  };
}

export type Or = { kind: "Or"; left: Query; right: Query };
export function Or(left: Query, right: Query): Or {
  return {
    kind: "Or",
    left,
    right,
  };
}

export type Not = { kind: "Not"; query: Query };
export function Not(query: Query): Not {
  return {
    kind: "Not",
    query,
  };
}

/**
 * Queries can either be a simple filter, or an infinitely nested tree of combinations.
 *
 * For example:
 * - And(Filter, Filter)
 * - Or(Filter, Not(Filter))
 * - Filter
 * - And(Or(Filter, Filter), Filter)
 *
 * All of these are valid plus more.
 */
export type Query = And | Or | Not | Filter;

/**
 * Run a query against the journal entries
 */
export function runQuery(
  query: Query,
  entries: JournalEntry[]
): JournalEntry[] {
  switch (query.kind) {
    case "And": {
      const left = runQuery(query.left, entries);
      const right = runQuery(query.right, entries);

      const merged: JournalEntry[] = [];
      const seenDays = left.map((entry) => dayToString(entry.day));

      for (const entry of right) {
        if (!seenDays.includes(dayToString(entry.day))) {
          continue;
        }
        // technically we should add this entry's day to seenDays
        // but it's not actually needed, so skip it for perf
        merged.push(entry);
      }

      return merged;
    }
    case "Or": {
      const left = runQuery(query.left, entries);
      const right = runQuery(query.right, entries);

      const merged: JournalEntry[] = left;
      const seenDays = left.map((entry) => dayToString(entry.day));

      for (const entry of right) {
        if (seenDays.includes(dayToString(entry.day))) {
          continue;
        }
        // technically we should add this entry's day to seenDays
        // but it's not actually needed, so skip it for perf
        merged.push(entry);
      }

      return merged;
    }
    case "Not": {
      const result = runQuery(query.query, entries);
      const resultDays = result.map((entry) => dayToString(entry.day));

      return entries.filter((entry) => {
        !resultDays.includes(dayToString(entry.day));
      });
    }
    case "Filter": {
      return entries.filter((entry) => {
        const response = entry.promptResponses[query.prompt];

        switch (query.comparison.kind) {
          case "EqualTo": {
            return response === query.value;
          }
          case "LessThan": {
            return response < query.value;
          }
          case "MoreThan": {
            return response > query.value;
          }
        }
      });
    }
  }
}