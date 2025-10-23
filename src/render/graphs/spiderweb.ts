import { attribute, class_, div, HtmlNode, text } from "@eeue56/coed";
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

function createRadarChartSvg(
  labels: readonly string[],
  data: number[],
  title: string
): string {
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

  let gridLines = "";
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
    
    gridLines += `<path d="${levelPath}" fill="none" stroke="#e0e0e0" stroke-width="1"/>`;
    gridLines += `<text x="${center + 10}" y="${center - levelRadius + 5}" font-size="16" fill="#666">${level}</text>`;
  }

  let axisLines = "";
  let labelTexts = "";
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + maxRadius * Math.cos(angle);
    const y = center + maxRadius * Math.sin(angle);
    
    axisLines += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#d0d0d0" stroke-width="1"/>`;
    
    const labelX = center + (maxRadius + 50) * Math.cos(angle);
    const labelY = center + (maxRadius + 50) * Math.sin(angle);
    const textAnchor = labelX > center + 5 ? "start" : labelX < center - 5 ? "end" : "middle";
    
    labelTexts += `<text x="${labelX}" y="${labelY}" text-anchor="${textAnchor}" font-size="18" fill="#333" dominant-baseline="middle">${labels[i]}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">
    <rect width="${size}" height="${size}" fill="white"/>
    <text x="${center}" y="40" text-anchor="middle" font-size="28" font-weight="bold" fill="#333">${title}</text>
    ${gridLines}
    ${axisLines}
    <path d="${pathData}" fill="rgba(54, 162, 235, 0.2)" stroke="rgb(54, 162, 235)" stroke-width="3"/>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="rgb(54, 162, 235)"/>`).join("")}
    ${labelTexts}
  </svg>`;
}

export function renderSpiderweb(
  state: AppState,
  settings: Settings
): HtmlNode<Update> {
  const labels = PROMPTS.slice(0);
  const todaysData = getDataOnlyForToday(state.day, state.journalEntries);
  const title = `Mood breakdown on ${dayToString(state.day)}`;
  const svgContent = createRadarChartSvg(labels, todaysData, title);

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
            [
              attribute("id", "spiderweb"),
              attribute("innerHTML", svgContent),
            ],
            []
          ),
        ]
      ),
    ]
  );
}

export function showSpiderweb(
  today: Day,
  entries: JournalEntry[]
): void {}
