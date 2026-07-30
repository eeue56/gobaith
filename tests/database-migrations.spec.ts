import { expect } from "@playwright/test";
import { BUILT_IN_QUERIES } from "../src/logic/query";
import {
  LATEST_DATABASE_VERSION,
  PROMPTS,
} from "../src/types";
import { dateToDay } from "../src/utils/dates";
import { test } from "./fixtures";
import { awaitForTitleToChange, changeTab, expectActiveTab } from "./helpers";

/**
 * Database migration tests via Playwright
 * These tests verify that data is properly migrated when imported through the browser,
 * simulating real user experiences with database upgrades.
 */

// Skip all tests in this file when running in electron mode
const shouldSkip = !!process.env.IS_ELECTRON;

// Helper to import data through the UI
async function importData(page: any, data: object) {
  await changeTab(page, "IMPORT");
  const stringData = JSON.stringify(data);
  await page.locator("#import-text").fill(stringData);
  await page.locator("#update-import-from-text").dispatchEvent("click");
}

// Helper to get the exported state from the UI
async function getExportedState(page: any): Promise<any> {
  await changeTab(page, "IMPORT");
  const exportedValue = await page.locator("#textarea-download-state").inputValue();
  return JSON.parse(exportedValue);
}

// Helper to get the exported settings from the UI
async function getExportedSettings(page: any): Promise<any> {
  await changeTab(page, "IMPORT");
  const exportedValue = await page.locator("#textarea-download-settings").inputValue();
  return JSON.parse(exportedValue);
}

// ============= AppState Migration Tests =============

(shouldSkip ? test.skip : test)("browser migration: v0 AppState with typo is migrated to v8", async ({ page }) => {
  // v0 data has the "elevatation" typo and no databaseVersion
  const v0AppState = {
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
          "Today's feelings of anxiety": 2,
          "Today's feelings of elevatation": 3, // Typo that should be fixed
          "Today's feelings of irritableness": 4,
          "Today's psychotic symptoms": 1,
        },
        hoursSlept: 8, // Should be converted to Sleep quality
        logs: [],
      },
    ],
  };

  await importData(page, v0AppState);
  const exportedState = await getExportedState(page);

  // Verify databaseVersion is set to latest
  expect(exportedState.databaseVersion).toBe(LATEST_DATABASE_VERSION);

  // Verify typo was fixed
  expect(exportedState.journalEntries[0].promptResponses["Today's feelings of elevation"]).toBe(3);
  expect(exportedState.journalEntries[0].promptResponses["Today's feelings of elevatation"]).toBeUndefined();

  // Verify hoursSlept was converted to Sleep quality (8 hours = quality 3)
  expect(exportedState.journalEntries[0].promptResponses["Sleep quality"]).toBe(3);
  expect(exportedState.journalEntries[0].hoursSlept).toBeUndefined();

  // Verify customPromptResponses was added
  expect(exportedState.journalEntries[0].customPromptResponses).toBeDefined();
});

(shouldSkip ? test.skip : test)("browser migration: v4 AppState migrates to v8", async ({ page }) => {
  const v4AppState = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: { "Aspirin": 1 },
        promptResponses: {
          "Today's feelings of depression": 2,
          "Today's feelings of anxiety": 1,
          "Today's feelings of elevation": 3,
          "Today's feelings of irritableness": 2,
          "Today's psychotic symptoms": 1,
        },
        hoursSlept: 6, // Should be converted to Sleep quality (6 hours = quality 2)
        logs: [{ time: new Date().toISOString(), text: "Test log entry" }],
      },
    ],
    databaseVersion: 4,
  };

  await importData(page, v4AppState);
  const exportedState = await getExportedState(page);

  // Verify databaseVersion is set to latest
  expect(exportedState.databaseVersion).toBe(LATEST_DATABASE_VERSION);

  // Verify hoursSlept was converted to Sleep quality (6 hours = quality 2)
  expect(exportedState.journalEntries[0].promptResponses["Sleep quality"]).toBe(2);
  expect(exportedState.journalEntries[0].hoursSlept).toBeUndefined();

  // Verify customPromptResponses was added
  expect(exportedState.journalEntries[0].customPromptResponses).toBeDefined();

  // Verify original data is preserved
  expect(exportedState.journalEntries[0].pills["Aspirin"]).toBe(1);
  expect(exportedState.journalEntries[0].logs[0].text).toBe("Test log entry");
});

(shouldSkip ? test.skip : test)("browser migration: v6 AppState migrates to v8", async ({ page }) => {
  const v6AppState = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Sleep quality": 4, // Already migrated
          "Today's feelings of depression": 1,
          "Today's feelings of anxiety": 2,
          "Today's feelings of elevation": 3,
          "Today's feelings of irritableness": 2,
          "Today's psychotic symptoms": 1,
        },
        logs: [],
      },
    ],
    databaseVersion: 6,
  };

  await importData(page, v6AppState);
  const exportedState = await getExportedState(page);

  // Verify databaseVersion is set to latest
  expect(exportedState.databaseVersion).toBe(LATEST_DATABASE_VERSION);

  // Verify Sleep quality preserved
  expect(exportedState.journalEntries[0].promptResponses["Sleep quality"]).toBe(4);

  // Verify customPromptResponses was added
  expect(exportedState.journalEntries[0].customPromptResponses).toBeDefined();
});

(shouldSkip ? test.skip : test)("browser migration: v7 AppState migrates to v8", async ({ page }) => {
  const v7AppState = {
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

  await importData(page, v7AppState);
  const exportedState = await getExportedState(page);

  // Verify databaseVersion is set to latest
  expect(exportedState.databaseVersion).toBe(LATEST_DATABASE_VERSION);

  // Verify customPromptResponses was added
  expect(exportedState.journalEntries[0].customPromptResponses).toBeDefined();
});

(shouldSkip ? test.skip : test)("browser migration: v8 AppState is unchanged", async ({ page }) => {
  const v8AppState = {
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
        customPromptResponses: { "My custom prompt": 2 },
        logs: [],
      },
    ],
    databaseVersion: 8,
  };

  await importData(page, v8AppState);
  const exportedState = await getExportedState(page);

  // Verify databaseVersion unchanged
  expect(exportedState.databaseVersion).toBe(8);

  // Verify customPromptResponses preserved
  expect(exportedState.journalEntries[0].customPromptResponses["My custom prompt"]).toBe(2);
});

(shouldSkip ? test.skip : test)("browser migration: hoursSlept conversion values are correct", async ({ page }) => {
  // Test all hour ranges for sleep quality conversion
  const testEntries = [
    { hoursSlept: 4, expectedQuality: 1 },  // < 5 hours
    { hoursSlept: 6, expectedQuality: 2 },  // 5-7 hours
    { hoursSlept: 8, expectedQuality: 3 },  // 7-9 hours
    { hoursSlept: 10, expectedQuality: 4 }, // > 9 hours
  ];

  const v4AppState = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: testEntries.map((entry, index) => ({
      day: { year: 2023, month: 1, day: index + 1 },
      pills: {},
      promptResponses: {
        "Today's feelings of depression": 1,
      },
      hoursSlept: entry.hoursSlept,
      logs: [],
    })),
    databaseVersion: 4,
  };

  await importData(page, v4AppState);
  const exportedState = await getExportedState(page);

  // Verify each entry has the correct Sleep quality
  for (let i = 0; i < testEntries.length; i++) {
    expect(exportedState.journalEntries[i].promptResponses["Sleep quality"]).toBe(
      testEntries[i].expectedQuality
    );
    expect(exportedState.journalEntries[i].hoursSlept).toBeUndefined();
  }
});

// ============= Settings Migration Tests =============

(shouldSkip ? test.skip : test)("browser migration: v0 Settings imports and adds v8 fields", async ({ page }) => {
  // v0 Settings has no databaseVersion, no queries, string pills
  // Note: The browser import doesn't convert string pills to Pill objects for Settings
  // because cleanData is only called for AppState imports, not Settings imports.
  // This test documents the actual browser behavior.
  const v0Settings = {
    kind: "Settings",
    currentPills: ["Aspirin 100mg", "Vitamin D"],
  };

  await importData(page, v0Settings);
  const exportedSettings = await getExportedSettings(page);

  // Verify databaseVersion is set to latest
  expect(exportedSettings.databaseVersion).toBe(LATEST_DATABASE_VERSION);

  // Verify queries were added
  expect(exportedSettings.queries).toBeDefined();
  expect(Array.isArray(exportedSettings.queries)).toBe(true);

  // Note: In browser Settings import, string pills are NOT converted to Pill objects
  // because the Settings import path doesn't call cleanData
  // The pills remain as strings
  expect(typeof exportedSettings.currentPills[0]).toBe("string");
  expect(exportedSettings.currentPills[0]).toBe("Aspirin 100mg");

  // Verify v8 fields were added
  expect(exportedSettings.hasCompletedSetup).toBe(true);
  expect(exportedSettings.customPrompts).toEqual([]);
});

(shouldSkip ? test.skip : test)("browser migration: v4 Settings imports and adds v8 fields", async ({ page }) => {
  // Note: Settings import doesn't call cleanData, so string pills aren't converted
  const v4Settings = {
    kind: "Settings",
    currentPills: ["Ibuprofen 200mg"],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 4,
  };

  await importData(page, v4Settings);
  const exportedSettings = await getExportedSettings(page);

  // Verify databaseVersion is set to latest
  expect(exportedSettings.databaseVersion).toBe(LATEST_DATABASE_VERSION);

  // String pills remain as strings in Settings import
  expect(typeof exportedSettings.currentPills[0]).toBe("string");
  expect(exportedSettings.currentPills[0]).toBe("Ibuprofen 200mg");

  // Verify v8 fields were added
  expect(exportedSettings.hasCompletedSetup).toBe(true);
});

(shouldSkip ? test.skip : test)("browser migration: v7 Settings with Pill objects imports correctly", async ({ page }) => {
  // v7 already has Pill objects, so they should be preserved
  const v7Settings = {
    kind: "Settings",
    currentPills: [{ kind: "Pill", name: "Paracetamol", dosage: "500mg" }],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 7,
  };

  await importData(page, v7Settings);
  const exportedSettings = await getExportedSettings(page);

  // Verify databaseVersion is set to latest
  expect(exportedSettings.databaseVersion).toBe(LATEST_DATABASE_VERSION);

  // Verify pills preserved as objects
  expect(exportedSettings.currentPills[0].kind).toBe("Pill");
  expect(exportedSettings.currentPills[0].name).toBe("Paracetamol");
  expect(exportedSettings.currentPills[0].dosage).toBe("500mg");

  // Verify v8 fields were added
  expect(exportedSettings.hasCompletedSetup).toBe(true);
  expect(exportedSettings.customPrompts).toEqual([]);
});

(shouldSkip ? test.skip : test)("browser migration: v8 Settings imports pills only", async ({ page }) => {
  // Note: The Settings import only imports pills, not other fields like customPrompts
  // This test documents the actual browser behavior
  const v8Settings = {
    kind: "Settings",
    currentPills: [{ kind: "Pill", name: "Test", dosage: "10mg" }],
    queries: [...BUILT_IN_QUERIES],
    enabledPrompts: Array.from(PROMPTS),
    hasCompletedSetup: true,
    customPrompts: ["My custom prompt"], // This will NOT be imported
    databaseVersion: 8,
  };

  await importData(page, v8Settings);
  const exportedSettings = await getExportedSettings(page);

  // Verify databaseVersion is set (from the existing model, not imported)
  expect(exportedSettings.databaseVersion).toBe(8);

  // Verify pill was imported
  expect(exportedSettings.currentPills[0].kind).toBe("Pill");
  expect(exportedSettings.currentPills[0].name).toBe("Test");
  expect(exportedSettings.currentPills[0].dosage).toBe("10mg");

  // Note: customPrompts is NOT imported by the Settings import - only pills are imported
  // The exported customPrompts will be empty (from the existing model)
  expect(exportedSettings.customPrompts).toEqual([]);
});

// ============= Data Persistence Tests =============

(shouldSkip ? test.skip : test)("browser migration: migrated AppState persists after reload", async ({ page }) => {
  const v4AppState = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Today's feelings of depression": 2,
        },
        hoursSlept: 7,
        logs: [{ time: new Date().toISOString(), text: "Persistence test" }],
      },
    ],
    databaseVersion: 4,
  };

  await importData(page, v4AppState);
  
  // Reload the page
  await page.reload();
  await awaitForTitleToChange(page);

  const exportedState = await getExportedState(page);

  // Verify migration persisted
  expect(exportedState.databaseVersion).toBe(LATEST_DATABASE_VERSION);
  expect(exportedState.journalEntries[0].promptResponses["Sleep quality"]).toBeDefined();
  expect(exportedState.journalEntries[0].customPromptResponses).toBeDefined();
  expect(exportedState.journalEntries[0].logs[0].text).toBe("Persistence test");
});

(shouldSkip ? test.skip : test)("browser migration: migrated Settings persists after reload", async ({ page }) => {
  // Use Pill objects for v7+ since that's what the app expects
  const v7Settings = {
    kind: "Settings",
    currentPills: [{ kind: "Pill", name: "Migrated Pill", dosage: "100mg" }],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 7,
  };

  await importData(page, v7Settings);
  
  // Reload the page
  await page.reload();
  await awaitForTitleToChange(page);

  const exportedSettings = await getExportedSettings(page);

  // Verify migration persisted
  expect(exportedSettings.databaseVersion).toBe(LATEST_DATABASE_VERSION);
  expect(exportedSettings.currentPills[0].kind).toBe("Pill");
  expect(exportedSettings.currentPills[0].name).toBe("Migrated Pill");
  expect(exportedSettings.hasCompletedSetup).toBe(true);
});

// ============= UI Behavior After Migration Tests =============

(shouldSkip ? test.skip : test)("browser migration: migrated data displays correctly in journal", async ({ page }) => {
  const v4AppState = {
    kind: "AppState",
    day: dateToDay(new Date()),
    currentTab: "JOURNAL",
    currentGraph: "DAILY_BAR",
    journalEntries: [
      {
        day: dateToDay(new Date()),
        pills: {},
        promptResponses: {
          "Today's feelings of depression": 3,
          "Today's feelings of anxiety": 2,
          "Today's feelings of elevation": 1,
          "Today's feelings of irritableness": 4,
          "Today's psychotic symptoms": 1,
        },
        hoursSlept: 8, // Should become Sleep quality 3
        logs: [],
      },
    ],
    databaseVersion: 4,
  };

  await importData(page, v4AppState);
  await changeTab(page, "JOURNAL");

  // Verify the Sleep quality prompt is displayed correctly
  const sleepPromptGroup = page.locator(".prompt-group").filter({
    has: page.locator('.prompt h4:text("Sleep quality")'),
  });
  await expect(sleepPromptGroup).toHaveCount(1);

  // Check that the active mood value is 3 (converted from 8 hours)
  const sleepMoodValue = await sleepPromptGroup
    .locator(".prompt-answer.active")
    .getAttribute("data-mood-value");
  expect(sleepMoodValue).toBe("3");

  // Verify depression prompt value
  const depressionPromptGroup = page.locator(".prompt-group").filter({
    has: page.locator('.prompt h4:text("Today\'s feelings of depression")'),
  });
  const depressionMoodValue = await depressionPromptGroup
    .locator(".prompt-answer.active")
    .getAttribute("data-mood-value");
  expect(depressionMoodValue).toBe("3");
});

(shouldSkip ? test.skip : test)("browser migration: migrated pills display in settings", async ({ page }) => {
  // Use Pill objects since that's what the app displays correctly
  const v7Settings = {
    kind: "Settings",
    currentPills: [
      { kind: "Pill", name: "TestMed", dosage: "50mg" },
      { kind: "Pill", name: "VitaminC", dosage: "500mg" }
    ],
    queries: [...BUILT_IN_QUERIES],
    databaseVersion: 7,
  };

  await importData(page, v7Settings);
  await changeTab(page, "SETTINGS");

  // Verify pills are displayed in the settings page
  const pillsContent = await page.locator(".settings-tab-content").textContent();
  expect(pillsContent).toContain("TestMed");
  expect(pillsContent).toContain("50mg");
  expect(pillsContent).toContain("VitaminC");
  expect(pillsContent).toContain("500mg");
});
