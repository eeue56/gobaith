import { daysBeforeToday as entriesBeforeToday } from "../../logic/journal";
import {
  AppState,
  EventHandler,
  JournalEntry,
  Prompt,
  PROMPTS,
  RenderedWithEvents,
  sendUpdate,
  Sent,
  Settings,
  SHORT_PROMPTS,
} from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";
import { idHash, renderer } from "../../utils/render";

function renderSleepRow(entries: JournalEntry[]): RenderedWithEvents {
  const bodies: string[] = [];
  const callbacks: EventHandler[] = [];

  for (const entry of entries) {
    const id = `daily-bar-sleep-goto-${idHash(dayToString(entry.day))}`;
    callbacks.push({
      elementId: id,
      eventName: "click",
      callback: (): Sent => {
        return sendUpdate({
          kind: "GoToSpecificDay",
          entry: entry,
          tab: "JOURNAL",
        });
      },
    });

    const dayValue = entry.hoursSlept;

    bodies.push(
      `<div title="${dayToString(
        entry.day
      )}" class="daily-bar-sleep" style="height: ${
        (dayValue / 24) * 100
      }px" id="${id}"></div>`
    );
  }

  return {
    body: `
<div class="daily-bar-colors">
  ${bodies.join("\n")}
</div>`,
    eventListeners: callbacks,
  };
}

function renderRowBars(
  prompt: Prompt,
  entries: JournalEntry[]
): RenderedWithEvents {
  const bodies: string[] = [];
  const callbacks: EventHandler[] = [];

  for (const entry of entries) {
    const id = `daily-bar-prompt-${idHash(prompt)}-goto-${idHash(
      dayToString(entry.day)
    )}`;
    callbacks.push({
      elementId: id,
      eventName: "click",
      callback: (): Sent => {
        return sendUpdate({
          kind: "GoToSpecificDay",
          entry: entry,
          tab: "JOURNAL",
        });
      },
    });

    const dayValue = entry.promptResponses[prompt];
    const title = dayToString(entry.day);

    bodies.push(
      `<div title="${title}" class="daily-bar daily-bar-${dayValue}" id="${id}"></div>`
    );
  }

  return {
    body: `
<div class="daily-bar-colors">
  ${bodies.join("\n")}
</div>`,
    eventListeners: callbacks,
  };
}

function renderPromptShortName(prompt: Prompt): string {
  return `<span class="daily-bar-prompt">${SHORT_PROMPTS[prompt]}</span>`;
}

export function renderDailyBar(
  state: AppState,
  settings: Settings
): RenderedWithEvents {
  let entries = entriesBeforeToday(state.day, state.journalEntries);

  entries.sort(sortEntriesByDate);
  entries = entries.slice(Math.max(entries.length - 60, 0));

  const promptBodies: string[] = [];
  let eventListeners: EventHandler[] = [];

  for (const prompt of PROMPTS) {
    const renderedShortName = renderPromptShortName(prompt);
    const rowBars = renderRowBars(prompt, entries);
    const row = renderer`<div class="daily-bar-row">${renderedShortName}${rowBars}</div>`;
    promptBodies.push(row.body);
    eventListeners = eventListeners.concat(row.eventListeners);
  }

  const sleepRow = renderSleepRow(entries);
  const sleepParts = renderer`<div class="daily-bar-row">
    <span class="daily-bar-prompt">Sleep</span>
    ${sleepRow}
</div>`;

  eventListeners = eventListeners.concat(sleepParts.eventListeners);

  return {
    body: `<div class="daily-bar-graph-container">${sleepParts.body}
  ${promptBodies.join("\n")}</div>`,
    eventListeners: eventListeners,
  };
}

export function renderTotaledDailyBar(
  state: AppState,
  settings: Settings
): RenderedWithEvents {
  let entries = entriesBeforeToday(state.day, state.journalEntries);
  entries.sort(sortEntriesByDate);

  const dailyBars: string[] = [];
  for (const entry of entries) {
    const innerPromptRendered = [];
    for (const prompt of PROMPTS) {
      const dayValue = entry.promptResponses[prompt];
      const promptClass = `daily-bar-total-${SHORT_PROMPTS[prompt]}`;

      const height = ((dayValue - 1) / 4) * 70;

      innerPromptRendered.push(`
<div style="height: ${height}px;" class="daily-bar-total ${promptClass}"></div>
`);
    }

    const title = dayToString(entry.day);
    const content = innerPromptRendered.join("");
    dailyBars.push(
      `<div title="${title}" class="daily-bar-total-bar">${content}</div>`
    );
  }

  return {
    body: `
<div class="daily-bar-total-row">
    <span class="daily-bar-total-prompt"> Extremeness </span>
    <div class="daily-bar-total-colors">
        ${dailyBars.join("\n")}
    </div>
</div>`,
    eventListeners: [],
  };
}
