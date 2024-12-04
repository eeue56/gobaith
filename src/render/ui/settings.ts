import { Renderer, sendUpdate, Sent } from "../../types";

export function renderRemoveSettings(): Renderer {
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
        elementSelector: "#remove-all-settings",
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

export function renderRemoveAppState(): Renderer {
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
        elementSelector: "#remove-app-state",
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
