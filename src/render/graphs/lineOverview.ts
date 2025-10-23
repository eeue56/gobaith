import { attribute, class_, div, HtmlNode, nodeNS, text } from "@eeue56/coed";
import {
  circle,
  line,
  path,
  rect,
  svg,
} from "@eeue56/coed/svg";
import { getDataPerPrompt } from ".";
import { JournalEntry } from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function svgText<Msg>(
  events: any[],
  attributes: any[],
  children: HtmlNode<Msg>[]
): HtmlNode<Msg> {
  return nodeNS("text" as any, SVG_NAMESPACE, events, attributes, children);
}

function createLineChartSvg(
  datasets: Array<{
    label: string;
    data: Array<{ x: Date; y: number }>;
    borderColor: string;
  }>,
  labels: string[]
): HtmlNode<never> {
  const width = 1200;
  const height = 600;
  const padding = { top: 60, right: 200, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minY = 1;
  const maxY = 4;
  const yRange = maxY - minY;

  const xStep = chartWidth / Math.max(labels.length - 1, 1);

  const gridLines: HtmlNode<never>[] = [];
  for (let i = minY; i <= maxY; i++) {
    const y = padding.top + chartHeight - ((i - minY) / yRange) * chartHeight;
    gridLines.push(
      line([], [
        attribute("x1", String(padding.left)),
        attribute("y1", String(y)),
        attribute("x2", String(width - padding.right)),
        attribute("y2", String(y)),
        attribute("stroke", "#e0e0e0"),
        attribute("stroke-width", "1"),
      ])
    );
    gridLines.push(
      svgText([], [
        attribute("x", String(padding.left - 10)),
        attribute("y", String(y + 5)),
        attribute("text-anchor", "end"),
        attribute("font-size", "14"),
        attribute("fill", "#666"),
      ], [text(String(i))])
    );
  }

  const paths: HtmlNode<never>[] = [];
  const legends: HtmlNode<never>[] = [];
  datasets.forEach((dataset, datasetIndex) => {
    const points = dataset.data.map((point, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((point.y - minY) / yRange) * chartHeight;
      return { x, y };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
      .join(" ");

    paths.push(
      path([], [
        attribute("d", pathData),
        attribute("fill", "none"),
        attribute("stroke", dataset.borderColor),
        attribute("stroke-width", "2"),
      ])
    );

    points.forEach(p => {
      paths.push(
        circle([], [
          attribute("cx", String(p.x)),
          attribute("cy", String(p.y)),
          attribute("r", "3"),
          attribute("fill", dataset.borderColor),
        ])
      );
    });

    const legendY = padding.top + datasetIndex * 25;
    legends.push(
      rect([], [
        attribute("x", String(width - padding.right + 10)),
        attribute("y", String(legendY - 10)),
        attribute("width", "15"),
        attribute("height", "15"),
        attribute("fill", dataset.borderColor),
      ])
    );
    legends.push(
      svgText([], [
        attribute("x", String(width - padding.right + 30)),
        attribute("y", String(legendY)),
        attribute("font-size", "14"),
        attribute("fill", "#333"),
      ], [text(dataset.label)])
    );
  });

  const xLabels: HtmlNode<never>[] = [];
  const labelStep = Math.max(Math.floor(labels.length / 10), 1);
  labels.forEach((label, i) => {
    if (i % labelStep === 0 || i === labels.length - 1) {
      const x = padding.left + i * xStep;
      xLabels.push(
        svgText([], [
          attribute("x", String(x)),
          attribute("y", String(height - padding.bottom + 20)),
          attribute("text-anchor", "middle"),
          attribute("font-size", "12"),
          attribute("fill", "#666"),
          attribute("transform", `rotate(-45, ${x}, ${height - padding.bottom + 20})`),
        ], [text(label)])
      );
    }
  });

  return svg(
    [],
    [
      attribute("xmlns", "http://www.w3.org/2000/svg"),
      attribute("viewBox", `0 0 ${width} ${height}`),
      attribute("width", "100%"),
      attribute("height", "100%"),
    ],
    [
      rect([], [attribute("width", String(width)), attribute("height", String(height)), attribute("fill", "white")]),
      svgText([], [
        attribute("x", String(width / 2)),
        attribute("y", "30"),
        attribute("text-anchor", "middle"),
        attribute("font-size", "20"),
        attribute("font-weight", "bold"),
        attribute("fill", "#333"),
      ], [text("Mood Overview Over Time")]),
      ...gridLines,
      line([], [
        attribute("x1", String(padding.left)),
        attribute("y1", String(padding.top)),
        attribute("x2", String(padding.left)),
        attribute("y2", String(height - padding.bottom)),
        attribute("stroke", "#333"),
        attribute("stroke-width", "2"),
      ]),
      line([], [
        attribute("x1", String(padding.left)),
        attribute("y1", String(height - padding.bottom)),
        attribute("x2", String(width - padding.right)),
        attribute("y2", String(height - padding.bottom)),
        attribute("stroke", "#333"),
        attribute("stroke-width", "2"),
      ]),
      ...paths,
      ...xLabels,
      ...legends,
    ]
  );
}

export function renderLineOverview(
  entries: JournalEntry[]
): HtmlNode<never> {
  const datasets = getDataPerPrompt(entries);
  const days = entries
    .sort(sortEntriesByDate)
    .map((entry) => dayToString(entry.day));

  const chart = createLineChartSvg(datasets, days);

  return div(
    [],
    [class_("line-overview-container")],
    [
      div(
        [],
        [attribute("id", "line-overview")],
        [chart]
      ),
    ]
  );
}
