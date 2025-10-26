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
  Prompt,
  Update,
} from "../../types";
import { idHash } from "../../utils/render";
import { getCircleMoodIcon } from "./icons";

function hoverText(moodValue: MoodValue): string {
  switch (moodValue) {
    case 1:
      return "No symptoms";
    case 2:
      return "Slight symptoms, but not impacting daily life";
    case 3:
      return "Some symptoms, impacting daily life, but to a small extent";
    case 4:
      return "The intense symptoms, heavily impacting daily life";
  }
}

function renderMoodState(
  moodValue: MoodValue,
  activeNumber: MoodValue,
  entry: JournalEntry,
  prompt: Prompt
): HtmlNode<Update> {
  const moodText = moodStateFromValue(moodValue);
  const isActive = activeNumber === moodValue;
  const activeClass = isActive ? `circle-active` : "";

  const elementId = idHash(
    encodeURI(`update-prompt-value-${prompt}-${moodValue}`)
  );

  const hover = hoverText(moodValue);
  const icon = getCircleMoodIcon(moodValue, prompt);

  return div(
    [],
    [class_("prompt-button-container"), class_(isActive ? "active" : "")],
    [
      div(
        [
          on("click", () => {
            return updateMoodState(entry, prompt, moodValue);
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

export function renderButtonSet(
  entry: JournalEntry,
  prompt: Prompt
): HtmlNode<Update> {
  const activeNumber = entry.promptResponses[prompt];

  const moodStates = MOOD_VALUES.map((x) =>
    renderMoodState(x, activeNumber, entry, prompt)
  );

  return div(
    [],
    [class_("prompt-group")],
    [
      div([], [class_("prompt")], [h4([], [], [text(prompt)])]),
      div([], [class_("mood-group")], moodStates),
    ]
  );
}

function updateMoodState(
  entry: JournalEntry,
  prompt: Prompt,
  value: MoodValue
): Update {
  return {
    kind: "UpdatePromptValue",
    entry,
    prompt,
    newValue: value,
  };
}
