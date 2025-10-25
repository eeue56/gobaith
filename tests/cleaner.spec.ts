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

  // hoursSlept should be converted to sleepQuality
  expect((cleanedData as any)["journalEntries"][0]).toHaveProperty("sleepQuality");
  expect((cleanedData as any)["journalEntries"][0]).not.toHaveProperty("hoursSlept");

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
          "Today's feelings of depression": 1,
          "Today's feelings of anxiety": 2,
          "Today's feelings of elevation": 2,
          "Today's feelings of irritableness": 3,
          "Today's psychotic symptoms": 1,
        },
        sleepQuality: 3,
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
