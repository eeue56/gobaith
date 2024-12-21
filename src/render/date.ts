import {
  Day,
  Direction,
  EventHandler,
  RenderedWithEvents,
  sendUpdate,
  Sent,
} from "../types";
import {
  dateToDay,
  dayToString,
  isSameDay,
  numberOfDaysBetween,
} from "../utils/dates";

export function renderDate(today: Day): RenderedWithEvents {
  const daysDiff = numberOfDaysBetween(today, dateToDay(new Date()));
  const isToday = isSameDay(dateToDay(new Date()), today);

  const daysOrDay = Math.abs(daysDiff) === 1 ? "day" : "days";
  const fancyDateExplainer = isToday
    ? "Today"
    : daysDiff < 0
    ? `${-daysDiff} ${daysOrDay} ago`
    : `${daysDiff} ${daysOrDay} ahead`;

  const dayMessage = `<span class="thick">${fancyDateExplainer}</span><br/><small>${dayToString(
    today
  )}</small>`;

  const backToToday = isToday
    ? `<div class="pure-u-1-3 spacer"></div>`
    : `<button title="Return to today's entry" class="pure-button pure-u-1-3" id="reset-day">Back to today</button>`;

  const optionalListeners: EventHandler[] = isToday
    ? []
    : [
        {
          elementId: "reset-day",
          eventName: "click",
          callback: () => resetCurrentDay(),
        },
      ];

  return {
    body: `
<div class="pure-g">
    <div class="pure-u-1-3"></div>
    ${backToToday}
    <div class="pure-u-1-3"></div>
</div>
<div class="pure-g">
    <div class="pure-u-1-3">
        <div class="pure-g">
            <div class="pure-u-1-4"></div>
            <button title="Go to the previous day" class="pure-button pure-u-1-2" id="previous-day">Prev</button>
            <div class="pure-u-1-4"></div>
        </div>
    </div>
    <p class="pure-u-1-3 current-day">${dayMessage}</p>
    <div class="pure-u-1-3">
        <div class="pure-g">
            <div class="pure-u-1-4"></div>
            <button title="Go to the next day" class="pure-button pure-u-1-2" id="next-day">Next</button>
            <div class="pure-u-1-4"></div>
        </div>
    </div>
</div>
`,
    eventListeners: [
      {
        elementId: "previous-day",
        eventName: "click",
        callback: () => updateCurrentDay("Previous"),
      },
      {
        elementId: "next-day",
        eventName: "click",
        callback: () => updateCurrentDay("Next"),
      },
      ...optionalListeners,
    ],
  };
}

function resetCurrentDay(): Sent {
  return sendUpdate({ kind: "ResetCurrentDay" });
}

function updateCurrentDay(direction: Direction): Sent {
  return sendUpdate({ kind: "UpdateCurrentDay", direction: direction });
}
