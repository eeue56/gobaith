import {
  attribute,
  class_,
  div,
  HtmlNode,
  input,
  on,
  p,
  span,
  text,
} from "@eeue56/coed";
import { dontSend, JournalEntry, Update } from "../../types";

const MAX_SLEEPING_30_MINUTE_SLOTS = 48;

function sliderFillStyle(percentFilled: number): string {
  return `linear-gradient(to right, var(--pico-range-thumb-color) ${percentFilled}%, var(--pico-background-color) ${percentFilled}%`;
}

function renderHoursSleptMessage(hoursSlept: number): HtmlNode<never> {
  return p(
    [],
    [class_("hours-slept-last-night-message")],
    [
      text(`Hours slept last night:`),
      span(
        [],
        [attribute("id", "hours-slept"), class_("thick")],
        [text(hoursSlept.toString())]
      ),
    ]
  );
}

export function renderSleepSlider(entry: JournalEntry): HtmlNode<Update> {
  const currentValue = entry.hoursSlept * 2;
  const percentFilled = (currentValue / MAX_SLEEPING_30_MINUTE_SLOTS) * 100;

  return div(
    [],
    [],
    [
      renderHoursSleptMessage(entry.hoursSlept),
      div(
        [],
        [class_("hours-slept-last-night-message")],
        [
          div([], [class_("slider-label")], [text("0")]),
          input(
            [on("input", (event) => dynamicallyShowSliderValue(event, entry))],
            [
              attribute("id", "sleep-slider"),
              attribute("title", "Drag slider to find your sleep hours"),
              class_("slider"),
              attribute("type", "range"),
              attribute("min", "0"),
              attribute("max", MAX_SLEEPING_30_MINUTE_SLOTS.toString()),
              attribute("step", "1"),
              attribute("list", "steplist"),
              attribute("value", currentValue.toString()),
              attribute(
                "style",
                `background: ${sliderFillStyle(percentFilled)}`
              ),
            ]
          ),
          div([], [class_("slider-label")], [text("24")]),
        ]
      ),
    ]
  );
}

function dynamicallyShowSliderValue(event: Event, entry: JournalEntry): Update {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return dontSend();
  }

  const percentFilled =
    (parseInt(target.value) / MAX_SLEEPING_30_MINUTE_SLOTS) * 100;
  target.style.background = sliderFillStyle(percentFilled);

  return {
    kind: "UpdateSleepValue",
    entry: entry,
    value: parseInt((event.target as HTMLInputElement).value, 10) / 2,
  };
}
