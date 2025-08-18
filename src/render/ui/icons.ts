import { attribute, class_, HtmlNode, span, style_, text } from "@eeue56/coed";
import { circle, svg } from "@eeue56/coed/svg";
import { MoodValue } from "../../types";

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

export const circle1 = circleMoodIcon(4, "var(--mood-1)");
export const circle2 = circleMoodIcon(6, "var(--mood-2)");
export const circle3 = circleMoodIcon(8, "var(--mood-3)");
export const circle4 = circleMoodIcon(10, "var(--mood-4)");

export function getCircleMoodIcon(mood: MoodValue): HtmlNode<never> {
  switch (mood) {
    case 1:
      return circle1;
    case 2:
      return circle2;
    case 3:
      return circle3;
    case 4:
      return circle4;
  }
}
