import { MoodValue, Prompt, SHORT_PROMPTS } from "../types";

/**
 * Get the CSS variable name for a specific prompt and mood value
 * @param prompt The prompt name
 * @param moodValue The mood value (1-4)
 * @returns The CSS variable name (e.g., "var(--depression-3)")
 */
export function getPromptColorVariable(
  prompt: Prompt,
  moodValue: MoodValue
): string {
  const shortPrompt = SHORT_PROMPTS[prompt].toLowerCase();
  return `var(--${shortPrompt}-${moodValue})`;
}

/**
 * Get the hex color for a specific prompt and mood value for use in charts
 * @param prompt The prompt name
 * @param moodValue The mood value (1-4)
 * @returns The hex color string
 */
export function getPromptColorHex(
  prompt: Prompt,
  moodValue: MoodValue
): string {
  const colorMap: Record<string, Record<MoodValue, string>> = {
    sleep: {
      1: "#a0d4ce",
      2: "#7bc4bb",
      3: "#5ab4a8",
      4: "#3d9b8f",
    },
    depression: {
      1: "#d4c4e0",
      2: "#c4aed4",
      3: "#b398c8",
      4: "#9d7fb8",
    },
    anxiety: {
      1: "#e8d4a8",
      2: "#ddc488",
      3: "#d2b468",
      4: "#c4a04c",
    },
    elevation: {
      1: "#e8c4b0",
      2: "#e0b098",
      3: "#d89c80",
      4: "#cc8468",
    },
    irrability: {
      1: "#c4dca8",
      2: "#b0cc88",
      3: "#9cbc6c",
      4: "#88a854",
    },
    psychotic: {
      1: "#e8c4cc",
      2: "#e0b0bc",
      3: "#d89cac",
      4: "#cc8498",
    },
  };

  const shortPrompt = SHORT_PROMPTS[prompt].toLowerCase();
  return colorMap[shortPrompt][moodValue];
}

/**
 * Get a representative color for a prompt (using mood value 3 as the default)
 * This is used for line graphs and other visualizations that need a single color per prompt
 * @param prompt The prompt name
 * @returns The hex color string
 */
export function getPromptColor(prompt: Prompt): string {
  return getPromptColorHex(prompt, 3);
}
