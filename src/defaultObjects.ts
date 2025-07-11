import { BUILT_IN_QUERIES, Queryable } from "./logic/query";
import { AppState, LATEST_DATABASE_VERSION, Settings } from "./types";
import { dateToDay } from "./utils/dates";

export const appState: AppState = {
  kind: "AppState",
  currentTab: "JOURNAL",
  currentGraph: "DAILY_BAR",
  journalEntries: [],
  day: dateToDay(new Date()),
  databaseVersion: LATEST_DATABASE_VERSION,
};

export const DEFAULT_QUERIES: readonly Queryable[] = [...BUILT_IN_QUERIES];
export const settings: Settings = {
  kind: "Settings",
  currentPills: [],
  queries: [...DEFAULT_QUERIES],
  databaseVersion: LATEST_DATABASE_VERSION,
};
