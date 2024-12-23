import {
  And,
  Comparison,
  COMPARISONS,
  Duration,
  EqualTo,
  Filter,
  MoreThan,
  Or,
  Query,
  runDurationQuery,
  runQuery,
} from "../../logic/query";
import {
  Day,
  JournalEntry,
  MOOD_VALUES,
  MoodValue,
  Prompt,
  PROMPTS,
  RenderedWithEvents,
} from "../../types";

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

export function renderQueryBuilder(query: Query | Duration): string {
  switch (query.kind) {
    case "And": {
      const leftInner = renderQueryBuilder(query.left);
      const left = isANestedQuery(query.left)
        ? `(${leftInner})`
        : `${leftInner}`;

      const rightInner = renderQueryBuilder(query.right);
      const right = isANestedQuery(query.right)
        ? `(${rightInner})`
        : `${rightInner}`;

      return `${left} AND ${right}`;
    }
    case "Or": {
      const leftInner = renderQueryBuilder(query.left);
      const left = isANestedQuery(query.left)
        ? `(${leftInner})`
        : `${leftInner}`;

      const rightInner = renderQueryBuilder(query.right);
      const right = isANestedQuery(query.right)
        ? `(${rightInner})`
        : `${rightInner}`;
      return `${left} OR ${right}`;
    }
    case "Not": {
      return `NOT ${renderQueryBuilder(query.query)}`;
    }
    case "Filter": {
      return `${query.prompt} ${query.comparison.kind} ${query.value}`;
    }
    case "Duration": {
      return `${renderQueryBuilder(query.query)} for ${query.comparison.kind} ${
        query.days
      } days`;
    }
  }
}

const depressedDaysWithoutElevationQuery = And(
  Filter(MoreThan, 1, "Today's feelings of depression"),
  Filter(EqualTo, 1, "Today's feelings of elevation")
);

const possiblyHarmfulManicDays = And(
  Filter(MoreThan, 2, "Today's feelings of elevation"),
  Or(
    Filter(MoreThan, 1, "Today's feelings of irritableness"),
    Filter(MoreThan, 1, "Today's psychotic symptoms")
  )
);

const hypomania = Duration(
  And(
    Or(
      Filter(MoreThan, 1, "Today's feelings of elevation"),
      Filter(MoreThan, 1, "Today's feelings of irritableness")
    ),
    Filter(EqualTo, 1, "Today's psychotic symptoms")
  ),
  3,
  MoreThan
);

const mania = Duration(
  Or(
    Filter(MoreThan, 2, "Today's feelings of elevation"),
    Filter(MoreThan, 2, "Today's feelings of irritableness")
  ),
  6,
  MoreThan
);

const psychosis = Duration(
  Filter(MoreThan, 2, "Today's psychotic symptoms"),
  30,
  MoreThan
);

const depression = Duration(
  Filter(MoreThan, 1, "Today's feelings of depression"),
  14,
  MoreThan
);

function renderPeriod(entries: JournalEntry[]): string {
  return `<div>${entries.length} days</div>`;
}

function renderPeriods(periods: JournalEntry[][]): string {
  return periods.map(renderPeriod).join("\n");
}

export function renderInteractiveQueries(
  today: Day,
  entries: JournalEntry[]
): RenderedWithEvents {
  const hypomaniaPeriods = runDurationQuery(hypomania, entries);
  const maniaPeriods = runDurationQuery(mania, entries);
  const psychosisPeriods = runDurationQuery(psychosis, entries);
  const depressionPeriods = runDurationQuery(depression, entries);

  return {
    body: `
<div>
    <div>${renderQueryBuilder(depressedDaysWithoutElevationQuery)}</div>
    <div>Results in: ${
      runQuery(depressedDaysWithoutElevationQuery, entries).length
    } days</div>
</div>
<div>
    <div>${renderQueryBuilder(possiblyHarmfulManicDays)}</div>
    <div>Results in: ${
      runQuery(possiblyHarmfulManicDays, entries).length
    } days</div>
</div>
<div>
    <div>${renderQueryBuilder(hypomania)}</div>
    <div>Results in: ${renderPeriods(hypomaniaPeriods)}</div>
</div>
<div>
    <div>${renderQueryBuilder(mania)}</div>
    <div>Results in: ${renderPeriods(maniaPeriods)}</div>
</div>
<div>
    <div>${renderQueryBuilder(psychosis)}</div>
    <div>Results in: ${renderPeriods(psychosisPeriods)}</div>
</div>
<div>
    <div>${renderQueryBuilder(depression)}</div>
    <div>Results in: ${renderPeriods(depressionPeriods)}</div>
</div>
    `,
    eventListeners: [],
  };
}
