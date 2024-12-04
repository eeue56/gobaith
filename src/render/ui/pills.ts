import {
  Direction,
  dontSend,
  EventHandler,
  JournalEntry,
  PillOrderDirection,
  Renderer,
  sendUpdate,
  Sent,
  Settings,
} from "../../types";
import { dayToString } from "../../utils/dates";
import { idHash } from "../../utils/render";

// todo: pick this up dynamically
const IS_MOBILE = false;

export function renderPill(entry: JournalEntry, pill: string): Renderer {
  const uniquePillGroupId = "pill-" + dayToString(entry.day) + idHash(pill);
  const amountTaken = entry.pills[pill];
  const size = IS_MOBILE ? 4 : 6;

  const ids: string[] = [
    `${uniquePillGroupId}-minus`,
    `${uniquePillGroupId}-plus`,
  ];

  function makeCallback(direction: Direction): () => Sent {
    return (): Sent => {
      return sendUpdate({
        kind: "UpdatePillValue",
        pillName: pill,
        entry: entry,
        direction: direction,
      });
    };
  }

  const handlers: EventHandler[] = [
    {
      elementSelector: `#${ids[0]}`,
      eventName: "click",
      callback: makeCallback("Previous"),
    },
    {
      elementSelector: `#${ids[1]}`,
      eventName: "click",
      callback: makeCallback("Next"),
    },
  ];

  return {
    body: `
<div id="${uniquePillGroupId}" class="prompt-group">
    <div class="pure-g">
        <div class="pure-u-1-6"></div>
        <div class="pure-u-1-2 prompt">${pill}:</div>
        <div class="pure-u-1-6"></div>
    </div>
    <div class="pure-button-group" role="group" aria-label="...">
        <div class="pure-u-1-6 prompt-side"></div>
        <button class="pure-button pure-u-1-${size} prompt-answer" id="${ids[0]}">Minus</button>
        <div class="pure-u-1-4 pill-amount-taken">${amountTaken}</div>
        <button class="pure-button pure-u-1-${size} prompt-answer" id="${ids[1]}">Plus</button>
        <div class="pure-u-1-6 prompt-side"></div>
    </div>
</div>
    `,
    eventListeners: handlers,
  };
}

export function renderAddPill(): Renderer {
  return {
    body: `
<div class="pure-g">
    <div class="pure-u-1-3"></div>
    <textarea id="new-pill-entry" class="pure-u-1-3" placeholder="Enter a med name with dosage..."></textarea>
    <button class="pure-button pure-button-primary" id="add-pill">Add</button>
    <div class="pure-u-1-3"></div>
</div>
    `,
    eventListeners: [
      {
        eventName: "click",
        elementSelector: "#add-pill",
        callback: () => updateAddPill(),
      },
    ],
  };
}

function updateAddPill(): Sent {
  const pillEntryElement: HTMLTextAreaElement | null = document.getElementById(
    "new-pill-entry"
  ) as HTMLTextAreaElement | null;

  if (!pillEntryElement) {
    console.error("Couldn't find new-pill-entry");
    return dontSend();
  }
  const pill = pillEntryElement.value;

  return sendUpdate({
    kind: "AddPill",
    pillName: pill,
  });
}

export function renderPillOrder(settings: Settings): Renderer {
  const handlers: EventHandler[] = [];
  const pills = settings.currentPills
    .map((pillName) => {
      const id = `update-pill-order-${idHash(pillName)}`;
      const ids: string[] = [`${id}-top`, `${id}-up`, `${id}-down`];

      function makeCallback(direction: PillOrderDirection): () => Sent {
        return (): Sent => {
          return sendUpdate({
            kind: "UpdatePillOrder",
            pillName: pillName,
            direction: direction,
          });
        };
      }

      const localHandlers: EventHandler[] = [
        {
          elementSelector: `#${ids[0]}`,
          eventName: "click",
          callback: makeCallback("Top"),
        },
        {
          elementSelector: `#${ids[1]}`,
          eventName: "click",
          callback: makeCallback("Up"),
        },
        {
          elementSelector: `#${ids[2]}`,
          eventName: "click",
          callback: makeCallback("Down"),
        },
      ];

      handlers.push(...localHandlers);

      return `
<div class="pure-u-1-3">
    ${pillName}
</div>
<div class="pure-u-2-6"></div>
<div class="pure-u-1-6 pure-button" id="${ids[0]}">Top</div>
<div class="pure-u-1-6 pure-button" id="${ids[1]}">Up</div>
<div class="pure-u-1-6 pure-button" id="${ids[2]}">Down</div>
        `;
    })
    .join("");

  return {
    body: `
<div class="pure-g">
    ${pills}
</div>
    `,
    eventListeners: handlers,
  };
}
