import { attribute, canvas, div, HtmlNode } from "@eeue56/coed";
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
import { JournalEntry } from "../../types";
import { dayToString, sortEntriesByDate } from "../../utils/dates";

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

export function renderLineOverview(): HtmlNode<never> {
  return div(
    [],
    [],
    [
      div(
        [],
        [attribute("height", "500")],
        [
          canvas(
            [],
            [
              attribute("id", "line-overview"),
              attribute("width", "600"),
              attribute("height", "800"),
            ],
            []
          ),
        ]
      ),
    ]
  );
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
