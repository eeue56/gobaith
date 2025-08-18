import { attribute, button, HtmlNode, on, text } from "@eeue56/coed";
import { Update } from "../../types";
import { iconDelete } from "./icons";

export function renderRemoveSettings(): HtmlNode<Update> {
  return button(
    [on("click", updateRemoveSettings)],
    [attribute("id", "remove-all-settings")],
    [text("Remove settings (including pills) data"), iconDelete]
  );
}

function updateRemoveSettings(): Update {
  return {
    kind: "RemoveSettings",
  };
}

export function renderRemoveAppState(): HtmlNode<Update> {
  return button(
    [on("click", updateRemoveAppState)],
    [attribute("id", "remove-app-state")],
    [text("Remove app state (including journal entries) data"), iconDelete]
  );
}

function updateRemoveAppState(): Update {
  return {
    kind: "RemoveAppState",
  };
}
