import { daysBeforeToday as entriesBeforeToday } from "../../logic/journal";
import {
  Day,
  EventHandler,
  JournalEntry,
  Prompt,
  PROMPTS,
  Renderer,
  sendUpdate,
  Sent,
  SHORT_PROMPTS,
} from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";
import { idHash, renderer } from "../../utils/render";

function renderSleepRow(entries: JournalEntry[]): Renderer {
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

function renderRow(prompt: Prompt, entries: JournalEntry[]): Renderer {
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

    bodies.push(
      `<div title="${dayToString(
        entry.day
      )}" class="daily-bar daily-bar-${dayValue}" id="${id}"></div>`
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

function renderPromptPart(prompt: Prompt): string {
  return `<span class="daily-bar-prompt">${SHORT_PROMPTS[prompt]}</span>`;
}

export function renderDailyBar(
  today: Day,
  journalEntries: JournalEntry[]
): Renderer {
  let entries = entriesBeforeToday(today, journalEntries);

  entries.sort(sortEntriesByDate);

  entries = entries.slice(Math.max(entries.length - 60, 0));

  const promptBodies: string[] = [];
  const promptEvents: EventHandler[] = [];

  for (const prompt of PROMPTS) {
    const row = renderer`<div class="daily-bar-row">${renderPromptPart(
      prompt
    )}${renderRow(prompt, entries)}</div>`;
    promptBodies.push(row.body);
    promptEvents.push(...row.eventListeners);
  }

  const sleepParts = renderer`<div class="daily-bar-row"><span class="daily-bar-prompt">Sleep</span>${renderSleepRow(
    entries
  )}</div>`;

  return {
    body: `<div class="daily-bar-graph-container">${sleepParts.body}
  ${promptBodies.join("\n")}</div>`,
    eventListeners: [...promptEvents, ...sleepParts.eventListeners],
  };
}

export function renderTotaledDailyBar(
  today: Day,
  journalEntries: JournalEntry[]
): Renderer {
  let entries = entriesBeforeToday(today, journalEntries);
  entries.sort(sortEntriesByDate);

  const dailyBars: string[] = [];
  for (const entry of entries) {
    const inner = PROMPTS.map((prompt) => {
      const dayValue = entry.promptResponses[prompt];
      const promptClass = `daily-bar-total-${SHORT_PROMPTS[prompt]}`;

      return `
<div style="height: ${
        ((dayValue - 1) / 4) * 70
      }px;" class="daily-bar-total ${promptClass}"></div>
              `;
    }).join("");

    dailyBars.push(
      `<div title="${dayToString(
        entry.day
      )}" class="daily-bar-total-bar">${inner}</div>`
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
