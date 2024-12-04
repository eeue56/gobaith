import {
  dontSend,
  JournalEntry,
  Renderer,
  sendUpdate,
  Sent,
} from "../../types";

export function renderSleepSlider(entry: JournalEntry): Renderer {
  const currentValue = entry.hoursSlept * 2;
  return {
    body: `
<div class="pure-g">
    <div class="pure-u-1-3"></div>
    <p class="pure-u-1-3">Hours slept last night: <span class="thick">${
      currentValue / 2
    }</span></p>
    <div class="pure-u-1-3"></div>
</div>
<div class="pure-g">
    <div class="pure-u-1-3"></div>
    <div class="slider-label">0</div>
    <input title="Drag slider to find your sleep hours" type="range" min="0" max="48" step="1" list="steplist" value="${currentValue}" class="pure-u-1-3 slider" id="sleep-slider">
    <div class="slider-label">24</div>
    <div class="pure-u-1-3"></div>
</div>
    `,
    eventListeners: [
      {
        elementSelector: "#sleep-slider",
        eventName: "change",
        callback: () => updateSleepValue(entry),
      },
    ],
  };
}

function updateSleepValue(entry: JournalEntry): Sent {
  const sleepSliderElement = document.getElementById(
    "sleep-slider"
  ) as HTMLInputElement | null;

  if (!sleepSliderElement) {
    console.error("Did not find sleep-slider");
    return dontSend();
  }

  return sendUpdate({
    kind: "UpdateSleepValue",
    entry: entry,
    value: parseInt(sleepSliderElement.value, 10) / 2,
  });
}
