import { AppState, Settings, isAppState, isSettings, Prompt } from "./types";

/**
 * Convert Settings to a JSON-serializable format
 */
function settingsToJSON(settings: Settings): any {
  return {
    ...settings,
    enabledPrompts: Array.from(settings.enabledPrompts),
  };
}

/**
 * Convert JSON back to Settings with Set
 */
function settingsFromJSON(json: any): Settings {
  return {
    ...json,
    enabledPrompts: new Set<Prompt>(json.enabledPrompts || []),
  };
}

export async function saveToServer(
  state: AppState,
  settings: Settings
): Promise<void> {
  // we send to the database, but don't block on response
  try {
    saveSettingsToServer(settings);
    saveAppStateToServer(state);
  } catch (error) {}
}

export async function loadSettingsFromServer(): Promise<Settings | string> {
  const response = await fetch("/load/Settings");

  if (response.status === 404) {
    // probably means there's no backend, so ignore
    return "No backend";
  }
  const json = await response.json();
  const settings = settingsFromJSON(json);

  if (isSettings(settings)) {
    return settings;
  }

  console.error(settings);
  return "Failed to load settings";
}

export async function loadAppStateFromServer(): Promise<AppState | string> {
  const response = await fetch("/load/AppState");

  if (response.status === 404) {
    // probably means there's no backend, so ignore
    return "No backend";
  }

  const state = await response.json();

  if (isAppState(state)) {
    return state;
  }

  console.error(state);
  return "Failed to load AppState";
}

async function saveSettingsToServer(settings: Settings): Promise<void> {
  const serverResponse = await fetch("/save/Settings", {
    method: "POST",
    body: JSON.stringify(settingsToJSON(settings)),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (serverResponse.status === 501) {
    // probably means there's no backend, so ignore
    return;
  }

  if (serverResponse.status !== 200) {
    console.error("Server response:", serverResponse.status);
    console.error(await serverResponse.text());
  }
}

async function saveAppStateToServer(state: AppState): Promise<void> {
  const serverResponse = await fetch("/save/AppState", {
    method: "POST",
    body: JSON.stringify(state),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (serverResponse.status === 501) {
    // probably means there's no backend, so ignore
    return;
  }

  if (serverResponse.status !== 200) {
    console.error("Server response:", serverResponse.status);
    console.error(await serverResponse.text());
  }
}
