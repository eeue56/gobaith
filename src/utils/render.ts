import { EventHandler, RenderedWithEvents } from "../types";

let unique = "a";

const hashCache: Record<string, string> = {};

/**
 * Makes a unique id from a string that is compatible with the DOM
 */
export function idHash(str: string): string {
  if (!(str in hashCache)) {
    if (unique.endsWith("z")) {
      unique = "a".repeat(unique.length + 1);
    } else {
      const finalChar = unique.charCodeAt(unique.length - 1);
      unique =
        unique.slice(0, unique.length - 1) + String.fromCharCode(finalChar + 1);
    }
    hashCache[str] = unique;
  }

  return hashCache[str];
}

/**
 * Similar to idHash, but converts the string to a lowercase uri-encoded string
 *
 * Useful for hashes that need to be used both in the service worker, and the DOM
 *
 * Not the default, since idHash will create smaller DOM ids.
 */
export function staticHash(str: string): string {
  return encodeURI(str).toLowerCase();
}

/**
 * Use as a template-literal prefix to enforce renderer structure
 *
 * Only allows numbers, strings or `Renderer` in the template string literal.
 *
 * e.g
 *
 * This will throw an error:
 *
 * ```
 *  const x = {};
 *  renderer`${x}`
 * ```
 */
export function renderer(
  strings: TemplateStringsArray,
  ...vars: (string | number | RenderedWithEvents)[]
): RenderedWithEvents {
  const body: string[] = [];
  const eventListeners: EventHandler[] = [];
  for (var i = 0; i < strings.length; i++) {
    const value = strings[i];

    body.push(value);

    if (i < vars.length) {
      const currentVariable = vars[i];
      if (typeof currentVariable === "string") {
        body.push(currentVariable);
      } else if (typeof currentVariable === "number") {
        body.push(currentVariable.toString());
      } else {
        body.push(currentVariable.body);
        eventListeners.push(...currentVariable.eventListeners);
      }
    }
  }
  return {
    body: body.join(""),
    eventListeners: eventListeners,
  };
}
