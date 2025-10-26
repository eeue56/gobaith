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
      1: "#a8e6f5",
      2: "#5eb8d6",
      3: "#3a8fa8",
      4: "#2b6d80",
    },
    depression: {
      1: "#f9b3e0",
      2: "#f573c9",
      3: "#f748b7",
      4: "#c73594",
    },
    anxiety: {
      1: "#fff175",
      2: "#f5e645",
      3: "#e8d600",
      4: "#bfb000",
    },
    elevation: {
      1: "#ffb380",
      2: "#ff8c4d",
      3: "#e74b1a",
      4: "#b83b15",
    },
    irrability: {
      1: "#b3f585",
      2: "#8ef05c",
      3: "#77ef3d",
      4: "#5ec930",
    },
    psychotic: {
      1: "#ff9999",
      2: "#ff6666",
      3: "#d93526",
      4: "#a82a1f",
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
