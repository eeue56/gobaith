import {
  AppState,
  EventHandler,
  JournalEntry,
  PROMPTS,
  Renderer,
  Settings,
} from "../types";
import { isSameDay } from "../utils/dates";
import { renderDate } from "./date";
import { renderEnterTimestampMessage, renderLogs } from "./ui/logs";
import { renderButtonSet } from "./ui/mood";
import { renderPill } from "./ui/pills";
import { renderSleepSlider } from "./ui/sleep";
import { renderTabNavigation } from "./ui/tabs";

export function renderJournal(state: AppState, settings: Settings): Renderer {
  let todaysEntry: JournalEntry | null = null;
  // the last entry is usually the one you're looking at (i.e the current day)
  // so start at the back, then loop downwards to the find the right one
  // It would probably be a better optimization to index elements through day-as-a-key
  for (let i = state.journalEntries.length - 1; i >= 0; i--) {
    const entry = state.journalEntries[i];
    if (isSameDay(state.day, entry.day)) {
      todaysEntry = entry;
      break;
    }
  }

  if (!todaysEntry) {
    throw "NeedsToInitialize";
  }

  const bodies: string[] = [];
  const eventHandlers: EventHandler[] = [];

  const date = renderDate(state.day);
  bodies.push(date.body);
  eventHandlers.push(...date.eventListeners);

  const enterTime = renderEnterTimestampMessage(state.day);
  bodies.push(enterTime.body);
  eventHandlers.push(...enterTime.eventListeners);

  const logs = renderLogs(todaysEntry);
  bodies.push(logs.body);
  eventHandlers.push(...logs.eventListeners);

  const sleep = renderSleepSlider(todaysEntry);
  bodies.push(sleep.body);
  eventHandlers.push(...sleep.eventListeners);

  PROMPTS.forEach((prompt) => {
    const row = renderButtonSet(todaysEntry, prompt);
    bodies.push(row.body);
    eventHandlers.push(...row.eventListeners);
  });

  settings.currentPills.forEach((pill) => {
    const row = renderPill(todaysEntry, pill);
    bodies.push(row.body);
    eventHandlers.push(...row.eventListeners);
  });

  const tab = renderTabNavigation(state.currentTab);

  eventHandlers.push(...tab.eventListeners);

  return {
    body: `
<div class="tab-content">
  <div class="selections">
      ${bodies.join("\n")}
  </div>
</div>
${tab.body}
`,
    eventListeners: eventHandlers,
  };
}
