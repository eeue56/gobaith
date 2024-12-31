import {
  AppState,
  depression,
  elevation,
  JournalEntry,
  psychosis,
  RenderedWithEvents,
  Settings,
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
): string {
  const beginning = dayToString(period[0].day);
  const end = dayToString(period[period.length - 1].day);
  const average = averageOfPeriod(period, evaluator);
  return `
<div class="pure-u-1-1">${period.length} days from ${beginning} to ${end}, average of ${average}</div>
    `;
}

export function renderBipolarPeriods(
  state: AppState,
  settings: Settings
): RenderedWithEvents {
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

  return {
    body: `
<div class="bipolar-periods">
    <div class="pure-g">
        <h2 class="pure-u-1-1">${numberOfDays} days of tracking.</h2>
    </div>
    <div class="pure-g">
        <h2 class="pure-u-1-1">Elevated periods</h2>
        <div class="pure-u-1-1">A total of ${totalAmountElevated} days.</div>
        ${renderedElevatedPeriods.join("")}
    </div>

    <div class="pure-g">
        <h2 class="pure-u-1-1">Depressed periods</h2>
        <div class="pure-u-1-1">A total of ${totalAmountDepressed} days.</div>
        ${renderedDepressedPeriods.join("")}
    </div>

    <div class="pure-g">
        <h2 class="pure-u-1-1">Psychotic periods</h2>
        <div class="pure-u-1-1">A total of ${totalAmountPsychotic} days.</div>
        ${renderedPsychoticPeriods.join("")}
    </div>

</div>
`,
    eventListeners: [],
  };
}
