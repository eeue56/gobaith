import { importDataFromJson } from "../../logic/journal";
import {
  AppState,
  dontSend,
  EventHandler,
  RenderedWithEvents,
  sendUpdate,
  Sent,
  Settings,
} from "../../types";

export function renderEnterTextToImport(): RenderedWithEvents {
  const ids: string[] = ["update-import-from-text", "import-from-file"];
  const eventHandlers: EventHandler[] = [
    {
      elementId: ids[0],
      eventName: "click",
      callback: () => updateImport(),
    },
    {
      elementId: ids[1],
      eventName: "change",
      callback: async (event) => await updateImportFile(event),
    },
  ];

  return {
    body: `
<div class="pure-g"/>
    <div class="pure-u-1-24"></div>
    <form class="pure-form pure-u-22-24" onsubmit="event.preventDefault(); return false">
        <fieldset class="pure-g">
            <textarea id="import-text" class="pure-u-4-5 import-field" placeholder="Paste JSON here to import it..."></textarea>
            <button title="Import JSON. Check the developer console to see success/errors" class="pure-button pure-button-primary pure-u-1-5" id="${ids[0]}">Import</button>
          </fieldset>
          <label for="${ids[1]}">Choose a json file to import</label>
          <input type="file" id="${ids[1]}" accept=".json"></input>
    </form>
    <div class="pure-u-1-24"></div>
</div>

<div class="pure-g">
    <div class="pure-u-1-3"></div>
    <p class="pure-u-1-3" id="import-status"></p>
    <div class="pure-u-1-3"></div>
</div>
`,
    eventListeners: eventHandlers,
  };
}

function importer(imported: string | AppState | Settings): Sent {
  if (typeof imported === "string") {
    console.error("Failed to import", imported);
    return dontSend();
  }

  switch (imported.kind) {
    case "AppState": {
      return sendUpdate({
        kind: "UpdateImportAppState",
        state: imported,
      });
    }
    case "Settings": {
      return sendUpdate({
        kind: "UpdateImportSettings",
        settings: imported,
      });
    }
  }
}

function updateImport(): Sent {
  const textToImport =
    (
      document.getElementById("import-text") as HTMLTextAreaElement
    )?.value.trim() || "{}";
  const isJson = textToImport.startsWith("{");

  if (!isJson) {
    console.error("Did not get json in importer");
    return dontSend();
  }

  const imported = importDataFromJson(textToImport);

  return importer(imported);
}

async function updateImportFile(event: Event): Promise<Sent> {
  if (!event.target) {
    return dontSend();
  }
  const context = event.target as HTMLInputElement;
  if (context.files === null || context.files.length === 0) return dontSend();

  if (context.files[0].name.endsWith(".json")) {
    const fileContents = await context.files[0].text();
    const imported = importDataFromJson(fileContents);
    return importer(imported);
  }

  return dontSend();
}

export function renderExportedSettings(settings: Settings): RenderedWithEvents {
  const id = "download-settings";
  const stringSettings = JSON.stringify(settings);
  return {
    body: `
<div class="pure-g"/>
    <div class="pure-u-1-5"></div>
    <div class="pure-form pure-u-3-5">
        <h3>Exported settings (including pills)</h3>
        <textarea id="textarea-export-settings" class="pure-u-1 export-data">${stringSettings}</textarea>
        <button class="pure-button" id="${id}">Download settings</button>
    </div>
    <div class="pure-u-1-5"></div>
</div>
`,
    eventListeners: [
      {
        elementId: id,
        eventName: "click",
        callback: (): Sent => downloadJson(settings),
      },
    ],
  };
}

export function renderExportedState(state: AppState): RenderedWithEvents {
  const id = "download-state";
  const stringState = JSON.stringify(state);
  return {
    body: `
<div class="pure-g"/>
    <div class="pure-u-1-5"></div>
    <div class="pure-form pure-u-3-5">
        <h3>Exported state (including journal entries)</h3>
        <textarea id="textarea-export-state" class="pure-u-1 export-data">${stringState}</textarea>
        <button class="pure-button" id="${id}">Download state</button>
    </div>
    <div class="pure-u-1-5"></div>
</div>
`,
    eventListeners: [
      {
        elementId: id,
        eventName: "click",
        callback: (): Sent => downloadJson(state),
      },
    ],
  };
}

function downloadJson(object: AppState | Settings) {
  let fileName;
  switch (object.kind) {
    case "AppState": {
      fileName = "state.json";
      break;
    }
    case "Settings": {
      fileName = "settings.json";
      break;
    }
  }

  const blob = new Blob([JSON.stringify(object)], {
    type: "text/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;

  a.click();
  URL.revokeObjectURL(url);

  return dontSend();
}
