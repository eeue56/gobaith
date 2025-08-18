import {
  attribute,
  booleanAttribute,
  HtmlNode,
  on,
  option,
  select,
  text,
} from "@eeue56/coed";
import {
  AppState,
  dontSend,
  GRAPH_NAMES,
  GraphName,
  isGraphName,
  Update,
} from "../../types";

function renderChoice(graphKey: GraphName, state: AppState): HtmlNode<never> {
  return option(
    [],
    [
      attribute("value", graphKey),
      booleanAttribute("selected", graphKey === state.currentGraph),
    ],
    [text(graphKey)]
  );
}

export function renderGraphChoices(state: AppState): HtmlNode<Update> {
  const choices = GRAPH_NAMES.map((key) => renderChoice(key, state));

  return select(
    [on("change", updateCurrentGraph)],
    [attribute("id", "graph-selection")],
    choices
  );
}

function updateCurrentGraph(event: Event): Update {
  if (!event.target) {
    return dontSend();
  }
  const selectedGraph = (event.target as HTMLSelectElement).value;

  if (!isGraphName(selectedGraph)) {
    return dontSend();
  }

  return {
    kind: "UpdateCurrentGraph",
    graphName: selectedGraph as GraphName,
  };
}
