import { class_, div, h2, HtmlNode, text } from "@eeue56/coed";
import {
  AppState,
  depression,
  elevation,
  JournalEntry,
  LocalState,
  psychosis,
  Settings,
  Update,
} from "../../types";
import { dayToString } from "../../utils/dates";
import {
  averageOfPeriod,
  getDepressedPeriods,
  getElevatedPeriods,
  getPsychoticPeriods,
  sumPeriod,
} from "../../utils/stats";

export function renderPeriod(
  evaluator: (entry: JournalEntry) => number,
  period: JournalEntry[]
): HtmlNode<never> {
  const beginning = dayToString(period[0].day);
  const end = dayToString(period[period.length - 1].day);
  const average = averageOfPeriod(period, evaluator);
  return div(
    [],
    [],
    [
      text(
        `${period.length} days from ${beginning} to ${end}, average of ${average}`
      ),
    ]
  );
}

export function renderBipolarPeriods(
  state: AppState,
  settings: Settings,
  localState: LocalState
): HtmlNode<Update> {
  const numberOfDays = state.journalEntries.length;

  const elevatedPeriods = getElevatedPeriods(state.journalEntries);
  const renderedElevatedPeriods = elevatedPeriods.map((period) =>
    renderPeriod(elevation, period)
  );
  const totalAmountElevated = sumPeriod(elevatedPeriods);

  const depressedPeriods = getDepressedPeriods(state.journalEntries);
  const renderedDepressedPeriods = depressedPeriods.map((period) =>
    renderPeriod(depression, period)
  );
  const totalAmountDepressed = sumPeriod(depressedPeriods);

  const psychoticPeriods = getPsychoticPeriods(state.journalEntries);
  const renderedPsychoticPeriods = psychoticPeriods.map((period) =>
    renderPeriod(psychosis, period)
  );
  const totalAmountPsychotic = sumPeriod(psychoticPeriods);

  return div(
    [],
    [class_("bipolar-periods")],
    [
      div([], [], [text(`${numberOfDays} days of tracking.`)]),
      div(
        [],
        [],
        [
          h2([], [], [text("Elevated periods")]),
          div([], [], [text(`A total of ${totalAmountElevated} days.`)]),
          ...renderedElevatedPeriods,
        ]
      ),
      div(
        [],
        [],
        [
          h2([], [], [text("Depressed periods")]),
          div([], [], [text(`A total of ${totalAmountDepressed} days.`)]),
          ...renderedDepressedPeriods,
        ]
      ),
      div(
        [],
        [],
        [
          h2([], [], [text("Psychotic periods")]),
          div([], [], [text(`A total of ${totalAmountPsychotic} days.`)]),
          ...renderedPsychoticPeriods,
        ]
      ),
    ]
  );
}
