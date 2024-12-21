import { RenderedWithEvents, sendUpdate, Sent } from "../../types";

export function renderRemoveSettings(): RenderedWithEvents {
  return {
    body: `
<div class="pure-g">
    <div class="pure-u-1-3"></div>
    <button class="pure-button pure-u-1-3" id="remove-all-settings"> Remove settings (including pills) data </button>
    <div class="pure-u-1-3"></div>
</div>
`,
    eventListeners: [
      {
        elementId: "remove-all-settings",
        eventName: "click",
        callback: updateRemoveSettings,
      },
    ],
  };
}

function updateRemoveSettings(): Sent {
  return sendUpdate({
    kind: "RemoveSettings",
  });
}

export function renderRemoveAppState(): RenderedWithEvents {
  return {
    body: `
<div class="pure-g">
    <div class="pure-u-1-3"></div>
    <button class="pure-button pure-u-1-3" id="remove-app-state"> Remove app state (including journal entries) data </button>
    <div class="pure-u-1-3"></div>
</div>
`,
    eventListeners: [
      {
        elementId: "remove-app-state",
        eventName: "click",
        callback: updateRemoveAppState,
      },
    ],
  };
}

function updateRemoveAppState(): Sent {
  return sendUpdate({
    kind: "RemoveAppState",
  });
}
