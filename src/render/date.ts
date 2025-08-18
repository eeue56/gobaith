import {
  attribute,
  button,
  class_,
  div,
  HtmlNode,
  on,
  small,
  span,
  text,
} from "@eeue56/coed";
import { Day, Direction, Update } from "../types";
import {
  dateToDay,
  dayToString,
  isSameDay,
  numberOfDaysBetween,
} from "../utils/dates";
import { iconBack, iconForward, iconToday } from "./ui/icons";

export function renderDate(today: Day): HtmlNode<Update> {
  const daysDiff = numberOfDaysBetween(today, dateToDay(new Date()));
  const isToday = isSameDay(dateToDay(new Date()), today);

  const daysOrDay = Math.abs(daysDiff) === 1 ? "day" : "days";
  const fancyDateExplainer = isToday
    ? "Today"
    : daysDiff < 0
    ? `${-daysDiff} ${daysOrDay} ago`
    : `${daysDiff} ${daysOrDay} ahead`;

  const dayMessage: HtmlNode<never> = div(
    [],
    [class_("current-day")],
    [
      span([], [class_("thick")], [text(fancyDateExplainer)]),
      small([], [], [text(dayToString(today))]),
    ]
  );

  const backToToday: HtmlNode<Update> = isToday
    ? div([], [class_("spacer")], [])
    : button(
        [on("click", () => resetCurrentDay())],
        [
          attribute("title", "Return to today's entry"),
          attribute("id", "reset-day"),
          class_("back-to-today"),
        ],
        [text("Back to today"), iconToday]
      );

  return div(
    [],
    [attribute("id", "date-containter"), class_("date-controls")],
    [
      backToToday,
      div(
        [],
        [class_("current-day-controls")],
        [
          button(
            [on("click", () => updateCurrentDay("Previous"))],
            [
              attribute("title", "Go to previous day"),
              attribute("id", "previous-day"),
              attribute("name", "previous"),
              class_("date-arrow"),
            ],
            [iconBack]
          ),
          dayMessage,
          button(
            [on("click", () => updateCurrentDay("Next"))],
            [
              attribute("title", "Go to the next day"),
              attribute("id", "next-day"),
              attribute("name", "next"),
              class_("date-arrow"),
            ],
            [iconForward]
          ),
        ]
      ),
    ]
  );
}

function resetCurrentDay(): Update {
  return { kind: "ResetCurrentDay" };
}

function updateCurrentDay(direction: Direction): Update {
  return { kind: "UpdateCurrentDay", direction: direction };
}
