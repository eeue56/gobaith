import { class_, div, HtmlNode } from "@eeue56/coed";
import { getDataForPrompt } from "../../logic/journal";
import {
  AppState,
  GraphName,
  GraphRenderer,
  JournalEntry,
  LocalState,
  Model,
  Prompt,
  PromptRenderData,
  PROMPTS,
  Settings,
  Update,
} from "../../types";
import { getPromptColor } from "../../utils/colors";
import { dayToDate } from "../../utils/dates";
import { renderDailyBar, renderTotaledDailyBar } from "./dailyBar";
import { renderGraphChoices } from "./graphSelector";
import { renderInteractiveQueries } from "./interactiveQueries";
import { renderLineOverview } from "./lineOverview";
import { renderBipolarPeriods } from "./periods";
import { renderSpiderweb } from "./spiderweb";

function renderActiveGraph(
  state: AppState,
  settings: Settings,
  localState: LocalState
): HtmlNode<Update> {
  return GRAPHS[state.currentGraph](state, settings, localState);
}

export function renderGraph(model: Model): HtmlNode<Update> {
  return div(
    [],
    [class_("tab-content graphs-tab-content")],
    [
      renderGraphChoices(model.appState),
      renderActiveGraph(model.appState, model.settings, model.localState),
    ]
  );
}

export function getDataPerPrompt(entries: JournalEntry[], settings: Settings): PromptRenderData[] {
  const data: PromptRenderData[] = [];

  // Include both standard enabled prompts and custom prompts
  const enabledPrompts = PROMPTS.filter((prompt) =>
    settings.enabledPrompts.has(prompt)
  );
  const allPrompts = [...enabledPrompts, ...settings.customPrompts];

  for (const prompt of allPrompts) {
    const promptData = getDataForPrompt(prompt, entries).map((row) => {
      return {
        x: dayToDate(row.day),
        y: row.moodValue,
      };
    });

    data.push({
      prompt: prompt,
      data: promptData,
      borderColor: getPromptColor(prompt),
      borderWidth: 2,
      fill: false,
    });
  }

  return data;
}

export const GRAPHS: Record<GraphName, GraphRenderer> = {
  SPIDERWEB: renderSpiderweb,
  LINE_OVERVIEW: renderLineOverview,
  DAILY_BAR: renderDailyBar,
  BIPOLAR_PERIODS: renderBipolarPeriods,
  TOTALED_DAILY_BAR: renderTotaledDailyBar,
  "Interactive queries": renderInteractiveQueries,
};
