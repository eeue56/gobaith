import { attribute, class_, div, HtmlNode, nodeNS, text } from "@eeue56/coed";
import {
  circle,
  line,
  path,
  rect,
  svg,
} from "@eeue56/coed/svg";
import { getDataOnlyForToday } from "../../logic/journal";
import {
  AppState,
  Day,
  JournalEntry,
  PROMPTS,
  Settings,
  Update,
} from "../../types";
import { dayToString } from "../../utils/dates";
import { renderDate } from "../date";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function svgText<Msg>(
  events: any[],
  attributes: any[],
  children: HtmlNode<Msg>[]
): HtmlNode<Msg> {
  return nodeNS("text" as any, SVG_NAMESPACE, events, attributes, children);
}

function createRadarChartSvg(
  labels: readonly string[],
  data: number[],
  title: string
): HtmlNode<Update> {
  const size = 800;
  const center = size / 2;
  const maxRadius = center - 150;
  const numPoints = labels.length;
  const angleStep = (2 * Math.PI) / numPoints;
  const maxValue = 4;
  const minValue = 1;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const value = data[i] || minValue;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const radius = normalizedValue * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push({ x, y });
  }

  const pathData = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ") + " Z";

  const gridLines: HtmlNode<Update>[] = [];
  for (let level = 1; level <= maxValue; level++) {
    const normalizedLevel = (level - minValue) / (maxValue - minValue);
    const levelRadius = normalizedLevel * maxRadius;
    const levelPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + levelRadius * Math.cos(angle);
      const y = center + levelRadius * Math.sin(angle);
      levelPoints.push({ x, y });
    }

    const levelPath = levelPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
      .join(" ") + " Z";

    gridLines.push(
      path([], [attribute("d", levelPath), attribute("fill", "none"), attribute("stroke", "#e0e0e0"), attribute("stroke-width", "1")])
    );
    gridLines.push(
      svgText([], [
        attribute("x", String(center + 10)),
        attribute("y", String(center - levelRadius + 5)),
        attribute("font-size", "16"),
        attribute("fill", "#666"),
      ], [text(String(level))])
    );
  }

  const axisLines: HtmlNode<Update>[] = [];
  const labelTexts: HtmlNode<Update>[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + maxRadius * Math.cos(angle);
    const y = center + maxRadius * Math.sin(angle);

    axisLines.push(
      line([], [
        attribute("x1", String(center)),
        attribute("y1", String(center)),
        attribute("x2", String(x)),
        attribute("y2", String(y)),
        attribute("stroke", "#d0d0d0"),
        attribute("stroke-width", "1"),
      ])
    );

    const labelX = center + (maxRadius + 50) * Math.cos(angle);
    const labelY = center + (maxRadius + 50) * Math.sin(angle);
    const textAnchor = labelX > center + 5 ? "start" : labelX < center - 5 ? "end" : "middle";

    labelTexts.push(
      svgText([], [
        attribute("x", String(labelX)),
        attribute("y", String(labelY)),
        attribute("text-anchor", textAnchor),
        attribute("font-size", "18"),
        attribute("fill", "#333"),
        attribute("dominant-baseline", "middle"),
      ], [text(labels[i])])
    );
  }

  const dataPoints: HtmlNode<Update>[] = points.map(p =>
    circle([], [
      attribute("cx", String(p.x)),
      attribute("cy", String(p.y)),
      attribute("r", "5"),
      attribute("fill", "rgb(54, 162, 235)"),
    ])
  );

  return svg(
    [],
    [
      attribute("xmlns", "http://www.w3.org/2000/svg"),
      attribute("viewBox", `0 0 ${size} ${size}`),
      attribute("width", "100%"),
      attribute("height", "100%"),
    ],
    [
      rect([], [attribute("width", String(size)), attribute("height", String(size)), attribute("fill", "white")]),
      svgText([], [
        attribute("x", String(center)),
        attribute("y", "40"),
        attribute("text-anchor", "middle"),
        attribute("font-size", "28"),
        attribute("font-weight", "bold"),
        attribute("fill", "#333"),
      ], [text(title)]),
      ...gridLines,
      ...axisLines,
      path([], [
        attribute("d", pathData),
        attribute("fill", "rgba(54, 162, 235, 0.2)"),
        attribute("stroke", "rgb(54, 162, 235)"),
        attribute("stroke-width", "3"),
      ]),
      ...dataPoints,
      ...labelTexts,
    ]
  );
}

export function renderSpiderweb(
  state: AppState,
  settings: Settings
): HtmlNode<Update> {
  const labels = PROMPTS.slice(0);
  const todaysData = getDataOnlyForToday(state.day, state.journalEntries);
  const title = `Mood breakdown on ${dayToString(state.day)}`;
  const chart = createRadarChartSvg(labels, todaysData, title);

  return div(
    [],
    [],
    [
      renderDate(state.day),
      div(
        [],
        [class_("spiderweb-container")],
        [
          div(
            [],
            [attribute("id", "spiderweb")],
            [chart]
          ),
        ]
      ),
    ]
  );
}
