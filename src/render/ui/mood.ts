import {
  JournalEntry,
  MOOD_VALUES,
  moodStateFromValue,
  MoodValue,
  Prompt,
  RenderedWithEvents,
  sendUpdate,
  Sent,
} from "../../types";
import { dayToString } from "../../utils/dates";
import { idHash } from "../../utils/render";

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

export function renderButtonSet(
  entry: JournalEntry,
  prompt: Prompt
): RenderedWithEvents {
  const uniquePromptGroupId = idHash(
    dayToString(entry.day) + encodeURI(prompt)
  );
  const activeNumber = entry.promptResponses[prompt];

  function renderMoodState(number: MoodValue): RenderedWithEvents {
    const text = moodStateFromValue(number);
    const isActive = activeNumber === number;
    const activeClass = isActive
      ? `pure-button-active mood-color-button-${number}`
      : "";

    const elementId = idHash(
      encodeURI(`update-prompt-value-${prompt}-${number}`)
    );

    const hover = hoverText(number);

    return {
      body: `
<button title="${hover}" data-mood-value="${number}" class="pure-button pure-u-5-24 prompt-answer ${activeClass}" id="${elementId}">${text}</button>
`,
      eventListeners: [
        {
          elementId: elementId,
          eventName: "click",
          callback: () => updateMoodState(entry, prompt, number),
        },
      ],
    };
  }

  const moodStates = MOOD_VALUES.map((x) => renderMoodState(x));
  const moodStateViews = moodStates.map(({ body }) => body);
  const moodStateEventListners = moodStates
    .map(({ eventListeners }) => eventListeners)
    .flat();

  return {
    body: `
<div id="${uniquePromptGroupId}" class="prompt-group">
    <div class="pure-g">
        <div class="pure-u-1-5"></div>
        <div class="pure-u-3-5 prompt"><h4>${prompt}</h4></div>
        <div class="pure-u-1-5"></div>
    </div>
    <div class="pure-button-group" role="group" aria-label="...">
        <div class="pure-u-2-24 prompt-side"><div class="mood-color-indicator-${activeNumber}"></div></div>
        ${moodStateViews.join("\n")}
        <div class="pure-u-2-24 prompt-side"></div>
    </div>
</div>
    `,
    eventListeners: moodStateEventListners,
  };
}

function updateMoodState(
  entry: JournalEntry,
  prompt: Prompt,
  value: MoodValue
): Sent {
  return sendUpdate({
    kind: "UpdatePromptValue",
    entry,
    prompt,
    newValue: value,
  });
}
