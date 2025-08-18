import {
  attribute,
  button,
  class_,
  div,
  fieldset,
  form,
  h3,
  HtmlNode,
  input,
  label,
  on,
  p,
  text,
  textarea,
} from "@eeue56/coed";
import { importDataFromJson } from "../../logic/journal";
import { AppState, dontSend, Settings, Update } from "../../types";

export function renderEnterTextToImport(): HtmlNode<Update> {
  return form(
    [],
    [],
    [
      fieldset(
        [],
        [],
        [
          textarea(
            [],
            [
              attribute("id", "import-text"),
              class_("import-field"),
              attribute("placeholder", "Paste JSON here to import it..."),
            ],
            []
          ),
          button(
            [on("click", () => updateImport())],
            [
              attribute("id", "update-import-from-text"),
              attribute(
                "title",
                "Import JSON. Check the developer console to see success/errors"
              ),
            ],
            [text("Import")]
          ),
        ]
      ),
      label([], [], [text("Chose a json file to import")]),
      input<Update>(
        [
          on("change", (event) => {
            if (!event.target) {
              return dontSend();
            }

            return {
              kind: "ReadImportedFile",
              target: event.target as HTMLInputElement,
            };
          }),
        ],
        [attribute("type", "file"), attribute("accept", ".json")]
      ),

      div([], [], [p([], [attribute("id", "import-status")], [])]),
    ]
  );
}

function importer(imported: string | AppState | Settings): Update {
  if (typeof imported === "string") {
    console.error("Failed to import", imported);
    return dontSend();
  }

  switch (imported.kind) {
    case "AppState": {
      return {
        kind: "UpdateImportAppState",
        state: imported,
      };
    }
    case "Settings": {
      return {
        kind: "UpdateImportSettings",
        settings: imported,
      };
    }
  }
}

function updateImport(): Update {
  const textToImport =
    (
      document.getElementById("import-text") as HTMLTextAreaElement
    )?.value.trim() || "{}";
  const isJson = textToImport.startsWith("{");

  if (!isJson) {
    console.error("Did not get json in importer");
    return { kind: "Noop" };
  }

  const imported = importDataFromJson(textToImport);

  return importer(imported);
}

function renderExported(
  title: string,
  downloadText: string,
  id: string,
  data: AppState | Settings
): HtmlNode<Update> {
  const stringData = JSON.stringify(data);

  return div(
    [],
    [],
    [
      h3([], [], [text(title)]),
      textarea(
        [],
        [attribute("id", `textarea-${id}`), class_("export-data")],
        [text(stringData)]
      ),
      button(
        [on("click", () => downloadJson(data))],
        [attribute("id", id)],
        [text(downloadText)]
      ),
    ]
  );
}

export function renderExportedSettings(settings: Settings): HtmlNode<Update> {
  const id = "download-settings";
  return renderExported(
    "Exported settings (including pills)",
    "Download settings",
    id,
    settings
  );
}

export function renderExportedState(state: AppState): HtmlNode<Update> {
  const id = "download-state";
  return renderExported(
    "Exported state (including journal entries)",
    "Download state",
    id,
    state
  );
}

function downloadJson(object: AppState | Settings): Update {
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
