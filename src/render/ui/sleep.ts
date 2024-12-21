import {
  dontSend,
  JournalEntry,
  Renderer,
  sendUpdate,
  Sent,
} from "../../types";

const MAX = 48;

function sliderFillStyle(percentFilled: number): string {
  return `linear-gradient(to right, var(--pico-range-thumb-color) ${percentFilled}%, var(--pico-background-color) ${percentFilled}%`;
}

function renderHoursSleptMessage(hoursSlept: number): string {
  return `Hours slept last night: <span class="thick">${hoursSlept}</span>`;
}

export function renderSleepSlider(entry: JournalEntry): Renderer {
  const currentValue = entry.hoursSlept * 2;
  const percentFilled = (currentValue / MAX) * 100;

  return {
    body: `
<div class="pure-g">
    <div class="pure-u-1-3"></div>
    <p class="pure-u-1-3" id="hours-slept">${renderHoursSleptMessage(
      entry.hoursSlept
    )}</p>
    <div class="pure-u-1-3"></div>
</div>
<div class="pure-g">
    <div class="pure-u-1-3"></div>
    <div class="slider-label">0</div>
    <input title="Drag slider to find your sleep hours" type="range" min="0" max="${MAX}" step="1" list="steplist" value="${currentValue}" class="pure-u-1-3 slider" id="sleep-slider" style="background: ${sliderFillStyle(
      percentFilled
    )}">
    <div class="slider-label">24</div>
    <div class="pure-u-1-3"></div>
</div>
    `,
    eventListeners: [
      {
        elementId: "sleep-slider",
        eventName: "input",
        callback: (event) => dynamicallyShowSliderValue(event),
      },
      {
        elementId: "sleep-slider",
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

function dynamicallyShowSliderValue(event: Event): Sent {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return dontSend();
  }

  // set the slider fill
  const percentFilled = (parseInt(target.value) / MAX) * 100;
  target.style.background = sliderFillStyle(percentFilled);

  // temporarily show the value - it will get overwritten on next render anyway
  const hoursSleptContainer = document.getElementById("hours-slept");
  if (!hoursSleptContainer) {
    return dontSend();
  }

  hoursSleptContainer.innerHTML = renderHoursSleptMessage(
    parseInt(target.value) / 2
  );

  return dontSend();
}
