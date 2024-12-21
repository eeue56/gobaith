import {
  AppState,
  dontSend,
  GRAPH_NAMES,
  GraphName,
  isGraphName,
  RenderedWithEvents,
  sendUpdate,
  Sent,
} from "../../types";

function renderChoice(graphKey: GraphName, state: AppState): string {
  const selectedText = graphKey === state.currentGraph ? "selected" : "";
  return `
<option value="${graphKey}" ${selectedText}>${graphKey}</option>
`;
}

export function renderGraphChoices(state: AppState): RenderedWithEvents {
  const choices = GRAPH_NAMES.map((key) => renderChoice(key, state)).join("\n");

  return {
    body: `
<div class="pure-g">
    <div class="pure-u-1-5"></div>
    <select class="pure-u-3-5" id='graph-selection'>
        ${choices}
    </select>
    <div class="pure-u-1-5"></div>
</div>
`,
    eventListeners: [
      {
        eventName: "change",
        elementId: "graph-selection",
        callback: (event: Event) => updateCurrentGraph(event),
      },
    ],
  };
}

function updateCurrentGraph(event: Event): Sent {
  if (!event.target) {
    return dontSend();
  }
  const selectedGraph = (event.target as HTMLSelectElement).value;

  if (!isGraphName(selectedGraph)) {
    return dontSend();
  }

  return sendUpdate({
    kind: "UpdateCurrentGraph",
    graphName: selectedGraph as GraphName,
  });
}
