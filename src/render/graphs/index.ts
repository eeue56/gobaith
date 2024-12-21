import { getDataForPrompt } from "../../logic/journal";
import {
  AppState,
  Day,
  GraphName,
  GraphRenderer,
  JournalEntry,
  Prompt,
  PROMPTS,
  RenderedWithEvents,
  Settings,
} from "../../types";
import { dayToDate } from "../../utils/dates";
import { renderer } from "../../utils/render";
import { renderDailyBar, renderTotaledDailyBar } from "../ui/dailyBar";
import { renderBipolarPeriods } from "../ui/periods";
import { renderTabNavigation } from "../ui/tabs";
import { renderGraphChoices } from "./graphSelector";
import { renderLineOverview } from "./lineOverview";
import { renderSpiderweb } from "./spiderweb";

function renderActiveGraph(
  day: Day,
  entries: JournalEntry[],
  currentGraph: GraphName
): RenderedWithEvents {
  return GRAPHS[currentGraph](day, entries);
}

export function renderGraph(
  state: AppState,
  settings: Settings
): RenderedWithEvents {
  return renderer`
<div class="tab-content">
  ${renderGraphChoices(state)}
  ${renderActiveGraph(state.day, state.journalEntries, state.currentGraph)}
</div>
${renderTabNavigation(state.currentTab)}
`;
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
