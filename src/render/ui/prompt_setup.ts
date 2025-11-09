import {
  attribute,
  button,
  class_,
  div,
  h2,
  h3,
  HtmlNode,
  i,
  input,
  on,
  p,
  text,
} from "@eeue56/coed";
import {
  Prompt,
  PROMPT_PACK_NAMES,
  PROMPT_PACKS,
  PromptPackName,
  Settings,
  SHORT_PROMPTS,
  Update,
} from "../../types";
import { iconBlock, iconCheck, iconDelete } from "./icons";

export function renderFirstTimeSetup(): HtmlNode<Update> {
  return div(
    [],
    [class_("first-time-setup"), class_("tab-content")],
    [
      div(
        [],
        [class_("setup-container")],
        [
          h2(
            [],
            [],
            [
              text("Welcome to Gobaith, "),
              i([], [], [text("your")]),
              text(" mental health tracker"),
            ]
          ),
          p(
            [],
            [],
            [
              text(
                "Choose a set of prompts that best matches your current struggles. You can customize these later in Settings."
              ),
            ]
          ),
          ...PROMPT_PACK_NAMES.map(renderPromptPackOption),
        ]
      ),
    ]
  );
}

function renderPromptPackOption(packName: PromptPackName): HtmlNode<Update> {
  const prompts = PROMPT_PACKS[packName];
  const description = getPackDescription(packName);

  return div(
    [],
    [class_("prompt-pack-option")],
    [
      h3([], [], [text(packName)]),
      p([], [class_("pack-description")], [text(description)]),
      div(
        [],
        [class_("pack-prompts")],
        [
          text("Includes: "),
          text(prompts.map((prompt) => SHORT_PROMPTS[prompt]).join(", ")),
        ]
      ),
      button(
        [
          on("click", () => {
            return { kind: "SelectPromptPack", packName };
          }),
        ],
        [
          class_("select-pack-button"),
          attribute("id", `select-pack-${packName}`),
        ],
        [text(`Use the ${packName} prompts`)]
      ),
    ]
  );
}

function getPackDescription(packName: PromptPackName): string {
  switch (packName) {
    case "Bipolar":
      return "Track mood swings, depression, elevation, and related symptoms commonly associated with bipolar disorder.";
    case "Schizophrenia":
      return "Monitor psychotic symptoms, anxiety, and sleep patterns important for managing schizophrenia.";
    case "ADHD":
      return "Track focus, concentration, hyperactivity, and impulsivity related to ADHD.";
  }
}

export function renderPromptConfiguration(
  settings: Settings
): HtmlNode<Update> {
  return div(
    [],
    [class_("prompt-configuration")],
    [
      h3([], [], [text("Configure Prompts")]),
      p(
        [],
        [],
        [
          text(
            "Enable or disable prompts. Disabling a prompt will hide it from your daily journal, but your historical data will be preserved."
          ),
        ]
      ),
      div(
        [],
        [class_("prompt-packs")],
        PROMPT_PACK_NAMES.map((packName) =>
          renderPromptPackToggle(packName, settings)
        )
      ),
      renderCustomPromptsSection(settings),
    ]
  );
}

function renderCustomPromptsSection(settings: Settings): HtmlNode<Update> {
  return div(
    [],
    [class_("custom-prompts-section")],
    [
      h3([], [], [text("Custom Prompts")]),
      p(
        [],
        [],
        [
          text(
            "Add your own custom prompts to track. Note: Custom prompts will appear with a default neutral color scheme."
          ),
        ]
      ),
      div(
        [],
        [class_("add-custom-prompt")],
        [
          input(
            [],
            [
              attribute("type", "text"),
              attribute("id", "new-custom-prompt"),
              attribute("placeholder", "e.g., Today's stress level"),
              class_("custom-prompt-input"),
            ]
          ),
          button(
            [
              on("click", () => {
                const input = document.getElementById(
                  "new-custom-prompt"
                ) as HTMLInputElement;
                if (input && input.value.trim()) {
                  const promptText = input.value.trim();
                  input.value = "";
                  return { kind: "AddCustomPrompt", promptText };
                }
                return { kind: "Noop" };
              }),
            ],
            [
              class_("add-custom-prompt-button"),
              attribute("id", "add-custom-prompt"),
            ],
            [text("Add Custom Prompt")]
          ),
        ]
      ),
      ...(settings.customPrompts.length > 0
        ? [
            div(
              [],
              [class_("custom-prompts-list")],
              settings.customPrompts.map((prompt) =>
                renderCustomPromptItem(prompt)
              )
            ),
          ]
        : []),
    ]
  );
}

function renderCustomPromptItem(prompt: string): HtmlNode<Update> {
  return div(
    [],
    [class_("custom-prompt-item")],
    [
      div([], [class_("custom-prompt-text")], [text(prompt)]),
      button(
        [
          on("click", () => {
            return { kind: "RemoveCustomPrompt", promptText: prompt };
          }),
        ],
        [class_("remove-custom-prompt-button")],
        [text("Remove"), iconDelete]
      ),
    ]
  );
}

function renderPromptPackToggle(
  packName: PromptPackName,
  settings: Settings
): HtmlNode<Update> {
  const prompts = PROMPT_PACKS[packName];

  return div(
    [],
    [class_("prompt-pack-toggle")],
    [
      h3([], [class_("pack-name")], [text(packName)]),
      ...prompts.map((prompt) =>
        renderPromptToggle(prompt, settings.enabledPrompts.has(prompt))
      ),
    ]
  );
}

function renderPromptToggle(
  prompt: Prompt,
  isEnabled: boolean
): HtmlNode<Update> {
  return div(
    [],
    [class_("prompt-toggle-item")],
    [
      button(
        [
          on("click", () => {
            return { kind: "TogglePrompt", prompt };
          }),
        ],
        [
          class_("prompt-toggle-button"),
          class_(isEnabled ? "enabled" : "disabled"),
          attribute("data-prompt", prompt),
        ],
        [isEnabled ? iconCheck : iconBlock, text(" "), text(prompt)]
      ),
    ]
  );
}

export function renderDeletePromptData(settings: Settings): HtmlNode<Update> {
  const disabledPrompts = Array.from(
    new Set(
      PROMPT_PACK_NAMES.flatMap((packName) =>
        PROMPT_PACKS[packName].filter(
          (prompt) => !settings.enabledPrompts.has(prompt)
        )
      )
    )
  );

  if (disabledPrompts.length === 0) {
    return div([], [], []);
  }

  return div(
    [],
    [class_("delete-prompt-data")],
    [
      h3([], [], [text("Delete Old Prompt Data")]),
      p(
        [],
        [],
        [
          text(
            "You have disabled some prompts. You can delete the historical data for these prompts if you no longer need it."
          ),
        ]
      ),
      ...[...disabledPrompts, ...settings.customPrompts].map((prompt) =>
        renderDeletePromptButton(prompt)
      ),
    ]
  );
}

function renderDeletePromptButton(prompt: Prompt | string): HtmlNode<Update> {
  return div(
    [],
    [class_("delete-prompt-item")],
    [
      text(prompt),
      button(
        [
          on("click", () => {
            return { kind: "DeletePromptData", prompt };
          }),
        ],
        [
          class_("delete-prompt-button"),
          attribute("data-delete-prompt", prompt),
        ],
        [text("Delete data"), iconDelete]
      ),
    ]
  );
}
