import { DebuggingInfo, Update } from "../../types";

function renderEventLogEntry(entry: Update["kind"]): string {
  return `
<div class="pure-g">
    <div class="pure-u-1-6"></div>
        <div class="pure-u-4-6">${entry}</div>
    <div class="pure-u-1-6"></div>
</div>`;
}

export function renderDebuggingInfo(info: DebuggingInfo): string {
  return `
<h3>Debugging info</h3>
<h4>Event log:</h4>
<div class="event-log">
    ${info.eventLog.map(renderEventLogEntry).join("\n")}
</div>
    `;
}
