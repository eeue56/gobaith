import { importDataFromJson } from "./logic/journal";
import { Queryable, QueryPath, QueryUpdate } from "./logic/query/types";
import {
  AppState,
  Day,
  Direction,
  GraphName,
  JournalEntry,
  MoodValue,
  Pill,
  pillKey,
  PillOrderDirection,
  Prompt,
  Settings,
  TabName,
} from "./types";
import { isSameDay } from "./utils/dates";

export function addJournalEntry(
  day: Day,
  text: string,
  time: Date,
  state: AppState
): AppState {
  for (const entry of state.journalEntries) {
    if (isSameDay(entry.day, day)) {
      entry.logs.push({ text, time });
      break;
    }
  }

  return { ...state, journalEntries: state.journalEntries };
}

export function updatePromptValue(
  entry: JournalEntry,
  prompt: Prompt | string,
  value: MoodValue,
  state: AppState
): AppState {
  for (const journalEntry of state.journalEntries) {
    if (isSameDay(journalEntry.day, entry.day)) {
      journalEntry.promptResponses[prompt] = value;
      break;
    }
  }

  return { ...state, journalEntries: state.journalEntries };
}

export function updatePillValue(
  entry: JournalEntry,
  pill: Pill,
  direction: Direction,
  state: AppState
): AppState {
  const pillName = pillKey(pill);
  for (const journalEntry of state.journalEntries) {
    if (isSameDay(journalEntry.day, entry.day)) {
      if (direction === "Next") {
        journalEntry.pills[pillName]++;
      } else if (direction === "Previous") {
        if (journalEntry.pills[pillName] > 0) {
          journalEntry.pills[pillName] = journalEntry.pills[pillName] - 1;
        }
      }
      break;
    }
  }

  return { ...state, journalEntries: state.journalEntries };
}

export function pushHistoryState(tab: TabName) {
  window.history.pushState({ tab: tab }, "");
}

export function updateCurrentTab(tab: TabName, state: AppState): AppState {
  state.currentTab = tab;
  pushHistoryState(tab);
  return state;
}

export function updateCurrentGraph(
  graph: GraphName,
  state: AppState
): AppState {
  state.currentGraph = graph;
  return state;
}

function move<a>(arr: a[], from: number, to: number): void {
  arr.splice(to, 0, arr.splice(from, 1)[0]);
}

export function updatePillOrder(
  settings: Settings,
  pill: Pill,
  direction: PillOrderDirection
): Settings {
  const pillIndex = settings.currentPills.findIndex(
    (p) => pillKey(p) === pillKey(pill)
  );

  switch (direction) {
    case "Up": {
      move(settings.currentPills, pillIndex, pillIndex - 1);
      break;
    }
    case "Down": {
      move(settings.currentPills, pillIndex, pillIndex + 1);
      break;
    }
    case "Top": {
      move(settings.currentPills, pillIndex, 0);
      break;
    }
  }

  return settings;
}

export type Modified = {
  entries: JournalEntry[];
  settings: Settings;
};

export function addPill(
  newPill: Pill,
  entries: JournalEntry[],
  settings: Settings
): Modified {
  const key = pillKey(newPill);
  if (settings.currentPills.some((p) => pillKey(p) === key)) {
    return {
      entries,
      settings,
    };
  }

  for (const entry of entries) {
    entry.pills[key] = 0;
  }

  settings.currentPills.push(newPill);

  return {
    entries,
    settings,
  };
}

// function updateQueryForOneQuery(
//   path: QueryPath[],
//   update: QueryUpdate,
//   query: Queryable
// ): Queryable {
//   switch (query.kind) {
//     case "And":
//     case "Or": {
//       if (hashQuery(query) === id) {
//         if (update.kind !== "CombineQuery") {
//           return query;
//         }
//         switch (update.combineQueryKind) {
//           case "And": {
//             return {
//               kind: "And",
//               left: updateQueryForOneQuery(
//                 id,
//                 key,
//                 `${key}-left`,
//                 update,
//                 query.left
//               ) as Query,
//               right: updateQueryForOneQuery(
//                 id,
//                 key,
//                 `${key}-right`,
//                 update,
//                 query.right
//               ) as Query,
//             };
//           }
//           case "Or": {
//             return {
//               kind: "Or",
//               left: updateQueryForOneQuery(
//                 id,
//                 `${key}-left`,
//                 update,
//                 query.left
//               ) as Query,
//               right: updateQueryForOneQuery(
//                 id,
//                 `${key}-right`,
//                 update,
//                 query.right
//               ) as Query,
//             };
//           }
//           case "Not": {
//             {
//               return {
//                 kind: "Not",
//                 query: updateQueryForOneQuery(
//                   id,
//                   `${key}-not`,
//                   update,
//                   query.left
//                 ) as Query,
//               };
//             }
//           }
//         }
//       }
//       return {
//         ...query,
//         left: updateQueryForOneQuery(id, update, query.left) as Query,
//         right: updateQueryForOneQuery(id, update, query.right) as Query,
//       };
//     }
//     case "Not": {
//       if (hashQuery(query) === id) {
//         if (update.kind !== "CombineQuery") {
//           return query;
//         }
//         switch (update.combineQueryKind) {
//           case "And": {
//             return {
//               kind: "And",
//               left: query.query,
//               right: query.query,
//             };
//           }
//           case "Or": {
//             return {
//               kind: "Or",
//               left: query.query,
//               right: query.query,
//             };
//           }
//           case "Not": {
//             return query;
//           }
//         }
//       }
//       return {
//         ...query,
//         query: updateQueryForOneQuery(id, update, query.query) as Query,
//       };
//     }
//     case "Filter": {
//       if (hashQuery(query) === id) {
//         switch (update.kind) {
//           case "Prompt": {
//             return { ...query, prompt: update.prompt };
//           }
//           case "MoodValue": {
//             return { ...query, value: update.moodValue };
//           }
//           case "Comparison": {
//             return { ...query, comparison: update.comparison };
//           }
//           case "Duration": {
//             return query;
//           }
//           case "CombineQuery": {
//             return query;
//           }
//         }
//       }
//       return query;
//     }
//     case "Duration": {
//       switch (update.kind) {
//         case "Prompt":
//         case "MoodValue":
//         case "CombineQuery": {
//           return {
//             ...query,
//             query: updateQueryForOneQuery(id, update, query.query) as Query,
//           };
//         }
//         case "Comparison": {
//           if (hashQuery(query) === id) {
//             return { ...query, comparison: update.comparison };
//           }

//           return {
//             ...query,
//             query: updateQueryForOneQuery(id, update, query.query) as Query,
//           };
//         }
//         case "Duration": {
//           if (hashQuery(query) === id) {
//             return { ...query, days: update.duration };
//           }
//           // durations can't be nested, so just exit early
//           return updateQueryForOneQuery(id, update, query);
//         }
//       }
//     }
//   }
// }

type ErrorMessage = { kind: "Error"; message: string };
type QueryPathResult = Queryable | ErrorMessage;

function getQueryByPath(
  path: QueryPath[],
  entryQuery: Queryable
): QueryPathResult {
  let currentQuery = entryQuery;
  for (const pathPart of path) {
    const potentialErrorMessage: ErrorMessage = {
      kind: "Error",
      message: `Expected a query with a ${pathPart}, but got ${
        currentQuery.kind
      }. Full path: ${path.join(" -> ")}`,
    };
    switch (pathPart) {
      case "Left": {
        switch (currentQuery.kind) {
          case "And":
          case "Or": {
            currentQuery = currentQuery.left;
            break;
          }
          case "Not":
          case "Filter":
          case "Duration": {
            return potentialErrorMessage;
          }
        }
        break;
      }
      case "Right": {
        switch (currentQuery.kind) {
          case "And":
          case "Or": {
            currentQuery = currentQuery.right;
            break;
          }
          case "Not":
          case "Filter":
          case "Duration": {
            return potentialErrorMessage;
          }
        }
        break;
      }
      case "DirectChild": {
        switch (currentQuery.kind) {
          case "And":
          case "Or": {
            return potentialErrorMessage;
          }
          case "Not":
          case "Duration": {
            currentQuery = currentQuery.query;
            break;
          }
          case "Filter": {
            return potentialErrorMessage;
          }
        }
        break;
      }
    }
  }
  return currentQuery;
}

function mutableModify(queryToModify: Queryable, queryToSet: Queryable): void {
  const _modifiedQuery = queryToModify as any;
  for (const key of Object.keys(queryToModify)) {
    delete _modifiedQuery[key];
  }

  for (const key of Object.keys(queryToSet)) {
    _modifiedQuery[key] = (queryToSet as any)[key];
  }
}

function updateQueryable(
  queryToUpdate: Queryable,
  update: QueryUpdate
): Queryable {
  switch (queryToUpdate.kind) {
    case "And":
    case "Or": {
      if (update.kind !== "CombineQuery") {
        // if it's not a combine query change, it can't do anything on this query
        return queryToUpdate;
      }
      switch (update.combineQueryKind) {
        case "And": {
          return {
            kind: "And",
            left: queryToUpdate.left,
            right: queryToUpdate.right,
          };
        }
        case "Or": {
          return {
            kind: "Or",
            left: queryToUpdate.left,
            right: queryToUpdate.right,
          };
        }
        case "Not": {
          return { kind: "Not", query: queryToUpdate.left };
        }
      }
    }
    case "Not": {
      if (update.kind !== "CombineQuery") {
        // if it's not a combine query change, it can't do anything on this query
        return queryToUpdate;
      }
      switch (update.combineQueryKind) {
        case "And": {
          return {
            kind: "And",
            left: queryToUpdate.query,
            right: queryToUpdate.query,
          };
        }
        case "Or": {
          return {
            kind: "Or",
            left: queryToUpdate.query,
            right: queryToUpdate.query,
          };
        }
        case "Not": {
          return queryToUpdate;
        }
      }
    }
    case "Filter": {
      switch (update.kind) {
        case "Prompt": {
          return { ...queryToUpdate, prompt: update.prompt };
        }
        case "MoodValue": {
          return { ...queryToUpdate, value: update.moodValue };
        }
        case "Comparison": {
          return { ...queryToUpdate, comparison: update.comparison };
        }
        case "Duration":
        case "CombineQuery": {
          return queryToUpdate;
        }
      }
    }
    case "Duration": {
      switch (update.kind) {
        case "Prompt":
        case "MoodValue":
        case "CombineQuery": {
          return queryToUpdate;
        }
        case "Comparison": {
          return { ...queryToUpdate, comparison: update.comparison };
        }
        case "Duration": {
          return { ...queryToUpdate, days: update.duration };
        }
      }
    }
  }
}

function updateOneQuery(
  path: QueryPath[],
  update: QueryUpdate,
  query: Queryable
): Queryable {
  const queryToUpdate = getQueryByPath(path, query);

  if (queryToUpdate.kind === "Error") {
    console.error("QueryUpdate:", queryToUpdate.message);
    return query;
  }

  mutableModify(queryToUpdate, updateQueryable(queryToUpdate, update));

  return query;
}

export function updateQuery(
  index: number,
  path: QueryPath[],
  update: QueryUpdate,
  queries: Queryable[]
): Queryable[] {
  const newQueries: Queryable[] = [...queries];

  // only update the one query by index
  newQueries[index] = updateOneQuery(path, update, queries[index]);

  return newQueries;
}

/**
 * Toggle a prompt on or off
 */
export function togglePromptEnabled(
  prompt: Prompt,
  settings: Settings
): Settings {
  if (settings.enabledPrompts.has(prompt)) {
    settings.enabledPrompts.delete(prompt);
  } else {
    settings.enabledPrompts.add(prompt);
  }

  return {
    ...settings,
    enabledPrompts: settings.enabledPrompts,
  };
}

/**
 * Delete all data for a specific prompt from all journal entries
 */
export function deletePromptData(prompt: Prompt, state: AppState): AppState {
  for (const entry of state.journalEntries) {
    entry.promptResponses[prompt] = 1;
  }

  return { ...state, journalEntries: state.journalEntries };
}

export async function updateImportFile(
  target: HTMLInputElement
): Promise<AppState | Settings | string | null> {
  if (!target) {
    return null;
  }

  if (target.files === null || target.files.length === 0) return null;

  if (target.files[0].name.endsWith(".json")) {
    const fileContents = await target.files[0].text();
    return importDataFromJson(fileContents);
  }

  return null;
}
