import {
  attribute,
  booleanAttribute,
  button,
  class_,
  div,
  form,
  HtmlNode,
  input,
  label,
  on,
  option,
  select,
  strong,
  text,
} from "@eeue56/coed";
import { pathToKey, runDurationQuery, runQuery } from "../../logic/query";
import {
  COMBINE_QUERIES,
  CombineQueryKind,
  Comparison,
  COMPARISONS,
  Duration,
  Filter,
  isCombineQueryKind,
  isComparison,
  Query,
  QueryPath,
} from "../../logic/query/types";
import {
  AppState,
  dontSend,
  isMoodValue,
  isPrompt,
  JournalEntry,
  LocalState,
  MOOD_VALUES,
  moodStateFromValue,
  MoodValue,
  Prompt,
  PROMPTS,
  Settings,
  Update,
} from "../../types";
import { dayToString } from "../../utils/dates";
import { iconDelete } from "../ui/icons";
import { getPromptColor, getPromptColorHex } from "../../utils/colors";

/**
 * Calculate relative luminance of a hex color
 * Returns a value between 0 (darkest) and 1 (brightest)
 */
function getColorLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Get appropriate text color (white or black) based on background color
 * Uses WCAG contrast guidelines
 */
function getContrastTextColor(backgroundColor: string): string {
  const luminance = getColorLuminance(backgroundColor);
  // Use white text for dark backgrounds, black for light backgrounds
  // WCAG recommends threshold at 0.179 for optimal contrast
  // This corresponds to approximately #808080 gray
  return luminance > 0.179 ? '#000' : '#fff';
}

/**
 * Extract all unique prompts from a query
 */
function extractPromptsFromQuery(query: Query | Duration): Prompt[] {
  const prompts: Prompt[] = [];
  
  function extractFromQuery(q: Query | Duration): void {
    switch (q.kind) {
      case "And":
      case "Or":
        extractFromQuery(q.left);
        extractFromQuery(q.right);
        break;
      case "Not":
        extractFromQuery(q.query);
        break;
      case "Filter":
        if (!prompts.includes(q.prompt)) {
          prompts.push(q.prompt);
        }
        break;
      case "Duration":
        extractFromQuery(q.query);
        break;
    }
  }
  
  extractFromQuery(query);
  return prompts;
}

/**
 * Generate a CSS gradient from prompt colors
 */
function generatePromptGradient(prompts: Prompt[]): string {
  if (prompts.length === 0) {
    return "var(--pico-primary)";
  }
  
  if (prompts.length === 1) {
    return getPromptColor(prompts[0]);
  }
  
  const colors = prompts.map(p => getPromptColor(p));
  return `linear-gradient(90deg, ${colors.join(", ")})`;
}

function renderComparisonChoice(
  comparison: Comparison,
  activeComparison: Comparison
): HtmlNode<never> {
  return option(
    [],
    [
      attribute("value", comparison.kind),
      booleanAttribute("selected", comparison.kind === activeComparison.kind),
    ],
    [text(comparison.kind)]
  );
}

function renderMoodValueChoice(
  value: MoodValue,
  activeValue: MoodValue,
  prompt: Prompt
): HtmlNode<never> {
  const backgroundColor = getPromptColorHex(prompt, value);
  const textColor = getContrastTextColor(backgroundColor);
  return option(
    [],
    [
      attribute("value", value.toString()),
      booleanAttribute("selected", value === activeValue),
      attribute("style", `background-color: ${backgroundColor}; color: ${textColor};`),
    ],
    [text(moodStateFromValue(value))]
  );
}

function renderPromptChoice(
  prompt: Prompt,
  activePrompt: Prompt
): HtmlNode<never> {
  const backgroundColor = getPromptColor(prompt);
  const textColor = getContrastTextColor(backgroundColor);
  return option(
    [],
    [
      attribute("value", prompt),
      booleanAttribute("selected", prompt === activePrompt),
      attribute("style", `background-color: ${backgroundColor}; color: ${textColor};`),
    ],
    [text(prompt)]
  );
}

function renderComparisonChoices(
  activeComparison: Comparison,
  index: number,
  path: QueryPath[]
): HtmlNode<Update> {
  const choices = COMPARISONS.map((comparison) =>
    renderComparisonChoice(comparison, activeComparison)
  );

  return div(
    [],
    [],
    [
      select(
        [
          on("change", (event: Event): Update => {
            if (!event.target) {
              return dontSend();
            }
            const value = (event.target as HTMLInputElement).value;
            const comparison = { kind: value };
            if (!isComparison(comparison)) {
              console.error("Invalid comparison", value);
              return dontSend();
            }
            return {
              kind: "SetComparisonChoice",
              index,
              path,
              comparison,
            };
          }),
        ],
        [],
        choices
      ),
    ]
  );
}

function renderMoodValueChoices(
  activeMoodValue: MoodValue,
  prompt: Prompt,
  index: number,
  path: QueryPath[]
): HtmlNode<Update> {
  const choices = MOOD_VALUES.map((moodValue) =>
    renderMoodValueChoice(moodValue, activeMoodValue, prompt)
  );
  const selectBackgroundColor = getPromptColorHex(prompt, activeMoodValue);
  const selectTextColor = getContrastTextColor(selectBackgroundColor);
  return div(
    [],
    [],
    [
      select(
        [
          on("change", (event: Event): Update => {
            if (!event.target) {
              return dontSend();
            }
            const value = parseInt((event.target as HTMLInputElement).value);
            if (!isMoodValue(value)) {
              console.error("Invalid mood value", value);
              return dontSend();
            }
            return {
              kind: "SetMoodValueChoice",
              index,
              path,
              moodValue: value,
            };
          }),
        ],
        [attribute("style", `background-color: ${selectBackgroundColor}; color: ${selectTextColor};`)],
        choices
      ),
    ]
  );
}

function renderPromptChoices(
  activePrompt: Prompt,
  index: number,
  path: QueryPath[]
): HtmlNode<Update> {
  const choices = PROMPTS.map((key) => renderPromptChoice(key, activePrompt));
  const selectBackgroundColor = getPromptColor(activePrompt);
  const selectTextColor = getContrastTextColor(selectBackgroundColor);
  return div(
    [],
    [],
    [
      select(
        [
          on("change", (event: Event): Update => {
            if (!event.target) {
              return dontSend();
            }
            const value = (event.target as HTMLInputElement).value;
            if (!isPrompt(value)) {
              console.error("Invalid prompt", value);
              return dontSend();
            }
            return {
              kind: "SetPromptChoice",
              index,
              path,
              prompt: value,
            };
          }),
        ],
        [attribute("style", `background-color: ${selectBackgroundColor}; color: ${selectTextColor};`)],
        choices
      ),
    ]
  );
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
): HtmlNode<Update> {
  const id = `${pathToKey(index, path)}-duration-day-selector`;
  return div(
    [],
    [class_("day-selector")],
    [
      form(
        [],
        [class_("day-selector-form")],
        [
          input(
            [
              on("change", (event: Event): Update => {
                if (!event.target) {
                  return dontSend();
                }
                const value = parseInt(
                  (event.target as HTMLInputElement).value
                );
                return {
                  kind: "SetQueryDuration",
                  index,
                  path,
                  duration: value,
                };
              }),
            ],
            [
              attribute("id", id),
              attribute("type", "number"),
              attribute("name", "days"),
              attribute("value", days.toString()),
            ]
          ),
          label([], [attribute("for", id)], [text("Days")]),
        ]
      ),
    ]
  );
}

function renderRemoveQueryButton(
  index: number,
  path: QueryPath[]
): HtmlNode<Update> {
  return div(
    [],
    [],
    [
      button(
        [
          on("click", (): Update => {
            return {
              kind: "DeleteQuery",
              index,
              path,
            };
          }),
        ],
        [],
        [text("Delete query"), iconDelete]
      ),
    ]
  );
}

function renderFilterBuilder(
  query: Filter,
  index: number,
  path: QueryPath[]
): HtmlNode<Update> {
  return div(
    [],
    [class_("filter-builder")],
    [
      renderPromptChoices(query.prompt, index, path),
      renderComparisonChoices(query.comparison, index, path),
      renderMoodValueChoices(query.value, query.prompt, index, path),
    ]
  );
}

function renderDurationBuilder(
  query: Duration,
  index: number,
  path: QueryPath[]
): HtmlNode<Update> {
  return div(
    [],
    [class_("duration-builder")],
    [
      renderComparisonChoices(query.comparison, index, path),
      renderDurationDaySelector(query.days, index, path),
      renderQueryBuilder(query.query, index, [...path, "DirectChild"]),
    ]
  );
}

function renderAndOrNotChoice(
  combineQuery: CombineQueryKind,
  activeCombineQuery: CombineQueryKind
): HtmlNode<never> {
  return option(
    [],
    [
      attribute("value", combineQuery),
      booleanAttribute("selected", combineQuery === activeCombineQuery),
    ],
    [text(combineQuery)]
  );
}

function renderAndOrNotChoices(
  activeCombineQuery: CombineQueryKind,
  index: number,
  path: QueryPath[]
): HtmlNode<Update> {
  const choices = COMBINE_QUERIES.map((combineQuery) =>
    renderAndOrNotChoice(combineQuery, activeCombineQuery)
  );

  return div(
    [],
    [],
    [
      select(
        [
          on("change", (event: Event): Update => {
            if (!event.target) {
              return dontSend();
            }
            const combineQuery = (event.target as HTMLInputElement).value;
            if (!isCombineQueryKind(combineQuery)) {
              console.error("Invalid combine query", combineQuery);
              return dontSend();
            }
            return {
              kind: "SetCombineQuery",
              index,
              path,
              combineQueryKind: combineQuery,
            };
          }),
        ],
        [],
        choices
      ),
    ]
  );
}

function renderQueryBuilder(
  query: Query | Duration,
  index: number,
  path: QueryPath[]
): HtmlNode<Update> {
  switch (query.kind) {
    case "And": {
      return div(
        [],
        [],
        [
          div(
            [],
            [class_("indent")],
            [renderQueryBuilder(query.left, index, [...path, "Left"])]
          ),
          div([], [], [renderAndOrNotChoices("And", index, path)]),
          div(
            [],
            [class_("indent")],
            [renderQueryBuilder(query.right, index, [...path, "Right"])]
          ),
        ]
      );
    }
    case "Or": {
      return div(
        [],
        [],
        [
          div(
            [],
            [class_("indent")],
            [renderQueryBuilder(query.left, index, [...path, "Left"])]
          ),
          div([], [], [renderAndOrNotChoices("Or", index, path)]),
          div(
            [],
            [class_("indent")],
            [renderQueryBuilder(query.right, index, [...path, "Right"])]
          ),
        ]
      );
    }
    case "Not": {
      return div(
        [],
        [],
        [
          div([], [], [renderAndOrNotChoices("Not", index, path)]),
          div(
            [],
            [class_("indent")],
            [renderQueryBuilder(query.query, index, [...path, "DirectChild"])]
          ),
        ]
      );
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

function renderPeriod(entries: JournalEntry[], prompts: Prompt[]): HtmlNode<never> {
  const earliestDay = entries[0];
  const latestDay = entries[entries.length - 1];
  const borderColor = prompts.length > 0 ? getPromptColor(prompts[0]) : "var(--pico-primary-background)";
  return div(
    [],
    [class_("period-item"), attribute("style", `border-left-color: ${borderColor}`)],
    [
      div(
        [],
        [class_("period-duration")],
        [text(`${entries.length} days`)]
      ),
      div(
        [],
        [class_("period-dates")],
        [
          text(
            `${dayToString(earliestDay.day)} to ${dayToString(latestDay.day)}`
          ),
        ]
      ),
    ]
  );
}

function renderPeriods(periods: JournalEntry[][], prompts: Prompt[]): HtmlNode<never> {
  if (periods.length === 0) {
    return div([], [class_("no-periods")], [text("No matching periods found.")]);
  }
  return div([], [class_("periods-list")], periods.map(p => renderPeriod(p, prompts)));
}

function renderAddDurationQueryButton(): HtmlNode<Update> {
  return div(
    [],
    [],
    [
      button(
        [
          on("click", (): Update => {
            return {
              kind: "AddNewDurationQuery",
            };
          }),
        ],
        [attribute("id", "add-duration-query")],
        [text("Add new duration query")]
      ),
    ]
  );
}

function renderAddFilterQueryButton(): HtmlNode<Update> {
  return div(
    [],
    [],
    [
      button(
        [
          on("click", (): Update => {
            return {
              kind: "AddNewFilterQuery",
            };
          }),
        ],
        [attribute("id", "add-filter-query")],
        [text("Add new filter query")]
      ),
    ]
  );
}

function renderQueryHeader(
  index: number,
  queryType: string,
  prompts: Prompt[]
): HtmlNode<Update> {
  const gradient = generatePromptGradient(prompts);
  return div(
    [],
    [class_("query-header"), attribute("style", `border-left: 4px solid; border-image: ${gradient} 1;`)],
    [
      div([], [class_("query-title")], [text(`Query #${index + 1} (${queryType})`)]),
      div([], [class_("query-controls")], [])
    ]
  );
}

function renderResultVisualization(
  days: number,
  totalDays: number,
  prompts: Prompt[]
): HtmlNode<never> {
  const percentage = totalDays > 0 ? Math.min((days / totalDays) * 100, 100) : 0;
  const gradient = generatePromptGradient(prompts);
  return div(
    [],
    [class_("result-visualization")],
    [
      div(
        [],
        [class_("result-bar"), attribute("style", `width: ${percentage}%; background: ${gradient}`)],
        []
      ),
    ]
  );
}

function renderInteractiveFilterQuery(
  query: Query,
  index: number,
  state: AppState
): HtmlNode<Update> {
  const path: QueryPath[] = [];

  const days = runQuery(query, state.journalEntries).length;
  const totalDays = state.journalEntries.length;
  const id = `${pathToKey(index, path)}-interactive-filter`;
  const explanation = renderQueryExplaination(query);
  const prompts = extractPromptsFromQuery(query);
  const gradient = generatePromptGradient(prompts);

  return div(
    [],
    [class_("filter-query"), attribute("id", id)],
    [
      renderQueryHeader(index, "Filter", prompts),
      div([], [class_("query-explanation"), attribute("style", `border-left-color: ${prompts.length > 0 ? getPromptColor(prompts[0]) : "var(--pico-primary)"}`)], [text(explanation)]),
      div([], [], [renderQueryBuilder(query, index, [])]),
      div(
        [],
        [class_("filter-query-result")],
        [
          div(
            [],
            [],
            [
              text("Matching "),
              strong([], [], [text(days.toString())]),
              text(` of ${totalDays} days`),
            ]
          ),
          renderResultVisualization(days, totalDays, prompts),
        ]
      ),
      div([], [], [renderRemoveQueryButton(index, path)]),
    ]
  );
}

function renderInteractiveDuplicationQuery(
  query: Duration,
  index: number,
  state: AppState
): HtmlNode<Update> {
  const path: QueryPath[] = [];
  const matchedPeriods = runDurationQuery(query, state.journalEntries);
  const prompts = extractPromptsFromQuery(query);
  const periods = renderPeriods(matchedPeriods, prompts);

  const id = `${pathToKey(index, path)}-interactive-duplication`;
  const explanation = renderQueryExplaination(query);
  const gradient = generatePromptGradient(prompts);

  return div(
    [],
    [class_("duration-query"), attribute("id", id)],
    [
      renderQueryHeader(index, "Duration", prompts),
      div([], [class_("query-explanation"), attribute("style", `border-left-color: ${prompts.length > 0 ? getPromptColor(prompts[0]) : "var(--pico-primary)"}`)], [text(explanation)]),
      div([], [], [renderQueryBuilder(query, index, [])]),
      div(
        [],
        [class_("duration-query-result")],
        [
          div(
            [],
            [],
            [
              strong([], [], [text(matchedPeriods.length.toString())]),
              text(" matching period(s)"),
            ]
          ),
          periods,
        ]
      ),
      div([], [], [renderRemoveQueryButton(index, path)]),
    ]
  );
}

export function renderInteractiveQueries(
  state: AppState,
  settings: Settings,
  localState: LocalState
): HtmlNode<Update> {
  const results: HtmlNode<Update>[] = [];

  let index: number = 0;

  results.push(
    div(
      [],
      [class_("add-query-buttons")],
      [renderAddFilterQueryButton(), renderAddDurationQueryButton()]
    )
  );

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

  return div([], [], results);
}
