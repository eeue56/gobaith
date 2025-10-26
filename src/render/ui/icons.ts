import { attribute, class_, HtmlNode, span, style_, text } from "@eeue56/coed";
import { circle, svg } from "@eeue56/coed/svg";
import { MoodValue, Prompt, SHORT_PROMPTS } from "../../types";

function icon(iconName: string): HtmlNode<never> {
  return span([], [class_("material-symbols-outlined")], [text(iconName)]);
}

export const iconPill: HtmlNode<never> = icon("pill");

export const iconTrackChanges: HtmlNode<never> = icon("track_changes");

export const iconAnalytics: HtmlNode<never> = icon("analytics");

export const iconUpload: HtmlNode<never> = icon("upload");

export const iconSettings: HtmlNode<never> = icon("settings");

export const iconSave: HtmlNode<never> = icon("save");

export const iconDelete: HtmlNode<never> = icon("delete");

export const iconToday: HtmlNode<never> = icon("today");

export const iconBack: HtmlNode<never> = icon("arrow_back");

export const iconForward: HtmlNode<never> = icon("arrow_forward");

function circleMoodIcon(
  innerRadiusSize: number,
  innerCircleColour: string
): HtmlNode<never> {
  return svg(
    [],
    [
      attribute("viewBox", "0 0 40 40"),
      attribute("role", "img"),
      attribute("xmlns", "http://www.w3.org/2000/svg"),
    ],
    [
      circle(
        [],
        [
          class_("outer-circle"),
          attribute("cx", "20"),
          attribute("cy", "20"),
          attribute("r", "14"),
          attribute("fill", "none"),
          attribute("stroke", "#8A8F98"),
          attribute("stroke-width", "2"),
        ]
      ),
      circle(
        [],
        [
          class_("inner-circle"),
          attribute("cx", "20"),
          attribute("cy", "20"),
          attribute("r", `${innerRadiusSize}`),
          attribute("stroke", `${innerCircleColour}`),
          attribute("stroke-width", "0"),
          style_("fill", `${innerCircleColour}`),
        ]
      ),
    ]
  );
}

export function getCircleMoodIcon(mood: MoodValue, prompt: Prompt): HtmlNode<never> {
  const promptShort = SHORT_PROMPTS[prompt].toLowerCase();
  const colorVar = `var(--${promptShort}-${mood})`;
  
  const radiusSize = mood === 1 ? 4 : mood === 2 ? 6 : mood === 3 ? 8 : 10;
  
  return circleMoodIcon(radiusSize, colorVar);
}
