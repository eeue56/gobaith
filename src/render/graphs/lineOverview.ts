import {
  Chart,
  Colors,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { getDataPerPrompt } from ".";
import { JournalEntry, RenderedWithEvents } from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";
import { renderer } from "../../utils/render";

Chart.register(
  Colors,
  LinearScale,
  LineController,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Title,
  Legend
);

export function renderLineOverview(): RenderedWithEvents {
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

export function showLineOverview(
  entries: JournalEntry[]
): Chart<any, any> | null {
  const element = document.getElementById(
    "line-overview"
  ) as HTMLCanvasElement | null;
  if (!element) {
    console.error("Unable to find line-overview element");
    return null;
  }
  const ctx = element.getContext("2d");
  if (!ctx) {
    console.error("No 2d context for line-overview");
    return null;
  }

  const datasets = getDataPerPrompt(entries);

  const days = entries
    .sort(sortEntriesByDate)
    .map((entry) => dayToString(entry.day));

  return new Chart(ctx, {
    type: "line",
    data: {
      datasets: datasets,
      labels: days,
    },
    options: {
      animation: false,
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
