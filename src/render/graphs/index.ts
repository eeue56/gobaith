import { class_, div, HtmlNode } from "@eeue56/coed";
import { getDataForPrompt } from "../../logic/journal";
import {
  AppState,
  GraphName,
  GraphRenderer,
  JournalEntry,
  Model,
  Prompt,
  PROMPTS,
  Settings,
  Update,
} from "../../types";
import { dayToDate } from "../../utils/dates";
import { renderDailyBar, renderTotaledDailyBar } from "./dailyBar";
import { renderGraphChoices } from "./graphSelector";
import { renderInteractiveQueries } from "./interactiveQueries";
import { renderLineOverview } from "./lineOverview";
import { renderBipolarPeriods } from "./periods";
import { renderSpiderweb } from "./spiderweb";

function renderActiveGraph(
  state: AppState,
  settings: Settings
): HtmlNode<Update> {
  return GRAPHS[state.currentGraph](state, settings);
}

export function renderGraph(model: Model): HtmlNode<Update> {
  return div(
    [],
    [class_("tab-content graphs-tab-content")],
    [
      renderGraphChoices(model.appState),
      renderActiveGraph(model.appState, model.settings),
    ]
  );
}

export function getDataPerPrompt(entries: JournalEntry[]): PromptRenderData[] {
  const data: PromptRenderData[] = [];

  for (const prompt of PROMPTS) {
    const promptData = getDataForPrompt(prompt, entries).map((row) => {
      return {
        x: dayToDate(row.day),
        y: row.moodValue,
      };
    });

    data.push({
      label: prompt,
      data: promptData,
      borderColor: getColorForPrompt(prompt),
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

const COLOR_INDEX: string[] = [
  "#396AB1",
  "#DA7C30",
  "#3E9651",
  "#CC2529",
  "#535154",
  "#6B4C9A",
  "#922428",
  "#948B3D",
];

function getColorForPrompt(prompt: Prompt): string {
  return COLOR_INDEX[PROMPTS.indexOf(prompt)];
}

type PromptRenderData = {
  label: Prompt;
  data: { x: Date; y: number }[];
  borderColor: string;
  borderWidth: number;
  fill: boolean;
};
