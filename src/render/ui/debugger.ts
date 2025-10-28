import { class_, div, h3, h4, HtmlNode, text } from "@eeue56/coed";
import { DebuggingInfo, Update } from "../../types";

function row<a>(children: HtmlNode<a>[]): HtmlNode<a> {
  return div([], [class_("row")], children);
}

/**
 * Convert raw event names to human-readable descriptions
 */
function getEventDescription(eventKind: Update["kind"]): string {
  switch (eventKind) {
    case "Noop":
      return "No operation";
    case "SetModel":
      return "Set complete model";
    case "AddJournalEntry":
      return "Added journal entry";
    case "UpdatePromptValue":
      return "Updated mood value";
    case "RemoveSettings":
      return "Removed all settings";
    case "RemoveAppState":
      return "Removed all app data";
    case "UpdateCurrentTab":
      return "Switched tab";
    case "UpdateCurrentGraph":
      return "Changed graph view";
    case "AddPill":
      return "Added medication";
    case "ResetCurrentDay":
      return "Reset to today";
    case "UpdateCurrentDay":
      return "Changed day";
    case "GoToSpecificDay":
      return "Navigated to specific day";
    case "ReadImportedFile":
      return "Read imported file";
    case "UpdateImportAppState":
      return "Imported app state";
    case "UpdateImportSettings":
      return "Imported settings";
    case "SetImportStatus":
      return "Set import status";
    case "UpdatePillValue":
      return "Updated medication dosage";
    case "UpdatePillOrder":
      return "Reordered medication";
    case "ReadyToRender":
      return "Ready to render";
    case "InitializeDay":
      return "Initialized day";
    case "SetDebuggingInfo":
      return "Set debugging info";
    case "SetQueryDuration":
      return "Set query duration";
    case "SetPromptChoice":
      return "Set prompt choice";
    case "SetComparisonChoice":
      return "Set comparison choice";
    case "SetMoodValueChoice":
      return "Set mood value choice";
    case "SetCombineQuery":
      return "Set combine query";
    case "AddNewDurationQuery":
      return "Added duration query";
    case "AddNewFilterQuery":
      return "Added filter query";
    case "DeleteQuery":
      return "Deleted query";
    case "ToggleFilterLineGraphView":
      return "Toggled line graph filter";
    default:
      return eventKind;
  }
}

function renderEventLogEntry(entry: Update["kind"]): HtmlNode<never> {
  const description = getEventDescription(entry);
  return row([div([], [], [text(description)])]);
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
