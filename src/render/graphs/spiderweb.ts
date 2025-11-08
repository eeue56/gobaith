import { attribute, class_, div, HtmlNode, text } from "@eeue56/coed";
import { circle, line, path, rect, svg } from "@eeue56/coed/svg";
import { getDataOnlyForToday } from "../../logic/journal";
import {
  AppState,
  LocalState,
  Prompt,
  PROMPTS,
  Settings,
  SHORT_PROMPTS,
  Update,
} from "../../types";
import { dayToString } from "../../utils/dates";
import { renderDate } from "../date";
import { svgText } from "./svgText";

type Point = { x: number; y: number };

const size = 800;
const center = size / 2;
const maxRadius = center - 150;
const minValue = 1;
const maxValue = 4;

function getPoints(
  numPoints: number,
  angleStep: number,
  data: number[]
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const value = data[i] || minValue;
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    const radius = normalizedValue * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push({ x, y });
  }
  return points;
}

function viewRadarChartSvg(
  prompts: Prompt[],
  data: number[],
  title: string
): HtmlNode<Update> {
  const numPoints = prompts.length;
  const angleStep = (2 * Math.PI) / numPoints;

  const points: Point[] = getPoints(numPoints, angleStep, data);

  const pathData =
    points
      .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x},${point.y}`)
      .join(" ") + " Z";

  const gridLines: HtmlNode<Update>[] = [];
  for (let level = 1; level <= maxValue; level++) {
    const normalizedLevel = (level - minValue) / (maxValue - minValue);
    const levelRadius = normalizedLevel * maxRadius;
    const levelPoints: Point[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + levelRadius * Math.cos(angle);
      const y = center + levelRadius * Math.sin(angle);
      levelPoints.push({ x, y });
    }

    const levelPath =
      levelPoints
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
        .join(" ") + " Z";

    gridLines.push(
      path(
        [],
        [
          attribute("d", levelPath),
          attribute("fill", "none"),
          attribute("stroke", "#e0e0e0"),
          attribute("stroke-width", "1"),
        ]
      ),
      svgText(
        [],
        [
          attribute("x", String(center + 10)),
          attribute("y", String(center - levelRadius + 5)),
          attribute("font-size", "16"),
          attribute("fill", "#666"),
        ],
        [text(String(level))]
      )
    );
  }

  const axisLines: HtmlNode<Update>[] = [];
  const labelTexts: HtmlNode<Update>[] = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + maxRadius * Math.cos(angle);
    const y = center + maxRadius * Math.sin(angle);

    axisLines.push(
      line(
        [],
        [
          attribute("x1", String(center)),
          attribute("y1", String(center)),
          attribute("x2", String(x)),
          attribute("y2", String(y)),
          attribute("stroke", "#d0d0d0"),
          attribute("stroke-width", "1"),
        ]
      )
    );

    const labelX = center + (maxRadius + 50) * Math.cos(angle);
    const labelY = center + (maxRadius + 50) * Math.sin(angle);
    const textAnchor =
      labelX > center + 5 ? "start" : labelX < center - 5 ? "end" : "middle";

    const shortLabel = SHORT_PROMPTS[prompts[i]];

    labelTexts.push(
      svgText(
        [],
        [
          attribute("x", String(labelX)),
          attribute("y", String(labelY)),
          attribute("text-anchor", textAnchor),
          attribute("font-size", "18"),
          attribute("fill", "#333"),
          attribute("dominant-baseline", "middle"),
        ],
        [text(shortLabel)]
      )
    );
  }

  const dataPoints: HtmlNode<Update>[] = points.map((point) =>
    circle(
      [],
      [
        attribute("cx", String(point.x)),
        attribute("cy", String(point.y)),
        attribute("r", "5"),
        attribute("fill", "rgb(54, 162, 235)"),
      ]
    )
  );

  return svg(
    [],
    [
      attribute("xmlns", "http://www.w3.org/2000/svg"),
      attribute("viewBox", `0 0 ${size} ${size}`),
    ],
    [
      rect(
        [],
        [
          attribute("width", String(size)),
          attribute("height", String(size)),
          attribute("fill", "white"),
        ]
      ),
      svgText(
        [],
        [
          attribute("x", String(center)),
          attribute("y", "40"),
          attribute("text-anchor", "middle"),
          attribute("font-size", "28"),
          attribute("font-weight", "bold"),
          attribute("fill", "#333"),
        ],
        [text(title)]
      ),
      ...gridLines,
      ...axisLines,
      path(
        [],
        [
          attribute("d", pathData),
          attribute("fill", "rgba(54, 162, 235, 0.2)"),
          attribute("stroke", "rgb(54, 162, 235)"),
          attribute("stroke-width", "3"),
        ]
      ),
      ...dataPoints,
      ...labelTexts,
    ]
  );
}

export function renderSpiderweb(
  state: AppState,
  settings: Settings,
  localState: LocalState
): HtmlNode<Update> {
  // Include both standard enabled prompts and custom prompts
  const enabledPrompts = PROMPTS.filter((prompt) =>
    settings.enabledPrompts.has(prompt)
  );
  const prompts = [...enabledPrompts, ...settings.customPrompts];
  
  const todaysData = getDataOnlyForToday(state.day, state.journalEntries);
  const title = `Mood breakdown on ${dayToString(state.day)}`;
  const chart = viewRadarChartSvg(prompts, todaysData, title);

  return div(
    [],
    [],
    [
      renderDate(state.day),
      div(
        [],
        [class_("spiderweb-container")],
        [div([], [attribute("id", "spiderweb")], [chart])]
      ),
    ]
  );
}
