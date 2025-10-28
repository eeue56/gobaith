import { HtmlNode } from "@eeue56/coed";
import {
  CombineQueryKind,
  Comparison,
  Queryable,
  QueryPath,
} from "./logic/query/types";

/**
 * Rename these as you want - the `MoodState` is a text representation of `MoodValue`
 */
export type MoodState = "None" | "Slight" | "Some" | "Intense";
export const MOOD_VALUES = [1, 2, 3, 4] as const;
export type MoodValue = (typeof MOOD_VALUES)[number];

export function isMoodValue(number: number): number is MoodValue {
  return MOOD_VALUES.includes(number as MoodValue);
}

export function moodStateFromValue(value: MoodValue): MoodState {
  switch (value) {
    case 1:
      return "None";
    case 2:
      return "Slight";
    case 3:
      return "Some";
    case 4:
      return "Intense";
  }
}

export function generateRandomMoodValue(): MoodValue {
  return MOOD_VALUES[Math.floor(Math.random() * MOOD_VALUES.length)];
}

export function generateRandomMoodValueInRange(
  lower: MoodValue,
  upper: MoodValue
): MoodValue {
  const index = Math.floor(Math.random() * (upper - lower + 1) + lower) - 1;
  const value = MOOD_VALUES[index];

  if (!isMoodValue(value)) {
    throw Error(`Value not in range[${lower}, ${upper}] - ${value}`);
  }

  return value;
}

/**
 * These are the prompts you'll want to answer each day.
 *
 * Add, change, or remove them as you desire.
 * The type system should warn you in all the places you need to change it.
 */
export const PROMPTS = [
  "Sleep quality",
  "Today's feelings of depression",
  "Today's feelings of anxiety",
  "Today's feelings of elevation",
  "Today's feelings of irritableness",
  "Today's psychotic symptoms",
] as const;

export type Prompt = (typeof PROMPTS)[number];

export function isPrompt(str: string): str is Prompt {
  return PROMPTS.includes(str as Prompt);
}

export type PromptResponses = {
  [prompt in Prompt]: MoodValue;
};

export function PromptResponses(
  sleepQuality: MoodValue,
  depression: MoodValue,
  anxiety: MoodValue,
  elevation: MoodValue,
  irritableness: MoodValue,
  psychotic: MoodValue
): PromptResponses {
  return {
    "Sleep quality": sleepQuality,
    "Today's feelings of depression": depression,
    "Today's feelings of anxiety": anxiety,
    "Today's feelings of elevation": elevation,
    "Today's feelings of irritableness": irritableness,
    "Today's psychotic symptoms": psychotic,
  };
}

export const SHORT_PROMPTS: Record<Prompt, string> = {
  "Sleep quality": "Sleep",
  "Today's feelings of depression": "Depression",
  "Today's feelings of anxiety": "Anxiety",
  "Today's feelings of elevation": "Elevation",
  "Today's feelings of irritableness": "Irrability",
  "Today's psychotic symptoms": "Psychotic",
};

export function depression(entry: JournalEntry): MoodValue {
  return entry.promptResponses["Today's feelings of depression"];
}

export function anxiety(entry: JournalEntry): MoodValue {
  return entry.promptResponses["Today's feelings of anxiety"];
}

export function elevation(entry: JournalEntry): MoodValue {
  return entry.promptResponses["Today's feelings of elevation"];
}

export function irritableness(entry: JournalEntry): MoodValue {
  return entry.promptResponses["Today's feelings of irritableness"];
}

export function psychosis(entry: JournalEntry): MoodValue {
  return entry.promptResponses["Today's psychotic symptoms"];
}

export const TAB_OPTIONS = ["JOURNAL", "IMPORT", "GRAPH", "SETTINGS"] as const;
export type TabName = (typeof TAB_OPTIONS)[number];

export type Day = {
  year: number;
  month: number;
  day: number;
};

export type DayState = {
  day: Day;
  moodValue: MoodValue;
};

/**
 * An indiviudal log entry - each day may have multiple of these.
 */
export type LogEntry = {
  time: Date;
  text: string;
};

export const DATABASE_VERSIONS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export type DatabaseVersion = (typeof DATABASE_VERSIONS)[number];

export function isDatabaseVersion(version: number): version is DatabaseVersion {
  return DATABASE_VERSIONS.includes(version as DatabaseVersion);
}

/**
 * This is the version of the db the app will be based on
 * any migrations needed in between the current db version
 * and the latest db version will be run
 */
export const LATEST_DATABASE_VERSION: DatabaseVersion = 7;

/**
 * AppState includes UI state and data (journal entries)
 */
export type AppState = {
  kind: "AppState";
  day: Day;
  currentTab: TabName;
  currentGraph: GraphName;
  journalEntries: JournalEntry[];
  databaseVersion: DatabaseVersion;
};

export type Result<value> =
  | { value: value; kind: "Ok" }
  | { message: string; kind: "Err" };

/**
 * State for UI elements which don't need to saved to local storage
 *
 * Structure of keys:
 * ${tabName}_${feature}_${field}
 */
export type LocalState = {
  kind: "LocalState";
  Graphs: { LineOverview: { nonFilteredPrompts: Set<Prompt> } };
  Importer: { status: Result<string> };
};

export function isAppState(object: unknown): object is AppState {
  if (typeof object === "undefined" || typeof object !== "object") {
    return false;
  }
  if ((object as any).kind) {
    if ((object as any).kind === "AppState") {
      return true;
    }
  }
  return false;
}

export type EventLogEntry = {
  eventKind: Update["kind"];
  timestamp: Date;
};

export type DebuggingInfo = {
  kind: "DebuggingInfo";
  eventLog: EventLogEntry[];
};

export type Pill = {
  name: string;
  dosage: string;
};

export function Pill(name: string, dosage: string): Pill {
  return { name, dosage };
}

/**
 * Type guard to check if an unknown value is a valid Pill object
 */
export function isPill(value: unknown): value is Pill {
  return (
    value !== null &&
    typeof value === "object" &&
    "name" in value &&
    "dosage" in value &&
    typeof (value as any).name === "string" &&
    typeof (value as any).dosage === "string"
  );
}

/**
 * Gets the full display name for a pill (name + dosage)
 */
export function pillDisplayName(pill: Pill): string {
  if (pill.dosage) {
    return `${pill.name} ${pill.dosage}`;
  }
  return pill.name;
}

/**
 * Creates a pill key for storing in the pills record
 */
export function pillKey(pill: Pill): string {
  return pillDisplayName(pill);
}

export type Settings = {
  kind: "Settings";
  currentPills: Pill[];
  queries: Queryable[];
  databaseVersion: DatabaseVersion;
};

export function isSettings(object: unknown): object is Settings {
  if (typeof object === "undefined" || typeof object !== "object") {
    return false;
  }
  if ((object as any).kind) {
    if ((object as any).kind === "Settings") {
      return true;
    }
  }
  return false;
}

export type Model = {
  settings: Settings;
  appState: AppState;
  localState: LocalState;
};

export type JournalEntry = {
  day: Day;
  pills: Record<string, number>;
  promptResponses: PromptResponses;
  logs: LogEntry[];
};

export function JournalEntry(
  day: Day,
  pills: Record<string, number>,
  promptResponses: PromptResponses,
  logs: LogEntry[]
): JournalEntry {
  return {
    day,
    pills,
    promptResponses,
    logs,
  };
}

export const GRAPH_NAMES = [
  "SPIDERWEB",
  "LINE_OVERVIEW",
  "DAILY_BAR",
  "BIPOLAR_PERIODS",
  "TOTALED_DAILY_BAR",
  "Interactive queries",
] as const;

export type GraphName = (typeof GRAPH_NAMES)[number];

/**
 * A graph renderer is something that takes the app state and settings, and returns a Renderer.
 */
export type GraphRenderer = (
  state: AppState,
  settings: Settings,
  localState: LocalState
) => HtmlNode<Update>;

export function isGraphName(str: string): str is GraphName {
  return GRAPH_NAMES.includes(str as GraphName);
}

/**
 * Make it explicit which events we use, to help catch typos
 *
 * Feel free to add more events here as needed.
 */
export type EventName = "click" | "input" | "change";

export type EventHandler = {
  elementId: string;
  eventName: EventName;
  callback: (event: Event) => Sent;
};

/**
 * A renderer has a body, of the html to render, and listeners.
 *
 * To understand how to use this, ctrl-f and look in the rendering files.
 */
export type RenderedWithEvents = {
  body: string;
  eventListeners: EventHandler[];
};

/**
 * These are the messages passed from the client to the service worker.
 *
 * As a principle: pass as little info to the backend as possible
 */
export type Update =
  | { kind: "Noop" }
  | { kind: "SetModel"; model: Model }
  | {
      kind: "AddJournalEntry";
      time: Date;
      text: string;
      day: Day;
    }
  | {
      kind: "UpdatePromptValue";
      entry: JournalEntry;
      newValue: MoodValue;
      prompt: Prompt;
    }
  | { kind: "RemoveSettings" }
  | { kind: "RemoveAppState" }
  | { kind: "UpdateCurrentTab"; tab: TabName }
  | { kind: "UpdateCurrentGraph"; graphName: GraphName }
  | { kind: "AddPill"; pill: Pill }
  | { kind: "ResetCurrentDay" }
  | { kind: "UpdateCurrentDay"; direction: Direction }
  | { kind: "GoToSpecificDay"; tab: TabName; entry: JournalEntry }
  | { kind: "ReadImportedFile"; target: HTMLInputElement }
  | { kind: "UpdateImportAppState"; state: AppState }
  | { kind: "UpdateImportSettings"; settings: Settings }
  | { kind: "SetImportStatus"; status: Result<string> }
  | {
      kind: "UpdatePillValue";
      entry: JournalEntry;
      pillName: string;
      direction: Direction;
    }
  | {
      kind: "UpdatePillOrder";
      pill: Pill;
      direction: PillOrderDirection;
    }
  | { kind: "ReadyToRender" }
  | { kind: "InitializeDay" }
  | { kind: "SetDebuggingInfo"; info: DebuggingInfo }
  | {
      kind: "SetQueryDuration";
      index: number;
      path: QueryPath[];
      duration: number;
    }
  | {
      kind: "SetPromptChoice";
      index: number;
      path: QueryPath[];
      prompt: Prompt;
    }
  | {
      kind: "SetComparisonChoice";
      index: number;
      path: QueryPath[];
      comparison: Comparison;
    }
  | {
      kind: "SetMoodValueChoice";
      index: number;
      path: QueryPath[];
      moodValue: MoodValue;
    }
  | {
      kind: "SetCombineQuery";
      index: number;
      path: QueryPath[];
      combineQueryKind: CombineQueryKind;
    }
  | { kind: "AddNewDurationQuery" }
  | { kind: "AddNewFilterQuery" }
  | { kind: "DeleteQuery"; index: number; path: QueryPath[] }
  | {
      kind: "ToggleFilterLineGraphView";
      prompt: Prompt;
    };

/**
 * These are used to make sure that events communicate over the broadcast channel
 */
type SentConstructors = "Sent" | "Noop";

export type Sent = SentConstructors | Promise<SentConstructors>;

export function dontSend(): Update {
  return { kind: "Noop" };
}

export type Direction = "Next" | "Previous";

export type PillOrderDirection = "Up" | "Down" | "Top";

export type RenderBroadcast =
  | {
      kind: "rerender";
      state: AppState;
      settings: Settings;
      debuggingInfo: DebuggingInfo;
    }
  | { kind: "ReadyToRender" };

export type TypedBroadcastChannel<type> = {
  channel: BroadcastChannel;
  postMessage: (message: type) => void;
};

export function TypedBroadcastChannel<type>(
  name: string
): TypedBroadcastChannel<type> {
  const channel = new BroadcastChannel(name);
  channel.onmessageerror = (event) => {
    console.log("CHANNEL ERROR:", event);
  };
  return {
    channel: channel,
    postMessage: (message: type) => channel.postMessage(message),
  };
}

export type RenderError = "NeedsToInitialize";

export const SETTINGS_OBJECT_STORE_NAME = "Settings";
export const APP_STATE_OBJECT_STORE_NAME = "AppState";

export type StoreName =
  | typeof SETTINGS_OBJECT_STORE_NAME
  | typeof APP_STATE_OBJECT_STORE_NAME;

export function isStoreName(str: string): str is StoreName {
  if (
    str === SETTINGS_OBJECT_STORE_NAME ||
    str === APP_STATE_OBJECT_STORE_NAME
  ) {
    return true;
  }

  return false;
}

export type ServerError = NoSuchStore | IncorrectPayload;

export type NoSuchStore = {
  kind: "NoSuchStore";
};

export function NoSuchStore(): NoSuchStore {
  return {
    kind: "NoSuchStore",
  };
}
export type IncorrectPayload = {
  kind: "IncorrectPayload";
};

export function IncorrectPayload(): IncorrectPayload {
  return {
    kind: "IncorrectPayload",
  };
}
export type PromptRenderData = {
  prompt: Prompt;
  data: { x: Date; y: number }[];
  borderColor: string;
  borderWidth: number;
  fill: boolean;
};
