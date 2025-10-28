import {
  attribute,
  button,
  class_,
  div,
  HtmlNode,
  input,
  on,
  text,
} from "@eeue56/coed";
import {
  Direction,
  dontSend,
  JournalEntry,
  PillOrderDirection,
  Settings,
  Update,
} from "../../types";
import { iconPill } from "./icons";

export function renderPill(
  entry: JournalEntry,
  pill: string
): HtmlNode<Update> {
  const amountTaken = entry.pills[pill];

  function makeCallback(direction: Direction): () => Update {
    return (): Update => {
      return {
        kind: "UpdatePillValue",
        pillName: pill,
        entry: entry,
        direction: direction,
      };
    };
  }

  return div(
    [],
    [class_("prompt-group"), class_("journal-pill")],
    [
      div([], [], [div([], [class_("prompt")], [text(pill)])]),
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
          input(
            [],
            [
              attribute("id", "new-pill-name"),
              attribute("type", "text"),
              attribute("placeholder", "Medication name"),
            ]
          ),
          input(
            [],
            [
              attribute("id", "new-pill-dosage"),
              attribute("type", "text"),
              attribute("placeholder", "Dosage (e.g., 100mg)"),
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
    console.error("Medication name is required");
    return dontSend();
  }

  // Combine name and dosage with a space if dosage is provided
  const pill = dosage ? `${name} ${dosage}` : name;

  // Clear the input fields after successful submission
  pillNameElement.value = "";
  pillDosageElement.value = "";

  return {
    kind: "AddPill",
    pillName: pill,
  };
}

export function renderPillOrder(settings: Settings): HtmlNode<Update> {
  const pills: HtmlNode<Update>[] = settings.currentPills.map((pillName) => {
    function makeCallback(direction: PillOrderDirection): () => Update {
      return (): Update => {
        return {
          kind: "UpdatePillOrder",
          pillName: pillName,
          direction: direction,
        };
      };
    }

    return div(
      [],
      [],
      [
        div([], [], [text(pillName)]),
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
