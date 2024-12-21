import {
  Day,
  dontSend,
  JournalEntry,
  LogEntry,
  Renderer,
  sendUpdate,
  Sent,
} from "../../types";
import { dayToString } from "../../utils/dates";

function renderJournalEntry(log: LogEntry): string {
  return `
<div class="pure-g"/>
  <div class="pure-u-1-5"></div>
  <p class="pure-u-3-5 journal-entry">${log.time} - ${log.text}</p>
  <div class="pure-u-1-5"></div>
</div>
`;
}

export function renderLogs(journalEntry: JournalEntry): Renderer {
  if (journalEntry.logs.length === 0) return { body: "", eventListeners: [] };

  return {
    body:
      `<div class="journal-entries">` +
      journalEntry.logs
        .sort((log: LogEntry) => log.time.valueOf())
        .map(renderJournalEntry)
        .join("\n") +
      `</div>`,
    eventListeners: [],
  };
}

export function renderEnterTimestampMessage(today: Day): Renderer {
  const elementId = `update-journal-${dayToString(today)}`;
  return {
    body: `
<div class="pure-g">
    <div class="pure-u-1-6"></div>
    <form class="pure-form pure-u-2-3" onsubmit="return false;">
        <fieldset class="pure-g">
            <textarea id="new-journal-entry" class="pure-u-4-5" placeholder="Enter a timestamped journal log entry..."></textarea>
            <button title="Save the entry" class="pure-button pure-button-primary pure-u-1-5 save-log-entry-button" id="${elementId}">Save</button>
        </fieldset>
    </form>
    <div class="pure-u-1-6"></div>
</div>
`,
    eventListeners: [
      {
        elementId: elementId,
        eventName: "click",
        callback: () => updateLogEntries(today),
      },
    ],
  };
}

function updateLogEntries(day: Day): Sent {
  const journalEntryElement = document.getElementById(
    "new-journal-entry"
  ) as HTMLTextAreaElement | null;

  if (!journalEntryElement) {
    console.error("Did not find new-journal-entry");
    return dontSend();
  }

  const logEntry = journalEntryElement.value;
  const currentTime = new Date();

  return sendUpdate({
    kind: "AddJournalEntry",
    day: day,
    time: currentTime,
    text: logEntry,
  });
}
