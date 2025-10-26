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
      1: "#a8c5c0",
      2: "#87ada8",
      3: "#6a9490",
      4: "#527a78",
    },
    depression: {
      1: "#c4b8c8",
      2: "#a99db3",
      3: "#8e849a",
      4: "#756b81",
    },
    anxiety: {
      1: "#d4c4b0",
      2: "#bfab94",
      3: "#a89179",
      4: "#8f7862",
    },
    elevation: {
      1: "#d9b8a8",
      2: "#c49f8c",
      3: "#ad8672",
      4: "#946e5b",
    },
    irrability: {
      1: "#b8c9a8",
      2: "#9fb38c",
      3: "#879b72",
      4: "#70825b",
    },
    psychotic: {
      1: "#d4b0b8",
      2: "#bf969f",
      3: "#a87d87",
      4: "#8f666f",
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
