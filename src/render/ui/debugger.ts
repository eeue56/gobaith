import { class_, div, h3, h4, HtmlNode, small, text } from "@eeue56/coed";
import { DebuggingInfo, EventLogEntry } from "../../types";

function row<a>(children: HtmlNode<a>[]): HtmlNode<a> {
  return div([], [class_("row")], children);
}

/**
 * Convert event kind to a human-readable description
 */
function eventLogEntryToDescription(entry: EventLogEntry): string {
  switch (entry.eventKind) {
    case "Noop":
      return "No operation";
    case "SetModel":
      return "Model initialized";
    case "AddJournalEntry":
      return "Added journal entry";
    case "UpdatePromptValue":
      return "Updated mood/prompt value";
    case "RemoveSettings":
      return "Cleared all settings";
    case "RemoveAppState":
      return "Cleared all data";
    case "UpdateCurrentTab":
      return "Changed tab";
    case "UpdateCurrentGraph":
      return "Changed graph view";
    case "AddPill":
      return "Added medication";
    case "ResetCurrentDay":
      return "Reset to today";
    case "UpdateCurrentDay":
      return "Changed day";
    case "GoToSpecificDay":
      return "Jumped to specific day";
    case "ReadImportedFile":
      return "Reading import file";
    case "UpdateImportAppState":
      return "Imported app data";
    case "UpdateImportSettings":
      return "Imported settings";
    case "SetImportStatus":
      return "Import status updated";
    case "UpdatePillValue":
      return "Updated medication dose";
    case "UpdatePillOrder":
      return "Reordered medications";
    case "ReadyToRender":
      return "Ready to render";
    case "InitializeDay":
      return "Initialized day";
    case "SetDebuggingInfo":
      return "Updated debugging info";
    case "SetQueryDuration":
      return "Set query duration";
    case "SetPromptChoice":
      return "Set prompt filter";
    case "SetComparisonChoice":
      return "Set comparison filter";
    case "SetMoodValueChoice":
      return "Set mood value filter";
    case "SetCombineQuery":
      return "Set query combination";
    case "AddNewDurationQuery":
      return "Added duration query";
    case "AddNewFilterQuery":
      return "Added filter query";
    case "DeleteQuery":
      return "Deleted query";
    case "ToggleFilterLineGraphView":
      return "Toggled graph filter";
    case "SelectPromptPack":
      return "Selected prompt pack";
    case "TogglePrompt":
      return "Toggled prompt";
    case "DeletePromptData":
      return "Deleted prompt data";
    case "CompleteSetup":
      return "Completed setup";
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function renderEventLogEntry(entry: EventLogEntry): HtmlNode<never> {
  const description = eventLogEntryToDescription(entry);
  const timestamp = formatTimestamp(entry.timestamp);

  return row([
    div(
      [],
      [class_("event-log-entry")],
      [
        div([], [class_("event-description")], [text(description)]),
        small([], [class_("event-timestamp")], [text(timestamp)]),
      ]
    ),
  ]);
}

export function renderDebuggingInfo(info: DebuggingInfo): HtmlNode<never> {
  return div(
    [],
    [],
    [
      h3([], [], [text("Debugging info")]),
      h4([], [], [text("Event log")]),
      div([], [class_("event-log")], info.eventLog.map(renderEventLogEntry)),
    ]
  );
}
