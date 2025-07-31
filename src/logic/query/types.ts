import { MoodValue, Prompt } from "../../types";

export type CombineQuery = And | Or | Not;

export type CombineQueryKind = CombineQuery["kind"];

export const COMBINE_QUERIES: CombineQueryKind[] = ["And", "Or", "Not"];

export type QueryPath = "Left" | "Right" | "DirectChild";

export function isCombineQueryKind(kind: string): kind is CombineQueryKind {
  return COMBINE_QUERIES.includes(kind as CombineQueryKind);
}

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
