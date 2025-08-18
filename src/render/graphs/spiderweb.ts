import { attribute, canvas, div, HtmlNode, style_ } from "@eeue56/coed";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Colors,
  Filler,
  Legend,
  LinearScale,
  PointElement,
  RadarController,
  RadialLinearScale,
  Title,
  Tooltip,
} from "chart.js";
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

Chart.register(
  Colors,
  BarController,
  BarElement,
  CategoryScale,
  PointElement,
  LinearScale,
  RadialLinearScale,
  RadarController,
  Filler,
  Title,
  Tooltip,
  Legend
);

export function renderSpiderweb(
  state: AppState,
  settings: Settings
): HtmlNode<Update> {
  return div(
    [],
    [],
    [
      renderDate(state.day),
      div(
        [],
        [attribute("height", "500")],
        [
          canvas(
            [],
            [
              attribute("id", "spiderweb"),
              attribute("width", "400"),
              attribute("height", "800"),
              style_("background-color", "white"),
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
): Chart<any, any> | null {
  const spiderwebElement: HTMLCanvasElement | null = document.getElementById(
    "spiderweb"
  ) as HTMLCanvasElement | null;

  if (!spiderwebElement) {
    console.error("Missing element with id='spiderweb'");
    return null;
  }

  const ctx = spiderwebElement.getContext("2d");
  if (!ctx) {
    console.log("No 2d context for spiderweb");
    return null;
  }

  const labels = PROMPTS.slice(0);
  const todaysData = getDataOnlyForToday(today, entries);

  return new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{ data: todaysData }],
    },
    options: {
      animation: false,
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
