import {
  attribute,
  button,
  class_,
  div,
  HtmlNode,
  input,
  label,
  on,
  text,
} from "@eeue56/coed";
import {
  Direction,
  dontSend,
  JournalEntry,
  Pill,
  pillDisplayName,
  pillKey,
  PillOrderDirection,
  Settings,
  Update,
} from "../../types";
import { iconPill } from "./icons";

export function renderPill(
  entry: JournalEntry,
  pill: Pill
): HtmlNode<Update> {
  const key = pillKey(pill);
  const amountTaken = entry.pills[key];

  function makeCallback(direction: Direction): () => Update {
    return (): Update => {
      return {
        kind: "UpdatePillValue",
        pillName: key,
        entry: entry,
        direction: direction,
      };
    };
  }

  return div(
    [],
    [class_("prompt-group"), class_("journal-pill")],
    [
      div([], [], [div([], [class_("prompt")], [text(pillDisplayName(pill))])]),
      div(
        [],
        [],
        [
          button(
            [on("click", makeCallback("Previous"))],
            [class_("prompt-answer")],
            [text("Minus")]
          ),
          button(
            [on("click", makeCallback("Next"))],
            [class_("pill-amount-taken")],
            [text(amountTaken.toString())]
          ),
          button([], [class_("prompt-answer")], [text("Plus")]),
        ]
      ),
    ]
  );
}

export function renderAddPill(): HtmlNode<Update> {
  return div(
    [],
    [class_("pill-entry-container")],
    [
      div(
        [],
        [class_("pill-input-row")],
        [
          div(
            [],
            [class_("pill-input-group")],
            [
              label([], [attribute("for", "new-pill-name")], [text("Medication name")]),
              input(
                [],
                [
                  attribute("type", "text"),
                  attribute("id", "new-pill-name"),
                  attribute("placeholder", "e.g., Paracetamol"),
                ]
              ),
            ]
          ),
          div(
            [],
            [class_("pill-input-group")],
            [
              label([], [attribute("for", "new-pill-dosage")], [text("Dosage")]),
              input(
                [],
                [
                  attribute("type", "text"),
                  attribute("id", "new-pill-dosage"),
                  attribute("placeholder", "e.g., 100mg"),
                ]
              ),
            ]
          ),
        ]
      ),
      button(
        [on("click", updateAddPill)],
        [attribute("id", "add-pill")],
        [text("Add"), iconPill]
      ),
    ]
  );
}

function updateAddPill(): Update {
  const pillNameElement: HTMLInputElement | null = document.getElementById(
    "new-pill-name"
  ) as HTMLInputElement | null;
  const pillDosageElement: HTMLInputElement | null = document.getElementById(
    "new-pill-dosage"
  ) as HTMLInputElement | null;

  if (!pillNameElement || !pillDosageElement) {
    console.error("Couldn't find pill input elements");
    return dontSend();
  }

  const name = pillNameElement.value.trim();
  const dosage = pillDosageElement.value.trim();

  if (!name) {
    console.error("Pill name is required");
    return dontSend();
  }

  // Note: Fields are not cleared here to preserve user input in case of errors.
  // This allows users to easily modify and retry if needed (e.g., fixing duplicates).
  
  return {
    kind: "AddPill",
    pill: Pill(name, dosage),
  };
}

export function renderPillOrder(settings: Settings): HtmlNode<Update> {
  const pills: HtmlNode<Update>[] = settings.currentPills.map((pill) => {
    function makeCallback(direction: PillOrderDirection): () => Update {
      return (): Update => {
        return {
          kind: "UpdatePillOrder",
          pill: pill,
          direction: direction,
        };
      };
    }

    return div(
      [],
      [],
      [
        div([], [], [text(pillDisplayName(pill))]),
        div(
          [on("click", makeCallback("Top"))],
          [class_("button")],
          [text("Top")]
        ),
        div(
          [on("click", makeCallback("Up"))],
          [class_("button")],
          [text("Up")]
        ),
        div(
          [on("click", makeCallback("Down"))],
          [class_("button")],
          [text("Down")]
        ),
      ]
    );
  });

  return div([], [], pills);
}
