import { attribute, class_, div, HtmlNode } from "@eeue56/coed";
import { getDataPerPrompt } from ".";
import { JournalEntry } from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";

function createLineChartSvg(
  datasets: Array<{
    label: string;
    data: Array<{ x: Date; y: number }>;
    borderColor: string;
  }>,
  labels: string[]
): string {
  const width = 1200;
  const height = 600;
  const padding = { top: 60, right: 200, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minY = 1;
  const maxY = 4;
  const yRange = maxY - minY;

  const xStep = chartWidth / Math.max(labels.length - 1, 1);

  let gridLines = "";
  for (let i = minY; i <= maxY; i++) {
    const y = padding.top + chartHeight - ((i - minY) / yRange) * chartHeight;
    gridLines += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e0e0e0" stroke-width="1"/>`;
    gridLines += `<text x="${padding.left - 10}" y="${y + 5}" text-anchor="end" font-size="14" fill="#666">${i}</text>`;
  }

  let paths = "";
  let legends = "";
  datasets.forEach((dataset, datasetIndex) => {
    const points = dataset.data.map((point, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((point.y - minY) / yRange) * chartHeight;
      return { x, y };
    });

    const pathData = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
      .join(" ");

    paths += `<path d="${pathData}" fill="none" stroke="${dataset.borderColor}" stroke-width="2"/>`;
    points.forEach(p => {
      paths += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${dataset.borderColor}"/>`;
    });

    const legendY = padding.top + datasetIndex * 25;
    legends += `<rect x="${width - padding.right + 10}" y="${legendY - 10}" width="15" height="15" fill="${dataset.borderColor}"/>`;
    legends += `<text x="${width - padding.right + 30}" y="${legendY}" font-size="14" fill="#333">${dataset.label}</text>`;
  });

  let xLabels = "";
  const labelStep = Math.max(Math.floor(labels.length / 10), 1);
  labels.forEach((label, i) => {
    if (i % labelStep === 0 || i === labels.length - 1) {
      const x = padding.left + i * xStep;
      xLabels += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" font-size="12" fill="#666" transform="rotate(-45, ${x}, ${height - padding.bottom + 20})">${label}</text>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
    <rect width="${width}" height="${height}" fill="white"/>
    <text x="${width / 2}" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="#333">Mood Overview Over Time</text>
    ${gridLines}
    <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#333" stroke-width="2"/>
    <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#333" stroke-width="2"/>
    ${paths}
    ${xLabels}
    ${legends}
  </svg>`;
}

export function renderLineOverview(): HtmlNode<never> {
  return div(
    [],
    [class_("line-overview-container")],
    [
      div(
        [],
        [attribute("id", "line-overview")],
        []
      ),
    ]
  );
}

export function showLineOverview(
  entries: JournalEntry[]
): void {
  const element = document.getElementById("line-overview");
  if (!element) {
    console.error("Unable to find line-overview element");
    return;
  }

  const datasets = getDataPerPrompt(entries);
  const days = entries
    .sort(sortEntriesByDate)
    .map((entry) => dayToString(entry.day));

  const svgContent = createLineChartSvg(datasets, days);
  element.innerHTML = svgContent;
}
