import {
  attribute,
  class_,
  div,
  Event,
  HtmlNode,
  none,
  on,
  text,
} from "@eeue56/coed";
import { circle, line, path, rect, svg } from "@eeue56/coed/svg";
import { getDataPerPrompt } from ".";
import {
  AppState,
  LocalState,
  Prompt,
  PromptRenderData,
  Settings,
  SHORT_PROMPTS,
  Update,
} from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";
import { svgText } from "./svgText";

const width = 1200;
const height = 600;
const padding = { top: 60, right: 200, bottom: 100, left: 60 };
const chartWidth = width - padding.left - padding.right;
const chartHeight = height - padding.top - padding.bottom;

const minY = 1;
const maxY = 4;
const yRange = maxY - minY;

function viewGridlines(): HtmlNode<never>[] {
  const gridLines: HtmlNode<never>[] = [];
  for (let i = minY; i <= maxY; i++) {
    const y = padding.top + chartHeight - ((i - minY) / yRange) * chartHeight;
    gridLines.push(
      line(
        [],
        [
          attribute("x1", `${padding.left}`),
          attribute("y1", `${y}`),
          attribute("x2", String(width - padding.right)),
          attribute("y2", `${y}`),
          attribute("stroke", "#e0e0e0"),
          attribute("stroke-width", "1"),
        ]
      ),
      svgText(
        [],
        [
          attribute("x", String(padding.left - 10)),
          attribute("y", `${y + 5}`),
          attribute("text-anchor", "end"),
          attribute("font-size", "14"),
          attribute("fill", "#666"),
        ],
        [text(String(i))]
      )
    );
  }
  return gridLines;
}

function viewLegends(
  datasets: PromptRenderData[],
  nonFilteredPrompts: Set<Prompt>,
  width: number
): HtmlNode<Update>[] {
  const legends: HtmlNode<Update>[] = [];

  const centered = height / 2;
  const totalHeightOfLegend = padding.top + datasets.length * 35;
  const centeredTop = centered - totalHeightOfLegend / 2;

  for (let datasetIndex = 0; datasetIndex < datasets.length; datasetIndex++) {
    const dataset = datasets[datasetIndex];
    const legendY = padding.top + centeredTop + datasetIndex * 35;
    const isNotFiltered = nonFilteredPrompts.has(dataset.prompt);

    const clickHandler: Event<Update> = on("click", () => {
      return {
        kind: "ToggleFilterLineGraphView",
        prompt: dataset.prompt,
      };
    });

    legends.push(
      rect(
        [clickHandler],
        [
          attribute("x", String(width - padding.right + 20)),
          attribute("y", String(legendY - 22)),
          attribute("fill", dataset.borderColor),
          attribute("stroke", isNotFiltered ? "black" : "white"),
          attribute("stroke-width", isNotFiltered ? "1px" : "3px"),
          class_("legend-color-icon"),
        ]
      ),
      svgText(
        [clickHandler],
        [
          attribute("x", String(width - padding.right + 60)),
          attribute("y", String(legendY)),
          attribute("font-size", "14"),
          attribute("fill", "#333"),
          isNotFiltered ? none() : attribute("text-decoration", "line-through"),
          class_("legend-text"),
        ],
        [text(SHORT_PROMPTS[dataset.prompt])]
      )
    );
  }

  return legends;
}

function viewPaths(
  datasets: PromptRenderData[],
  nonFilteredPrompts: Set<Prompt>,
  xStep: number
): HtmlNode<never>[] {
  const paths: HtmlNode<never>[] = [];

  for (let datasetIndex = 0; datasetIndex < datasets.length; datasetIndex++) {
    const dataset = datasets[datasetIndex];
    // don't render data for filtered prompts
    if (!nonFilteredPrompts.has(dataset.prompt)) {
      continue;
    }

    const points = dataset.data.map((point, i) => {
      const x = padding.left + i * xStep;
      const y =
        padding.top + chartHeight - ((point.y - minY) / yRange) * chartHeight;
      return { x, y };
    });

    const pathData = points
      .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x},${point.y}`)
      .join(" ");

    paths.push(
      path(
        [],
        [
          attribute("d", pathData),
          attribute("fill", "none"),
          attribute("stroke", dataset.borderColor),
          attribute("stroke-width", "2"),
        ]
      )
    );

    for (const point of points) {
      paths.push(
        circle(
          [],
          [
            attribute("cx", `${point.x}`),
            attribute("cy", `${point.y}`),
            attribute("r", "3"),
            attribute("fill", dataset.borderColor),
          ]
        )
      );
    }
  }
  return paths;
}

function viewXLabels(labels: string[], xStep: number): HtmlNode<never>[] {
  const xLabels: HtmlNode<never>[] = [];
  const labelStep = Math.max(Math.floor(labels.length / 10), 1);

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (i % labelStep === 0 || i === labels.length - 1) {
      const x = padding.left + i * xStep;
      xLabels.push(
        svgText(
          [],
          [
            attribute("x", String(x)),
            attribute("y", String(height - padding.bottom + 60)),
            class_("graph-overview-date-label"),
            attribute("text-anchor", "middle"),
            attribute(
              "transform",
              `rotate(-45, ${x}, ${height - padding.bottom + 20})`
            ),
          ],
          [text(label)]
        )
      );
    }
  }

  return xLabels;
}

function viewLineChartSvg(
  datasets: PromptRenderData[],
  labels: string[],
  nonFilteredPrompts: Set<Prompt>
): HtmlNode<Update> {
  const xStep = chartWidth / Math.max(labels.length - 1, 1);

  const gridLines = viewGridlines();
  const paths = viewPaths(datasets, nonFilteredPrompts, xStep);
  const legends = viewLegends(datasets, nonFilteredPrompts, width);
  const xLabels = viewXLabels(labels, xStep);

  return svg(
    [],
    [attribute("viewBox", `0 0 ${width} ${height}`)],
    [
      rect(
        [],
        [
          attribute("width", `${width}`),
          attribute("height", `${height}`),
          attribute("fill", "white"),
        ]
      ),
      svgText(
        [],
        [
          attribute("x", String(width / 2)),
          attribute("y", "30"),
          attribute("text-anchor", "middle"),
          attribute("font-size", "20"),
          attribute("font-weight", "bold"),
          attribute("fill", "#333"),
        ],
        [text("Mood Overview Over Time")]
      ),
      ...gridLines,
      line(
        [],
        [
          attribute("x1", `${padding.left}`),
          attribute("y1", `${padding.top}`),
          attribute("x2", `${padding.left}`),
          attribute("y2", `${height - padding.bottom}`),
          attribute("stroke", "#333"),
          attribute("stroke-width", "2"),
        ]
      ),
      line(
        [],
        [
          attribute("x1", `${padding.left}`),
          attribute("y1", `${height - padding.bottom}`),
          attribute("x2", `${width - padding.right}`),
          attribute("y2", `${height - padding.bottom}`),
          attribute("stroke", "#333"),
          attribute("stroke-width", "2"),
        ]
      ),
      ...paths,
      ...xLabels,
      ...legends,
    ]
  );
}

export function renderLineOverview(
  state: AppState,
  settings: Settings,
  localState: LocalState
): HtmlNode<Update> {
  const datasets = getDataPerPrompt(state.journalEntries);
  const days = state.journalEntries
    .sort(sortEntriesByDate)
    .map((entry) => dayToString(entry.day));

  const chart = viewLineChartSvg(
    datasets,
    days,
    localState.Graphs.LineOverview.nonFilteredPrompts
  );

  return div(
    [],
    [class_("line-overview-container")],
    [div([], [attribute("id", "line-overview")], [chart])]
  );
}
