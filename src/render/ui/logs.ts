import {
  attribute,
  button,
  class_,
  div,
  fieldset,
  form,
  HtmlNode,
  on,
  p,
  text,
  textarea,
} from "@eeue56/coed";
import { Day, dontSend, JournalEntry, LogEntry, Update } from "../../types";
import { iconSave } from "./icons";

function renderJournalEntry(log: LogEntry): HtmlNode<never> {
  return div(
    [],
    [],
    [p([], [class_("journal-entry")], [text(`${log.time} - ${log.text}`)])]
  );
}

export function renderLogs(journalEntry: JournalEntry): HtmlNode<never> {
  if (journalEntry.logs.length === 0) return div([], [], []);

  return div(
    [],
    [class_("journal-entries")],
    journalEntry.logs
      .sort((log: LogEntry) => log.time.valueOf())
      .map(renderJournalEntry)
  );
}

export function renderEnterTimestampMessage(today: Day): HtmlNode<Update> {
  return div(
    [],
    [],
    [
      form(
        [
          on("submit", (event) => {
            event.preventDefault();
            return dontSend();
          }),
        ],
        [],
        [
          fieldset(
            [],
            [class_("new-journal-entry-containter")],
            [
              textarea(
                [],
                [
                  attribute("id", "new-journal-entry"),
                  attribute(
                    "placeholder",
                    "Enter a timestamped journal log entry..."
                  ),
                ],
                []
              ),
              button(
                [on("click", () => updateLogEntries(today))],
                [
                  attribute("title", "Save the entry"),
                  class_("save-log-entry-button"),
                ],
                [text("Save"), iconSave]
              ),
            ]
          ),
        ]
      ),
    ]
  );
}

function updateLogEntries(day: Day): Update {
  const journalEntryElement = document.getElementById(
    "new-journal-entry"
  ) as HTMLTextAreaElement | null;

  if (!journalEntryElement) {
    console.error("Did not find new-journal-entry");
    return dontSend();
  }

  const logEntry = journalEntryElement.value;
  const currentTime = new Date();

  return {
    kind: "AddJournalEntry",
    day: day,
    time: currentTime,
    text: logEntry,
  };
}
