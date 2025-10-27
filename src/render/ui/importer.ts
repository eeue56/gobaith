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
  return div(
    [],
    [class_("import-section")],
    [
      h3([], [], [text("Import data")]),
      div(
        [],
        [class_("import-export-instructions")],
        [
          p([], [], [
            text(
              "To import your data, either paste the JSON content below or choose a file. "
            ),
          ]),
          p([], [], [
            text(
              "You can import either settings (including your pills) or state (including all journal entries). "
            ),
          ]),
          p([], [], [
            text(
              "Warning: Importing will replace your current data. Make sure to export first if you want to keep a backup!"
            ),
          ]),
        ]
      ),
      form(
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
                  attribute("rows", "8"),
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
                [text("Import from text")]
              ),
            ]
          ),
          label([], [], [text("Or choose a JSON file to import:")]),
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
      ),
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
  data: AppState | Settings,
  description: string
): HtmlNode<Update> {
  const stringData = JSON.stringify(data, null, 2); // Pretty print with 2-space indentation

  return div(
    [],
    [class_("export-section")],
    [
      h3([], [], [text(title)]),
      p([], [], [text(description)]),
      textarea(
        [],
        [
          attribute("id", `textarea-${id}`),
          class_("export-data"),
          attribute("readonly", "true"),
          attribute("rows", "10"),
        ],
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
    "Export settings",
    "Download settings as JSON file",
    id,
    settings,
    "Your settings include custom pills and query configurations. You can copy this JSON or download it as a file to back up or transfer to another device."
  );
}

export function renderExportedState(state: AppState): HtmlNode<Update> {
  const id = "download-state";
  return renderExported(
    "Export state",
    "Download state as JSON file",
    id,
    state,
    "Your state includes all journal entries, mood data, and logs. You can copy this JSON or download it as a file to back up or transfer to another device."
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

  const blob = new Blob([JSON.stringify(object, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;

  a.click();
  URL.revokeObjectURL(url);

  return dontSend();
}
