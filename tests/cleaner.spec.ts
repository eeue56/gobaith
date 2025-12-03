import { expect, test } from "@playwright/test";
import { cleanData } from "../src/cleaners";
import { BUILT_IN_QUERIES } from "../src/logic/query";
import { LATEST_DATABASE_VERSION } from "../src/types";
import { dateToDay } from "../src/utils/dates";

test("version 0, 1, 2 AppState gets successfully converted to the current version", () => {
  const exampleData = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "tab",
    currentGraph: "graph",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Today's feelings of depression": 1,
          "Today's feelings of anxiety": 2,
          "Today's feelings of elevatation": 2,
          "Today's feelings of irritableness": 3,
          "Today's psychotic symptoms": 1,
        },
        hoursSlept: 10,
        logs: [],
      },
    ],
  };
  const cleanedData = cleanData(exampleData);

  // the elevatation field should be renamed elevation
  expect(
    (cleanedData as any)["journalEntries"][0]["promptResponses"][
      "Today's feelings of elevation"
    ]
  ).toEqual(2);

  expect(
    (cleanedData as any)["journalEntries"][0]["promptResponses"][
      "Today's feelings of elevatation"
    ]
  ).toEqual(undefined);

  // hoursSlept should be converted to Sleep quality in promptResponses
  expect((cleanedData as any)["journalEntries"][0]["promptResponses"]).toHaveProperty("Sleep quality");
  expect((cleanedData as any)["journalEntries"][0]).not.toHaveProperty("hoursSlept");
  expect((cleanedData as any)["journalEntries"][0]).not.toHaveProperty("sleepQuality");

  // databaseVersion should be added
  expect(cleanedData).toHaveProperty(
    "databaseVersion",
    LATEST_DATABASE_VERSION
  );
});

test("version 6 AppState is untouched", () => {
  const exampleData = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "tab",
    currentGraph: "graph",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Sleep quality": 3,
          "Today's feelings of depression": 1,
          "Today's feelings of anxiety": 2,
          "Today's feelings of elevation": 2,
          "Today's feelings of irritableness": 3,
          "Today's psychotic symptoms": 1,
        },
        logs: [],
      },
    ],
    databaseVersion: 6,
  };
  const cleanedData = cleanData(exampleData);

  expect(cleanedData).toEqual(exampleData);
});

test("version 0, 1, 2 Settings gets successfully converted to the current version", () => {
  const exampleData = {
    kind: "Settings",
    currentPills: [],
  };
  const cleanedData = cleanData(exampleData);

  expect(cleanedData).toHaveProperty("queries");

  // databaseVersion should be added
  expect(cleanedData).toHaveProperty(
    "databaseVersion",
    LATEST_DATABASE_VERSION
  );
});

test("version 5 Settings is untouched", () => {
  const exampleData = {
    kind: "Settings",
    currentPills: [],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 4,
  };
  const cleanedData = cleanData(exampleData);

  expect(cleanedData).toEqual(exampleData);
});

// ============= Upgrade Path Tests =============

// AppState upgrade paths
test("upgrade path: AppState v4 -> v8 (adds customPromptResponses)", () => {
  const v4Data = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Sleep quality": 3,
          "Today's feelings of depression": 1,
        },
        logs: [],
      },
    ],
    databaseVersion: 4,
  };
  const cleanedData = cleanData(v4Data);

  // Should be updated to version 8
  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  // Should have customPromptResponses added to journal entries
  expect((cleanedData as any).journalEntries[0]).toHaveProperty("customPromptResponses");
  expect((cleanedData as any).journalEntries[0].customPromptResponses).toEqual({});
});

test("upgrade path: AppState v5 -> v8 (sleep quality migration runs)", () => {
  const v5Data = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Sleep quality": 2, // Will be overwritten by migration (default is 3 when no hoursSlept)
          "Today's feelings of depression": 1,
        },
        logs: [],
      },
    ],
    databaseVersion: 5,
  };
  const cleanedData = cleanData(v5Data);

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  // Migration sets default value of 3 when there's no hoursSlept field
  expect((cleanedData as any).journalEntries[0].promptResponses["Sleep quality"]).toEqual(3);
  expect((cleanedData as any).journalEntries[0]).toHaveProperty("customPromptResponses");
});

test("upgrade path: AppState v6 -> v8 (v7 and v8 migrations)", () => {
  const v6Data = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Sleep quality": 3,
          "Today's feelings of depression": 1,
        },
        logs: [],
      },
    ],
    databaseVersion: 6,
  };
  const cleanedData = cleanData(v6Data);

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  expect((cleanedData as any).journalEntries[0]).toHaveProperty("customPromptResponses");
});

test("upgrade path: AppState v7 -> v8 (only v8 migration)", () => {
  const v7Data = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Sleep quality": 3,
          "Today's feelings of depression": 1,
        },
        logs: [],
      },
    ],
    databaseVersion: 7,
  };
  const cleanedData = cleanData(v7Data);

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  expect((cleanedData as any).journalEntries[0]).toHaveProperty("customPromptResponses");
});

test("upgrade path: AppState with hoursSlept (pre-v6) -> v8 converts sleep data", () => {
  const preV6Data = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Today's feelings of depression": 1,
        },
        hoursSlept: 4, // Less than 5 hours
        logs: [],
      },
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {},
        hoursSlept: 6, // 5-7 hours
        logs: [],
      },
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {},
        hoursSlept: 8, // 7-9 hours
        logs: [],
      },
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {},
        hoursSlept: 10, // More than 9 hours
        logs: [],
      },
    ],
    databaseVersion: 4,
  };
  const cleanedData = cleanData(preV6Data) as any;

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  // hoursSlept should be removed
  expect(cleanedData.journalEntries[0]).not.toHaveProperty("hoursSlept");
  // Sleep quality should be mapped based on hours
  expect(cleanedData.journalEntries[0].promptResponses["Sleep quality"]).toEqual(1); // < 5 hours
  expect(cleanedData.journalEntries[1].promptResponses["Sleep quality"]).toEqual(2); // 5-7 hours
  expect(cleanedData.journalEntries[2].promptResponses["Sleep quality"]).toEqual(3); // 7-9 hours
  expect(cleanedData.journalEntries[3].promptResponses["Sleep quality"]).toEqual(4); // > 9 hours
});

// Settings upgrade paths
test("upgrade path: Settings v4 -> v8 (queries, pills, prompts)", () => {
  const v4Data = {
    kind: "Settings",
    currentPills: ["Aspirin 100mg", "Vitamin D"],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 4,
  };
  const cleanedData = cleanData(v4Data) as any;

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  // Pills should be converted to Pill objects
  expect(cleanedData.currentPills[0]).toHaveProperty("kind", "Pill");
  expect(cleanedData.currentPills[0]).toHaveProperty("name", "Aspirin");
  expect(cleanedData.currentPills[0]).toHaveProperty("dosage", "100mg");
  expect(cleanedData.currentPills[1]).toHaveProperty("kind", "Pill");
  expect(cleanedData.currentPills[1]).toHaveProperty("name", "Vitamin D");
  // v8 fields should be added
  expect(cleanedData).toHaveProperty("enabledPrompts");
  expect(cleanedData).toHaveProperty("hasCompletedSetup", true);
  expect(cleanedData).toHaveProperty("customPrompts");
  expect(cleanedData.customPrompts).toEqual([]);
});

test("upgrade path: Settings v5 -> v8 (skips query migration)", () => {
  const v5Data = {
    kind: "Settings",
    currentPills: ["Ibuprofen 200mg"],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 5,
  };
  const cleanedData = cleanData(v5Data) as any;

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  expect(cleanedData.currentPills[0]).toHaveProperty("kind", "Pill");
  expect(cleanedData).toHaveProperty("enabledPrompts");
  expect(cleanedData).toHaveProperty("hasCompletedSetup", true);
});

test("upgrade path: Settings v6 -> v8 (v7 and v8 migrations)", () => {
  const v6Data = {
    kind: "Settings",
    currentPills: ["Paracetamol 500mg"],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 6,
  };
  const cleanedData = cleanData(v6Data) as any;

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  expect(cleanedData.currentPills[0]).toHaveProperty("kind", "Pill");
  expect(cleanedData.currentPills[0].name).toEqual("Paracetamol");
  expect(cleanedData.currentPills[0].dosage).toEqual("500mg");
  expect(cleanedData).toHaveProperty("enabledPrompts");
});

test("upgrade path: Settings v7 -> v8 (only v8 migration)", () => {
  const v7Data = {
    kind: "Settings",
    currentPills: [{ kind: "Pill", name: "Aspirin", dosage: "100mg" }],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 7,
  };
  const cleanedData = cleanData(v7Data) as any;

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  // Pills should remain as objects
  expect(cleanedData.currentPills[0]).toHaveProperty("kind", "Pill");
  // v8 fields should be added
  expect(cleanedData).toHaveProperty("enabledPrompts");
  expect(cleanedData).toHaveProperty("hasCompletedSetup", true);
  expect(cleanedData).toHaveProperty("customPrompts");
});

test("upgrade path: Settings without queries (pre-v5) -> v8", () => {
  const preV5Data = {
    kind: "Settings",
    currentPills: ["Medication A"],
  };
  const cleanedData = cleanData(preV5Data) as any;

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  expect(cleanedData).toHaveProperty("queries");
  expect(cleanedData.currentPills[0]).toHaveProperty("kind", "Pill");
  expect(cleanedData).toHaveProperty("enabledPrompts");
});

// Edge cases
test("upgrade path: AppState v8 is unchanged", () => {
  const v8Data = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Sleep quality": 3,
        },
        customPromptResponses: { "My custom prompt": 2 },
        logs: [],
      },
    ],
    databaseVersion: 8,
  };
  const cleanedData = cleanData(v8Data);

  // Should remain unchanged
  expect(cleanedData).toEqual(v8Data);
});

test("upgrade path: Settings v8 is unchanged", () => {
  const v8Data = {
    kind: "Settings",
    currentPills: [{ kind: "Pill", name: "Test", dosage: "10mg" }],
    queries: [...BUILT_IN_QUERIES],
    enabledPrompts: new Set(["Sleep quality"]),
    hasCompletedSetup: true,
    customPrompts: ["My custom prompt"],
    databaseVersion: 8,
  };
  const cleanedData = cleanData(v8Data);

  expect(cleanedData).toEqual(v8Data);
});

test("upgrade path: future version (v9+) is not downgraded", () => {
  const futureData = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [],
    databaseVersion: 99,
  };
  const cleanedData = cleanData(futureData) as any;

  // Should not be modified
  expect(cleanedData.databaseVersion).toEqual(99);
});

test("upgrade path: AppState with typo fix (elevatation -> elevation) from v0", () => {
  const v0Data = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Today's feelings of elevatation": 3, // Typo
          "Today's feelings of depression": 1,
        },
        hoursSlept: 7,
        logs: [],
      },
    ],
  };
  const cleanedData = cleanData(v0Data) as any;

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  // Typo should be fixed
  expect(cleanedData.journalEntries[0].promptResponses["Today's feelings of elevation"]).toEqual(3);
  expect(cleanedData.journalEntries[0].promptResponses["Today's feelings of elevatation"]).toBeUndefined();
});

test("upgrade path: multiple journal entries preserved through migration", () => {
  const multiEntryData = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: { year: 2023, month: 1, day: 1 },
        pills: { "Aspirin": 1 },
        promptResponses: { "Today's feelings of depression": 1 },
        hoursSlept: 8,
        logs: [{ time: new Date().toISOString(), text: "Entry 1" }],
      },
      {
        day: { year: 2023, month: 1, day: 2 },
        pills: { "Aspirin": 2 },
        promptResponses: { "Today's feelings of depression": 2 },
        hoursSlept: 6,
        logs: [{ time: new Date().toISOString(), text: "Entry 2" }],
      },
      {
        day: { year: 2023, month: 1, day: 3 },
        pills: {},
        promptResponses: { "Today's feelings of depression": 3 },
        hoursSlept: 9,
        logs: [],
      },
    ],
    databaseVersion: 4,
  };
  const cleanedData = cleanData(multiEntryData) as any;

  expect(cleanedData).toHaveProperty("databaseVersion", LATEST_DATABASE_VERSION);
  expect(cleanedData.journalEntries).toHaveLength(3);
  // All entries should have customPromptResponses
  for (const entry of cleanedData.journalEntries) {
    expect(entry).toHaveProperty("customPromptResponses");
  }
  // Original data should be preserved
  expect(cleanedData.journalEntries[0].pills["Aspirin"]).toEqual(1);
  expect(cleanedData.journalEntries[1].logs[0].text).toEqual("Entry 2");
});
