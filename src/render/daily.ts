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
  let eventHandlers: EventHandler[] = [];

  /**
   * Just a helper to handle body/eventListeners from the rendered content
   */
  function pushBodiesAndEventHandlers(renderer: Renderer): void {
    bodies.push(renderer.body);
    // concat is faster than push(...)
    eventHandlers = eventHandlers.concat(renderer.eventListeners);
  }

  pushBodiesAndEventHandlers(renderDate(state.day));
  pushBodiesAndEventHandlers(renderEnterTimestampMessage(state.day));
  pushBodiesAndEventHandlers(renderLogs(todaysEntry));
  pushBodiesAndEventHandlers(renderSleepSlider(todaysEntry));

  for (const prompt of PROMPTS) {
    pushBodiesAndEventHandlers(renderButtonSet(todaysEntry, prompt));
  }

  for (const pill of settings.currentPills) {
    pushBodiesAndEventHandlers(renderPill(todaysEntry, pill));
  }

  const tabs = renderTabNavigation(state.currentTab);
  eventHandlers.push(...tabs.eventListeners);

  return {
    body: `
<div class="tab-content">
  <div class="selections">
      ${bodies.join("\n")}
  </div>
</div>
${tabs.body}
`,
    eventListeners: eventHandlers,
  };
}
