import { class_, div, h3, h4, HtmlNode, text } from "@eeue56/coed";
import { DebuggingInfo, Update } from "../../types";

function row<a>(children: HtmlNode<a>[]): HtmlNode<a> {
  return div([], [class_("row")], children);
}

function renderEventLogEntry(entry: Update["kind"]): HtmlNode<never> {
  return row([div([], [], [text(entry)])]);
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
