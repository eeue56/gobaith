import {
  attribute,
  class_,
  div,
  h4,
  HtmlNode,
  label,
  on,
  text,
} from "@eeue56/coed";
import {
  JournalEntry,
  MOOD_VALUES,
  moodStateFromValue,
  MoodValue,
  Update,
} from "../../types";
import { idHash } from "../../utils/render";
import { getCircleMoodIcon } from "./icons";

function sleepHoverText(moodValue: MoodValue): string {
  switch (moodValue) {
    case 1:
      return "Poor sleep quality";
    case 2:
      return "Below average sleep quality";
    case 3:
      return "Good sleep quality";
    case 4:
      return "Excellent sleep quality";
  }
}

function renderSleepState(
  moodValue: MoodValue,
  activeNumber: MoodValue,
  entry: JournalEntry
): HtmlNode<Update> {
  const moodText = moodStateFromValue(moodValue);
  const isActive = activeNumber === moodValue;
  const activeClass = isActive ? `circle-active` : "";

  const elementId = idHash(
    encodeURI(`update-sleep-quality-${moodValue}`)
  );

  const hover = sleepHoverText(moodValue);
  const icon = getCircleMoodIcon(moodValue);

  return div(
    [],
    [class_("prompt-button-container"), class_(isActive ? "active" : "")],
    [
      div(
        [
          on("click", () => {
            return updateSleepQuality(entry, moodValue);
          }),
        ],
        [
          class_("circle-container"),
          class_(isActive ? "active" : ""),
          class_(activeClass),
          attribute("id", elementId),
          attribute("title", hover),
          attribute("data-mood-value", moodValue.toString()),
          class_("prompt-answer"),
          class_("svg-circle"),
        ],
        [icon]
      ),
      label([], [attribute("for", elementId)], [text(moodText)]),
    ]
  );
}

export function renderSleepQuality(entry: JournalEntry): HtmlNode<Update> {
  const activeNumber = entry.sleepQuality;

  const sleepStates = MOOD_VALUES.map((x) =>
    renderSleepState(x, activeNumber, entry)
  );

  return div(
    [],
    [class_("prompt-group")],
    [
      div([], [class_("prompt")], [h4([], [], [text("Sleep quality")])]),
      div([], [class_("mood-group")], sleepStates),
    ]
  );
}

function updateSleepQuality(
  entry: JournalEntry,
  value: MoodValue
): Update {
  return {
    kind: "UpdateSleepQuality",
    entry,
    value,
  };
}
