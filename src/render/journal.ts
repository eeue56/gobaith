import { class_, div, HtmlNode } from "@eeue56/coed";
import { initializeEntryForDay } from "../logic/journal";
import { JournalEntry, Model, PROMPTS, Update } from "../types";
import { isSameDay } from "../utils/dates";
import { renderDate } from "./date";
import { renderEnterTimestampMessage, renderLogs } from "./ui/logs";
import { renderButtonSet } from "./ui/mood";
import { renderPill } from "./ui/pills";

export function renderJournal(model: Model): HtmlNode<Update> {
  let todaysEntry: JournalEntry | null = null;
  // the last entry is usually the one you're looking at (i.e the current day)
  // so start at the back, then loop downwards to the find the right one
  // It would probably be a better optimization to index elements through day-as-a-key
  for (let i = model.appState.journalEntries.length - 1; i >= 0; i--) {
    const entry = model.appState.journalEntries[i];
    if (isSameDay(model.appState.day, entry.day)) {
      todaysEntry = entry;
      break;
    }
  }

  if (!todaysEntry) {
    todaysEntry = initializeEntryForDay(
      model.appState.day,
      model.appState.journalEntries,
      model.settings
    ).entry;
  }

  // Filter prompts to only show enabled ones
  const enabledPrompts = PROMPTS.filter((prompt) =>
    model.settings.enabledPrompts.has(prompt)
  );

  return div(
    [],
    [class_("tab-content"), class_("journal-tab-content")],
    [
      div(
        [],
        [class_("selections")],
        [
          renderDate(model.appState.day),
          ...enabledPrompts.map((prompt) => renderButtonSet(todaysEntry, prompt)),
          ...model.settings.currentPills.map((pill) =>
            renderPill(todaysEntry, pill)
          ),
          renderEnterTimestampMessage(model.appState.day),
          renderLogs(todaysEntry),
        ]
      ),
    ]
  );
}
