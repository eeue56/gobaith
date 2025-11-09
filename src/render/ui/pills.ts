import {
  attribute,
  button,
  class_,
  div,
  h4,
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
import {
  iconAdd,
  iconArrowDownward,
  iconArrowUpward,
  iconPill,
  iconRemove,
  iconVerticalAlignTop,
} from "./icons";

export function renderPill(entry: JournalEntry, pill: Pill): HtmlNode<Update> {
  const key = pillKey(pill);
  const amountTaken = entry.pills[key] || 0;

  function makeCallback(direction: Direction): () => Update {
    return (): Update => {
      return {
        kind: "UpdatePillValue",
        pill: pill,
        entry: entry,
        direction: direction,
      };
    };
  }

  return div(
    [],
    [class_("prompt-group"), class_("journal-pill")],
    [
      div([], [class_("prompt")], [h4([], [], [text(pillDisplayName(pill))])]),
      div(
        [],
        [class_("pill-controls")],
        [
          button(
            [on("click", makeCallback("Previous"))],
            [class_("pill-button")],
            [iconRemove]
          ),
          div(
            [],
            [class_("pill-count-display")],
            [text(amountTaken.toString())]
          ),
          button(
            [on("click", makeCallback("Next"))],
            [class_("pill-button")],
            [iconAdd]
          ),
        ]
      ),
    ]
  );
}

function renderPillNameInput(): HtmlNode<never> {
  return div(
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
  );
}

function renderPillDosageInput(): HtmlNode<never> {
  return div(
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
  );
}

function renderAddPillButton(): HtmlNode<Update> {
  return button(
    [on("click", updateAddPill)],
    [attribute("id", "add-pill")],
    [text("Add"), iconPill]
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
        [renderPillNameInput(), renderPillDosageInput()]
      ),
      renderAddPillButton(),
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

  return {
    kind: "AddPill",
    pill: Pill(name, dosage),
  };
}

function makePillOrderCallback(
  pill: Pill,
  direction: PillOrderDirection
): () => Update {
  return (): Update => {
    return {
      kind: "UpdatePillOrder",
      pill: pill,
      direction: direction,
    };
  };
}

function renderPillItemInOrder(pill: Pill): HtmlNode<Update> {
  return div(
    [],
    [class_("pill-order-item")],
    [
      div([], [class_("pill-order-name")], [text(pillDisplayName(pill))]),
      div(
        [],
        [class_("pill-order-controls")],
        [
          button(
            [on("click", makePillOrderCallback(pill, "Top"))],
            [class_("pill-order-button"), attribute("title", "Move to top")],
            [iconVerticalAlignTop]
          ),
          button(
            [on("click", makePillOrderCallback(pill, "Up"))],
            [class_("pill-order-button"), attribute("title", "Move up")],
            [iconArrowUpward]
          ),
          button(
            [on("click", makePillOrderCallback(pill, "Down"))],
            [class_("pill-order-button"), attribute("title", "Move down")],
            [iconArrowDownward]
          ),
        ]
      ),
    ]
  );
}

export function renderPillOrder(settings: Settings): HtmlNode<Update> {
  const pills: HtmlNode<Update>[] = settings.currentPills.map(
    renderPillItemInOrder
  );

  return div([], [class_("pill-order-container")], pills);
}
