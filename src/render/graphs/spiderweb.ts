import { Chart } from "chart.js/auto";
import { getDataOnlyForToday } from "../../logic/journal";
import { Day, JournalEntry, PROMPTS, RenderedWithEvents } from "../../types";
import { dayToString } from "../../utils/dates";
import { renderer } from "../../utils/render";
import { renderDate } from "../date";

export function showSpiderweb(today: Day, entries: JournalEntry[]): void {
  const spiderwebElement: HTMLCanvasElement | null = document.getElementById(
    "spiderweb"
  ) as HTMLCanvasElement | null;

  if (!spiderwebElement) {
    console.error("Missing element with id='spiderweb'");
    return;
  }

  const ctx = spiderwebElement.getContext("2d");
  if (!ctx) {
    console.log("No 2d context for spiderweb");
    return;
  }

  const labels = PROMPTS.slice(0);
  const todaysData = getDataOnlyForToday(today, entries);

  const spiderwebChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{ data: todaysData }],
    },
    options: {
      devicePixelRatio: 1,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: `Mood breakdown on ${dayToString(today)}`,
          font: {
            size: 40,
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 4,
          min: 1,
          ticks: {
            stepSize: 1,
            font: {
              size: 20,
            },
          },
          pointLabels: {
            font: {
              size: 20,
            },
          },
        },
      },
    },
  });
}

export function renderSpiderweb(today: Day): RenderedWithEvents {
  return renderer`
${renderDate(today)}
<div class="pure-g">
    <div class="pure-u-1-24"></div>
    <div class="pure-u-22-24" height="500">
        <canvas id="spiderweb" width="400" height="800" background-color="white"></canvas>
    </div>
    <div class="pure-u-1-24"></div>
</div>
`;
}
