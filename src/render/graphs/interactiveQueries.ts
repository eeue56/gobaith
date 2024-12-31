import {
  Comparison,
  COMPARISONS,
  Duration,
  Filter,
  hashQuery,
  Query,
  runDurationQuery,
  runQuery,
} from "../../logic/query";
import {
  AppState,
  dontSend,
  JournalEntry,
  MOOD_VALUES,
  MoodValue,
  Prompt,
  PROMPTS,
  RenderedWithEvents,
  sendUpdate,
  Sent,
  Settings,
} from "../../types";
import { renderer } from "../../utils/render";

function renderComparisonChoice(
  comparison: Comparison,
  activeComparison: Comparison
): string {
  const selectedText = comparison === activeComparison ? "selected" : "";
  return `<option value="${comparison.kind}" ${selectedText}>${comparison.kind}</option>`;
}

function renderMoodValueChoice(
  value: MoodValue,
  activeValue: MoodValue
): string {
  const selectedText = value === activeValue ? "selected" : "";
  return `<option value="${value}" ${selectedText}>${value}</option>`;
}

function renderPromptChoice(prompt: Prompt, activePrompt: Prompt): string {
  const selectedText = prompt === activePrompt ? "selected" : "";
  return `<option value="${prompt}" ${selectedText}>${prompt}</option>`;
}

function renderComparisonChoices(
  activeComparison: Comparison
): RenderedWithEvents {
  const choices = COMPARISONS.map((comparison) =>
    renderComparisonChoice(comparison, activeComparison)
  ).join("\n");

  return {
    body: `
      <div class="pure-g">
          <div class="pure-u-1-5"></div>
          <select class="pure-u-3-5" id='comparison-selection'>
              ${choices}
          </select>
          <div class="pure-u-1-5"></div>
      </div>
      `,
    eventListeners: [],
  };
}

function renderMoodValueChoices(
  activeMoodValue: MoodValue
): RenderedWithEvents {
  const choices = MOOD_VALUES.map((moodValue) =>
    renderMoodValueChoice(moodValue, activeMoodValue)
  ).join("\n");

  return {
    body: `
        <div class="pure-g">
            <div class="pure-u-1-5"></div>
            <select class="pure-u-3-5" id='mood-value-selection'>
                ${choices}
            </select>
            <div class="pure-u-1-5"></div>
        </div>
        `,
    eventListeners: [],
  };
}

function renderPromptChoices(activePrompt: Prompt): RenderedWithEvents {
  const choices = PROMPTS.map((key) =>
    renderPromptChoice(key, activePrompt)
  ).join("\n");

  return {
    body: `
    <div class="pure-g">
        <div class="pure-u-1-5"></div>
        <select class="pure-u-3-5" id='prompt-selection'>
            ${choices}
        </select>
        <div class="pure-u-1-5"></div>
    </div>
    `,
    eventListeners: [],
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
  queryHash: string
): RenderedWithEvents {
  const id = `${queryHash}-duration-day-selector`;
  return {
    body: `
<div class="day-selector">
  <form onsubmit="return false">
    <input id="${id}" type="number" value="${days.toString()}"/>
  </form>
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
            hash: queryHash,
            duration: value,
          });
        },
      },
    ],
  };
}

function renderFilterBuilder(
  query: Filter,
  queryHash: string
): RenderedWithEvents {
  return renderer`
${renderPromptChoices(query.prompt)}
${renderComparisonChoices(query.comparison)}
${renderMoodValueChoices(query.value)}
  `;
}

function renderDurationBuilder(
  query: Duration,
  queryHash: string
): RenderedWithEvents {
  return renderer`
${renderDurationDaySelector(query.days, queryHash)}
${renderComparisonChoices(query.comparison)}
${renderQueryBuilder(query.query)}
  `;
}

function renderQueryBuilder(query: Query | Duration): RenderedWithEvents {
  const queryHash = hashQuery(query);

  switch (query.kind) {
    case "And":
    case "Or":
    case "Not":
      return renderer``;
    case "Filter": {
      return renderFilterBuilder(query, queryHash);
    }
    case "Duration": {
      return renderDurationBuilder(query, queryHash);
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
  return `<div>${entries.length} days</div>`;
}

function renderPeriods(periods: JournalEntry[][]): string {
  return periods.map(renderPeriod).join("\n");
}

export function renderInteractiveQueries(
  state: AppState,
  settings: Settings
): RenderedWithEvents {
  const results: RenderedWithEvents[] = [];

  for (const query of settings.queries) {
    switch (query.kind) {
      case "And":
      case "Or":
      case "Not":
      case "Filter": {
        const days = runQuery(query, state.journalEntries).length;
        results.push(renderer`
<div>
    <div>${renderQueryExplaination(query)}</div>
    <div>Results in: ${days} days</div>
</div>`);
        break;
      }
      case "Duration": {
        results.push(renderer`<div>
    <div>${renderQueryExplaination(query)}</div>
    <div>Results in: ${renderPeriods(
      runDurationQuery(query, state.journalEntries)
    )}</div>
</div>`);
        break;
      }
    }
  }

  return {
    body: results.map((result) => result.body).join(""),
    eventListeners: results.map((result) => result.eventListeners).flat(),
  };
}
