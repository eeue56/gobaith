import { AppState, Settings, isAppState, isSettings } from "./types";

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
  const settings = await response.json();

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
    body: JSON.stringify(settings),
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
