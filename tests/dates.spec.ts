import { expect, test } from "@playwright/test";
import { Day } from "../src/types";
import {
  dateToDay,
  dayToDate,
  nextDay,
  numberOfDaysBetween,
  previousDay,
} from "../src/utils/dates";

test("Day parsing is reversable", () => {
  const day: Day = {
    year: 2024,
    month: 12,
    day: 27,
  };

  expect(dateToDay(dayToDate(day))).toEqual(day);
});

test("Previous day goes back only one day", () => {
  const day: Day = {
    year: 2024,
    month: 12,
    day: 27,
  };

  const yesterday: Day = {
    year: 2024,
    month: 12,
    day: 26,
  };

  const previous = previousDay(day);

  expect(previous).toEqual(yesterday);
});

test("Next day goes forward only one day", () => {
  const day: Day = {
    year: 2024,
    month: 12,
    day: 27,
  };

  const tomorrow: Day = {
    year: 2024,
    month: 12,
    day: 28,
  };

  const next = nextDay(day);

  expect(next).toEqual(tomorrow);
});

test("No days between the same day", () => {
  const day: Day = {
    year: 2024,
    month: 12,
    day: 27,
  };

  expect(numberOfDaysBetween(day, day)).toEqual(0);
});

test("One day between the next and previous days", () => {
  const day: Day = {
    year: 2024,
    month: 12,
    day: 27,
  };

  const yesterday: Day = {
    year: 2024,
    month: 12,
    day: 26,
  };

  const tomorrow: Day = {
    year: 2024,
    month: 12,
    day: 28,
  };

  expect(numberOfDaysBetween(day, yesterday)).toEqual(1);
  expect(numberOfDaysBetween(day, tomorrow)).toEqual(-1);
  expect(numberOfDaysBetween(yesterday, tomorrow)).toEqual(-2);
  expect(numberOfDaysBetween(tomorrow, yesterday)).toEqual(2);
});
