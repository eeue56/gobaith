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
      1: "#8ba6b8",
      2: "#6b8a9f",
      3: "#4d6e85",
      4: "#36556b",
    },
    depression: {
      1: "#a88bab",
      2: "#8e6f91",
      3: "#745578",
      4: "#5c3f5f",
    },
    anxiety: {
      1: "#bfa878",
      2: "#a58d5e",
      3: "#8a7347",
      4: "#6f5b34",
    },
    elevation: {
      1: "#b88976",
      2: "#9f6e5b",
      3: "#855543",
      4: "#6b3f30",
    },
    irrability: {
      1: "#8eb889",
      2: "#749e6f",
      3: "#5c8357",
      4: "#466842",
    },
    psychotic: {
      1: "#b88589",
      2: "#9f6a6e",
      3: "#855156",
      4: "#6b3c40",
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
