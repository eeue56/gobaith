import { expect, test } from "@playwright/test";
import { cleanData } from "../src/cleaners";
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

  // databaseVersion should be added
  expect(cleanedData).toHaveProperty("databaseVersion", 4);
});

test("version 4 AppState is untouched", () => {
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
        hoursSlept: 10,
        logs: [],
      },
    ],
    databaseVersion: 4,
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

  // databaseVersion should be added
  expect(cleanedData).toHaveProperty("databaseVersion", 4);
});

test("version 4 Settings is untouched", () => {
  const exampleData = {
    kind: "Settings",
    currentPills: [],
    databaseVersion: 4,
  };
  const cleanedData = cleanData(exampleData);

  expect(cleanedData).toEqual(exampleData);
});
