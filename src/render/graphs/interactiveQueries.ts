import {
  COMBINE_QUERIES,
  CombineQueryKind,
  Comparison,
  COMPARISONS,
  Duration,
  Filter,
  isCombineQueryKind,
  isComparison,
  pathToKey,
  Query,
  QueryPath,
  runDurationQuery,
  runQuery,
} from "../../logic/query";
import {
  AppState,
  dontSend,
  isMoodValue,
  isPrompt,
  JournalEntry,
  MOOD_VALUES,
  moodStateFromValue,
  MoodValue,
  Prompt,
  PROMPTS,
  RenderedWithEvents,
  sendUpdate,
  Sent,
  Settings,
} from "../../types";
import { dayToString } from "../../utils/dates";
import { renderer } from "../../utils/render";

function renderComparisonChoice(
  comparison: Comparison,
  activeComparison: Comparison
): string {
  const selectedText =
    comparison.kind === activeComparison.kind ? "selected" : "";
  return `<option value="${comparison.kind}" ${selectedText}>${comparison.kind}</option>`;
}

function renderMoodValueChoice(
  value: MoodValue,
  activeValue: MoodValue
): string {
  const selectedText = value === activeValue ? "selected" : "";
  return `<option value="${value}" ${selectedText}>${moodStateFromValue(
    value
  )}</option>`;
}

function renderPromptChoice(prompt: Prompt, activePrompt: Prompt): string {
  const selectedText = prompt === activePrompt ? "selected" : "";
  return `<option value="${prompt}" ${selectedText}>${prompt}</option>`;
}

function renderComparisonChoices(
  activeComparison: Comparison,
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  const choices = COMPARISONS.map((comparison) =>
    renderComparisonChoice(comparison, activeComparison)
  ).join("\n");

  const id = `${pathToKey(index, path)}-comparison-choice`;

  return {
    body: `
      <div class="pure-g">
          <div class="pure-u-1-5"></div>
          <select class="pure-u-3-5" id='${id}'>
              ${choices}
          </select>
          <div class="pure-u-1-5"></div>
      </div>
      `,
    eventListeners: [
      {
        elementId: id,
        eventName: "change",
        callback: (event: Event): Sent => {
          if (!event.target) {
            return dontSend();
          }
          const value = (event.target as HTMLInputElement).value;
          const comparison = { kind: value };
          if (!isComparison(comparison)) {
            console.error("Invalid comparison", value);
            return dontSend();
          }
          return sendUpdate({
            kind: "SetComparisonChoice",
            index,
            path,
            comparison,
          });
        },
      },
    ],
  };
}

function renderMoodValueChoices(
  activeMoodValue: MoodValue,
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  const choices = MOOD_VALUES.map((moodValue) =>
    renderMoodValueChoice(moodValue, activeMoodValue)
  ).join("\n");

  const id = `${pathToKey(index, path)}-mood-value-selection`;

  return {
    body: `
        <div class="pure-g">
            <div class="pure-u-1-5"></div>
            <select class="pure-u-3-5" id='${id}'>
                ${choices}
            </select>
            <div class="pure-u-1-5"></div>
        </div>
        `,
    eventListeners: [
      {
        elementId: id,
        eventName: "change",
        callback: (event: Event): Sent => {
          if (!event.target) {
            return dontSend();
          }
          const value = parseInt((event.target as HTMLInputElement).value);
          if (!isMoodValue(value)) {
            console.error("Invalid mood value", value);
            return dontSend();
          }
          return sendUpdate({
            kind: "SetMoodValueChoice",
            index,
            path,
            moodValue: value,
          });
        },
      },
    ],
  };
}

function renderPromptChoices(
  activePrompt: Prompt,
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  const choices = PROMPTS.map((key) =>
    renderPromptChoice(key, activePrompt)
  ).join("\n");

  const id = `${pathToKey(index, path)}-prompt-selection`;

  return {
    body: `
    <div class="pure-g">
        <div class="pure-u-1-5"></div>
        <select class="pure-u-3-5" id='${id}'>
            ${choices}
        </select>
        <div class="pure-u-1-5"></div>
    </div>
    `,
    eventListeners: [
      {
        elementId: id,
        eventName: "change",
        callback: (event: Event): Sent => {
          if (!event.target) {
            return dontSend();
          }
          const value = (event.target as HTMLInputElement).value;
          if (!isPrompt(value)) {
            console.error("Invalid prompt", value);
            return dontSend();
          }
          return sendUpdate({
            kind: "SetPromptChoice",
            index,
            path,
            prompt: value,
          });
        },
      },
    ],
  };
}

function isANestedQuery(query: Query): boolean {
  switch (query.kind) {
    case "And":
      return true;
    case "Or":
      return true;
    case "Not":
      return false;
    case "Filter":
      return false;
  }
}

function renderDurationDaySelector(
  days: number,
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  const id = `${pathToKey(index, path)}-duration-day-selector`;
  return {
    body: `
<div class="pure-g day-selector">
  <div class="pure-u-1-5"></div>
  <form class="pure-u-3-5 day-selector-form" onsubmit="return false">
    <div class="pure-g">
      <input class="pure-u-4-5" id="${id}" type="number" name="days" value="${days.toString()}"/>
      <label class="pure-u-1-5" for="${id}">Days</label>
    </div>
  </form>
  <div class="pure-u-1-5"></div>
</div>`,
    eventListeners: [
      {
        elementId: id,
        eventName: "change",
        callback: (event: Event): Sent => {
          if (!event.target) {
            return dontSend();
          }
          const value = parseInt((event.target as HTMLInputElement).value);
          return sendUpdate({
            kind: "SetQueryDuration",
            index,
            path,
            duration: value,
          });
        },
      },
    ],
  };
}

function renderRemoveQueryButton(
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  const id = `${pathToKey(index, path)}-remove-query-button`;
  return {
    body: `
<div class="pure-u-3-5">
  <div class="pure-u-1-3"></div>
  <div class="pure-u-1-3">
    <button id="${id}">Delete query</button>
  </div>
  <div class="pure-u-1-3"></div>
</div>
`,
    eventListeners: [
      {
        elementId: id,
        eventName: "click",
        callback: (): Sent => {
          return sendUpdate({
            kind: "DeleteQuery",
            index,
            path,
          });
        },
      },
    ],
  };
}

function renderFilterBuilder(
  query: Filter,
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  return renderer`
${renderPromptChoices(query.prompt, index, path)}
${renderComparisonChoices(query.comparison, index, path)}
${renderMoodValueChoices(query.value, index, path)}
  `;
}

function renderDurationBuilder(
  query: Duration,
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  return renderer`
${renderComparisonChoices(query.comparison, index, path)}
${renderDurationDaySelector(query.days, index, path)}
${renderQueryBuilder(query.query, index, [...path, "DirectChild"])}
  `;
}

function renderAndOrNotChoice(
  combineQuery: CombineQueryKind,
  activeCombineQuery: CombineQueryKind
): string {
  const selectedText = combineQuery === activeCombineQuery ? "selected" : "";
  return `<option value="${combineQuery}" ${selectedText}>${combineQuery}</option>`;
}

function renderAndOrNotChoices(
  activeCombineQuery: CombineQueryKind,
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  const choices = COMBINE_QUERIES.map((combineQuery) =>
    renderAndOrNotChoice(combineQuery, activeCombineQuery)
  ).join("\n");

  const id = `${pathToKey(index, path)}-combine-query-choice`;

  return {
    body: `
      <div class="pure-g">
          <div class="pure-u-1-5"></div>
          <select class="pure-u-3-5" id='${id}'>
              ${choices}
          </select>
          <div class="pure-u-1-5"></div>
      </div>
      `,
    eventListeners: [
      {
        elementId: id,
        eventName: "change",
        callback: (event: Event): Sent => {
          if (!event.target) {
            return dontSend();
          }
          const combineQuery = (event.target as HTMLInputElement).value;
          if (!isCombineQueryKind(combineQuery)) {
            console.error("Invalid combine query", combineQuery);
            return dontSend();
          }
          return sendUpdate({
            kind: "SetCombineQuery",
            index,
            path,
            combineQueryKind: combineQuery,
          });
        },
      },
    ],
  };
}

function renderQueryBuilder(
  query: Query | Duration,
  index: number,
  path: QueryPath[]
): RenderedWithEvents {
  switch (query.kind) {
    case "And": {
      return renderer`
<div class="indent">${renderQueryBuilder(query.left, index, [
        ...path,
        "Left",
      ])}</div>
<div>${renderAndOrNotChoices("And", index, path)}</div>
<div class="indent">${renderQueryBuilder(query.right, index, [
        ...path,
        "Right",
      ])}</div>
`;
    }
    case "Or": {
      return renderer`
<div class="indent">${renderQueryBuilder(query.left, index, [
        ...path,
        "Left",
      ])}</div>
<div>${renderAndOrNotChoices("Or", index, path)}</div>
<div class="indent">${renderQueryBuilder(query.right, index, [
        ...path,
        "Right",
      ])}</div>
`;
    }
    case "Not": {
      return renderer`
<div>${renderAndOrNotChoices("Not", index, path)}</div>
<div class="indent">${renderQueryBuilder(query.query, index, [
        ...path,
        "DirectChild",
      ])}</div>
`;
    }
    case "Filter": {
      return renderFilterBuilder(query, index, path);
    }
    case "Duration": {
      return renderDurationBuilder(query, index, path);
    }
  }
}

export function renderQueryExplaination(query: Query | Duration): string {
  switch (query.kind) {
    case "And": {
      const leftInner = renderQueryExplaination(query.left);
      const left = isANestedQuery(query.left)
        ? `(${leftInner})`
        : `${leftInner}`;

      const rightInner = renderQueryExplaination(query.right);
      const right = isANestedQuery(query.right)
        ? `(${rightInner})`
        : `${rightInner}`;

      return `${left} AND ${right}`;
    }
    case "Or": {
      const leftInner = renderQueryExplaination(query.left);
      const left = isANestedQuery(query.left)
        ? `(${leftInner})`
        : `${leftInner}`;

      const rightInner = renderQueryExplaination(query.right);
      const right = isANestedQuery(query.right)
        ? `(${rightInner})`
        : `${rightInner}`;
      return `${left} OR ${right}`;
    }
    case "Not": {
      return `NOT ${renderQueryExplaination(query.query)}`;
    }
    case "Filter": {
      return `${query.prompt} ${query.comparison.kind} ${query.value}`;
    }
    case "Duration": {
      return `${renderQueryExplaination(query.query)} for ${
        query.comparison.kind
      } ${query.days} days`;
    }
  }
}

function renderPeriod(entries: JournalEntry[]): string {
  const earliestDay = entries[0];
  const latestDay = entries[entries.length - 1];
  return `<div>A period of ${entries.length} days, from ${dayToString(
    earliestDay.day
  )} to ${dayToString(latestDay.day)}</div>`;
}

function renderPeriods(periods: JournalEntry[][]): string {
  if (periods.length === 0) {
    return "No matching periods.";
  }
  return periods.map(renderPeriod).join("\n");
}

function renderAddDurationQueryButton(): RenderedWithEvents {
  const id = "add-duration-query";
  return {
    body: `
<div class="pure-u-1-5">
  <button id="${id}">Add new duration query</button>
</div>
    `,
    eventListeners: [
      {
        elementId: id,
        eventName: "click",
        callback: (): Sent => {
          return sendUpdate({
            kind: "AddNewDurationQuery",
          });
        },
      },
    ],
  };
}

function renderAddFilterQueryButton(): RenderedWithEvents {
  const id = "add-filter-query";
  return {
    body: `
<div class="pure-u-1-5">
  <button id="${id}">Add new filter query</button>
</div>
    `,
    eventListeners: [
      {
        elementId: id,
        eventName: "click",
        callback: (): Sent => {
          return sendUpdate({
            kind: "AddNewFilterQuery",
          });
        },
      },
    ],
  };
}

function renderInteractiveFilterQuery(
  query: Query,
  index: number,
  state: AppState
): RenderedWithEvents {
  const path: QueryPath[] = [];

  const days = runQuery(query, state.journalEntries).length;
  return renderer`
<div class="filter-query">
  <div>${renderQueryBuilder(query, index, [])}</div>
  <div class="pure-g">
    <div class="pure-u-1-5"></div>
    <div class="pure-u-3-5 filter-query-result">A total of <strong>${days} days</strong></div>
    <div class="pure-u-1-5"></div>
  </div>
  <div class="pure-g">
    <div class="pure-u-1-5"></div>
    ${renderRemoveQueryButton(index, path)}
    <div class="pure-u-1-5"></div>
  </div>
</div>`;
}

function renderInteractiveDuplicationQuery(
  query: Duration,
  index: number,
  state: AppState
): RenderedWithEvents {
  const path: QueryPath[] = [];
  const periods = renderPeriods(runDurationQuery(query, state.journalEntries));

  return renderer`
<div class="duration-query">
  <div>${renderQueryBuilder(query, index, [])}</div>
  <div class="pure-g">
    <div class="pure-u-1-5"></div>
    <div class="pure-u-3-5 duration-query-result">Matching periods: <strong> ${periods}</strong></div>
    <div class="pure-u-1-5"></div>
  </div>
  <div class="pure-g">
    <div class="pure-u-1-5"></div>
    ${renderRemoveQueryButton(index, path)}
    <div class="pure-u-1-5"></div>
  </div>
</div>`;
}

export function renderInteractiveQueries(
  state: AppState,
  settings: Settings
): RenderedWithEvents {
  const results: RenderedWithEvents[] = [];

  let index: number = 0;

  results.push(renderer`
<div class="pure-g add-query-buttons">
  <div class="pure-u-1-5"></div>
  ${renderAddFilterQueryButton()}
  <div class="pure-u-1-5"></div>
  ${renderAddDurationQueryButton()}
  <div class="pure-u-1-5"></div>
</div>`);

  for (const query of settings.queries) {
    switch (query.kind) {
      case "And":
      case "Or":
      case "Not":
      case "Filter": {
        results.push(renderInteractiveFilterQuery(query, index, state));
        break;
      }
      case "Duration": {
        results.push(renderInteractiveDuplicationQuery(query, index, state));
        break;
      }
    }

    index++;
  }

  return {
    body: results.map((result) => result.body).join(""),
    eventListeners: results.map((result) => result.eventListeners).flat(),
  };
}
