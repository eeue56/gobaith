import { attribute, class_, div, HtmlNode, on, span, text } from "@eeue56/coed";
import { daysBeforeToday as entriesBeforeToday } from "../../logic/journal";
import {
  AppState,
  JournalEntry,
  LocalState,
  Prompt,
  PROMPTS,
  Settings,
  SHORT_PROMPTS,
  Update,
} from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";

function renderRowBars(
  prompt: Prompt,
  entries: JournalEntry[]
): HtmlNode<Update> {
  const bodies: HtmlNode<Update>[] = [];
  const promptShort = SHORT_PROMPTS[prompt].toLowerCase();

  for (const entry of entries) {
    const dayValue = entry.promptResponses[prompt];
    const title = dayToString(entry.day);

    bodies.push(
      div(
        [
          on("click", (): Update => {
            return {
              kind: "GoToSpecificDay",
              entry: entry,
              tab: "JOURNAL",
            };
          }),
        ],
        [
          attribute("title", title),
          class_("daily-bar"),
          class_(`daily-bar-${dayValue}`),
          class_(`daily-bar-${promptShort}-${dayValue}`),
        ],
        []
      )
    );
  }

  return div([], [class_("daily-bar-colors")], bodies);
}

function renderPromptShortName(prompt: Prompt | string): HtmlNode<never> {
  const shortName = (prompt in SHORT_PROMPTS) ? SHORT_PROMPTS[prompt as Prompt] : prompt;
  return span([], [class_("daily-bar-prompt")], [text(shortName)]);
}

export function renderDailyBar(
  state: AppState,
  settings: Settings,
  localState: LocalState
): HtmlNode<Update> {
  let entries = entriesBeforeToday(state.day, state.journalEntries);

  entries.sort(sortEntriesByDate);
  entries = entries.slice(Math.max(entries.length - 60, 0));

  const promptBodies: HtmlNode<Update>[] = [];

  // Include both standard enabled prompts and custom prompts
  const enabledPrompts = PROMPTS.filter((prompt) =>
    settings.enabledPrompts.has(prompt)
  );
  const allPrompts = [...enabledPrompts, ...settings.customPrompts];

  for (const prompt of allPrompts) {
    const renderedShortName = renderPromptShortName(prompt);
    const rowBars = renderRowBars(prompt, entries);
    const row = div(
      [],
      [class_("daily-bar-row")],
      [renderedShortName, rowBars]
    );
    promptBodies.push(row);
  }

  return div([], [class_("daily-bar-graph-container")], promptBodies);
}

export function renderTotaledDailyBar(
  state: AppState,
  settings: Settings,
  localState: LocalState
): HtmlNode<Update> {
  let entries = entriesBeforeToday(state.day, state.journalEntries);
  entries.sort(sortEntriesByDate);

  const dailyBars: HtmlNode<never>[] = [];
  for (const entry of entries) {
    const innerPromptRendered: HtmlNode<never>[] = [];
    for (const prompt of PROMPTS) {
      const dayValue = entry.promptResponses[prompt];
      const promptClass = `daily-bar-total-${SHORT_PROMPTS[prompt]}`;

      const height = ((dayValue - 1) / 4) * 70;

      innerPromptRendered.push(
        div(
          [],
          [
            class_("daily-bar-total"),
            class_(promptClass),
            attribute("style", `height: ${height}px`),
          ],
          []
        )
      );
    }

    const title = dayToString(entry.day);
    dailyBars.push(
      div(
        [],
        [attribute("title", title), class_("daily-bar-total-bar")],
        innerPromptRendered
      )
    );
  }

  return div(
    [],
    [class_("daily-bar-total-row")],
    [
      span([], [class_("daily-bar-total-prompt")], [text("Extremeness")]),
      div([], [class_("daily-bar-total-colors")], dailyBars),
    ]
  );
}
