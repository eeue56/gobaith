import {
  attribute,
  button,
  class_,
  div,
  h2,
  h3,
  HtmlNode,
  on,
  p,
  text,
} from "@eeue56/coed";
import {
  Prompt,
  PROMPT_PACKS,
  PromptPackName,
  PROMPT_PACK_NAMES,
  Settings,
  Update,
} from "../../types";

/**
 * Render the first-time setup screen with prompt pack selection
 */
export function renderFirstTimeSetup(): HtmlNode<Update> {
  return div(
    [],
    [class_("first-time-setup"), class_("tab-content")],
    [
      div(
        [],
        [class_("setup-container")],
        [
          h2([], [], [text("Welcome to Gobaith")]),
          p(
            [],
            [],
            [
              text(
                "To get started, please choose a set of prompts that best matches your tracking needs. You can customize these later in Settings."
              ),
            ]
          ),
          ...PROMPT_PACK_NAMES.map((packName) =>
            renderPromptPackOption(packName)
          ),
        ]
      ),
    ]
  );
}

/**
 * Render a single prompt pack option
 */
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
          text(prompts.join(", ")),
        ]
      ),
      button(
        [on("click", () => selectPromptPack(packName))],
        [class_("select-pack-button"), attribute("id", `select-pack-${packName}`)],
        [text(`Use ${packName} prompts`)]
      ),
    ]
  );
}

/**
 * Get a description for each prompt pack
 */
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

/**
 * Update function to select a prompt pack
 */
function selectPromptPack(packName: PromptPackName): Update {
  return { kind: "SelectPromptPack", packName };
}

/**
 * Render prompt configuration in settings
 */
export function renderPromptConfiguration(settings: Settings): HtmlNode<Update> {
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
    ]
  );
}

/**
 * Render a prompt pack with toggles for individual prompts
 */
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

/**
 * Render a toggle for a single prompt
 */
function renderPromptToggle(
  prompt: Prompt,
  isEnabled: boolean
): HtmlNode<Update> {
  return div(
    [],
    [class_("prompt-toggle-item")],
    [
      button(
        [on("click", () => togglePrompt(prompt))],
        [
          class_("prompt-toggle-button"),
          class_(isEnabled ? "enabled" : "disabled"),
          attribute("data-prompt", prompt),
        ],
        [text(isEnabled ? "✓" : "○"), text(" "), text(prompt)]
      ),
    ]
  );
}

/**
 * Update function to toggle a prompt
 */
function togglePrompt(prompt: Prompt): Update {
  return { kind: "TogglePrompt", prompt };
}

/**
 * Render option to delete data for disabled prompts
 */
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
      ...disabledPrompts.map((prompt) => renderDeletePromptButton(prompt)),
    ]
  );
}

/**
 * Render a button to delete data for a specific prompt
 */
function renderDeletePromptButton(prompt: Prompt): HtmlNode<Update> {
  return div(
    [],
    [class_("delete-prompt-item")],
    [
      text(prompt),
      button(
        [on("click", () => deletePromptData(prompt))],
        [class_("delete-prompt-button"), attribute("data-delete-prompt", prompt)],
        [text("Delete data")]
      ),
    ]
  );
}

/**
 * Update function to delete prompt data
 */
function deletePromptData(prompt: Prompt): Update {
  return { kind: "DeletePromptData", prompt };
}
