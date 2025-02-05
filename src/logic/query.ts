import { Day, JournalEntry, MoodValue, Prompt } from "../types";
import {
  dayToString,
  numberOfDaysBetween,
  sortEntriesByDate,
} from "../utils/dates";
import { staticHash } from "../utils/render";

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

export function isComparison(str: { kind: string }): str is Comparison {
  return COMPARISONS.map((c) => c.kind).includes(str.kind as any);
}

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

export type Duration = {
  kind: "Duration";
  comparison: Comparison;
  days: number;
  query: Query;
};
export function Duration(
  query: Query,
  days: number,
  comparison: Comparison
): Duration {
  return {
    kind: "Duration",
    query,
    days,
    comparison,
  };
}

function continiousPeriods(entries: JournalEntry[]): JournalEntry[][] {
  if (entries.length === 0) {
    return [];
  }
  entries.sort(sortEntriesByDate);
  const periods: JournalEntry[][] = [];
  let currentPeriod = [entries[0]];
  let previousDay: Day = entries[0].day;

  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    if (numberOfDaysBetween(previousDay, entry.day) < 2) {
      currentPeriod.push(entry);
    } else {
      periods.push(currentPeriod);
      currentPeriod = [];
    }
    previousDay = entry.day;
  }

  if (currentPeriod.length > 0) {
    periods.push(currentPeriod);
  }

  return periods;
}

export type CombineQuery = And | Or | Not;

export type CombineQueryKind = CombineQuery["kind"];

export const COMBINE_QUERIES: CombineQueryKind[] = ["And", "Or", "Not"];

export type QueryPath = "Left" | "Right" | "DirectChild";

export function isCombineQueryKind(kind: string): kind is CombineQueryKind {
  return COMBINE_QUERIES.includes(kind as CombineQueryKind);
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

export type Queryable = Query | Duration;

export type QueryUpdate =
  | { kind: "Prompt"; prompt: Prompt }
  | { kind: "MoodValue"; moodValue: MoodValue }
  | { kind: "Comparison"; comparison: Comparison }
  | { kind: "Duration"; duration: number }
  | { kind: "CombineQuery"; combineQueryKind: CombineQueryKind };

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

/**
 * Run a query against the journal entries to get durations matching the query
 */
export function runDurationQuery(
  query: Duration,
  entries: JournalEntry[]
): JournalEntry[][] {
  switch (query.kind) {
    case "Duration": {
      const results = runQuery(query.query, entries);
      const periods = continiousPeriods(results);

      switch (query.comparison.kind) {
        case "EqualTo": {
          return periods.filter((period) => period.length === query.days);
        }
        case "LessThan": {
          return periods.filter((period) => period.length < query.days);
        }
        case "MoreThan": {
          return periods.filter((period) => period.length > query.days);
        }
      }
    }
  }
}

export const depressedDaysWithoutElevationQuery = And(
  Filter(MoreThan, 1, "Today's feelings of depression"),
  Filter(EqualTo, 1, "Today's feelings of elevation")
);
export const possiblyHarmfulManicDays = And(
  Filter(MoreThan, 2, "Today's feelings of elevation"),
  Or(
    Filter(MoreThan, 1, "Today's feelings of irritableness"),
    Filter(MoreThan, 1, "Today's psychotic symptoms")
  )
);

export const hypomania = Duration(
  And(
    Or(
      Filter(MoreThan, 1, "Today's feelings of elevation"),
      Filter(MoreThan, 1, "Today's feelings of irritableness")
    ),
    Filter(EqualTo, 1, "Today's psychotic symptoms")
  ),
  3,
  MoreThan
);

export const mania = Duration(
  Or(
    Filter(MoreThan, 2, "Today's feelings of elevation"),
    Filter(MoreThan, 2, "Today's feelings of irritableness")
  ),
  6,
  MoreThan
);

export const psychosis = Duration(
  Filter(MoreThan, 2, "Today's psychotic symptoms"),
  30,
  MoreThan
);

export const depression = Duration(
  Filter(MoreThan, 1, "Today's feelings of depression"),
  14,
  MoreThan
);

export const BUILT_IN_QUERIES: (Duration | Query)[] = [
  depressedDaysWithoutElevationQuery,
  possiblyHarmfulManicDays,
  hypomania,
  mania,
  psychosis,
  depression,
];

function hashAnd(query: And): string {
  return `${query.kind}-${hashQuery(query.left)}-${hashQuery(query.right)}`;
}

function hashOr(query: Or): string {
  return `${query.kind}-${hashQuery(query.left)}-${hashQuery(query.right)}`;
}

function hashNot(query: Not): string {
  return `${query.kind}-${hashQuery(query.query)}`;
}

function hashFilter(query: Filter): string {
  return `${query.kind}-${query.comparison.kind}-${query.value}-${staticHash(
    query.prompt
  )}`;
}

function hashDuration(duration: Duration): string {
  return `${duration.kind}-${duration.comparison.kind}-${
    duration.days
  }-${hashQuery(duration.query)}`;
}

export function hashQuery(query: Query | Duration): string {
  switch (query.kind) {
    case "And":
      return hashAnd(query);
    case "Or":
      return hashOr(query);
    case "Not":
      return hashNot(query);
    case "Filter":
      return hashFilter(query);
    case "Duration":
      return hashDuration(query);
  }
}

function keyToPath(key: string): { index: number; path: QueryPath[] } {
  const pieces = key.split("-");
  const index = parseInt(pieces[0]);
  const path: QueryPath[] = [];
  const pathPieces = pieces.slice(1, pieces.length);

  for (const piece of pathPieces) {
    switch (piece) {
      case "left": {
        path.push("Left");
        break;
      }
      case "right": {
        path.push("Right");
        break;
      }
      case "child": {
        path.push("DirectChild");
        break;
      }
      default: {
        console.error("Unexpected path direction", piece);
      }
    }
  }

  return { index, path };
}

export function pathToKey(index: number, path: QueryPath[]): string {
  const pathParts: string[] = [`index-${index}`];

  for (const part of path) {
    pathParts.push(part);
  }

  return pathParts.join("-");
}
