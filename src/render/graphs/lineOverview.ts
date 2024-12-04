import { Chart } from "chart.js";
import { getDataPerPrompt } from ".";
import { JournalEntry, Renderer } from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";
import { renderer } from "../../utils/render";

export function renderLineOverview(): Renderer {
  return renderer`
<div class="pure-g">
    <div class="pure-u-1-24"></div>
    <div class="pure-u-22-24">
        <canvas id="line-overview" width="600" height="800"></canvas>
    </div>
     <div class="pure-u-1-24"></div>
</div>
`;
}

export function showLineOverview(entries: JournalEntry[]): void {
  const element = document.getElementById(
    "line-overview"
  ) as HTMLCanvasElement | null;
  if (!element) {
    console.error("Unable to find line-overview element");
    return;
  }
  const ctx = element.getContext("2d");
  if (!ctx) {
    console.error("No 2d context for line-overview");
    return;
  }

  const datasets = getDataPerPrompt(entries);

  const days = entries
    .sort(sortEntriesByDate)
    .map((entry) => dayToString(entry.day));

  const lineChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: datasets,
      labels: days,
    },
    options: {
      font: {
        size: 30,
      },
      scales: {
        y: {
          ticks: {
            stepSize: 1,
          },
        },
      },
      devicePixelRatio: 1,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: {
              size: 20,
            },
          },
        },
      },
    },
  });
}
