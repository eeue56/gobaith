import { Attribute, Event, HtmlNode, nodeNS, Tag } from "@eeue56/coed";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function svgText<msg>(
  events: Event<msg>[],
  attributes: Attribute[],
  children: HtmlNode<msg>[]
): HtmlNode<msg> {
  return nodeNS("text" as Tag, SVG_NAMESPACE, events, attributes, children);
}
