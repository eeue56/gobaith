import {
  attribute,
  button,
  class_,
  div,
  HtmlNode,
  on,
  text,
  textarea,
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
      textarea(
        [],
        [
          attribute("id", "new-pill-entry"),
          attribute("placeholder", "Enter a med name with dosage..."),
        ],
        []
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
  const pillEntryElement: HTMLTextAreaElement | null = document.getElementById(
    "new-pill-entry"
  ) as HTMLTextAreaElement | null;

  if (!pillEntryElement) {
    console.error("Couldn't find new-pill-entry");
    return dontSend();
  }
  const pill = pillEntryElement.value;

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
