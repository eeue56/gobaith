import { EventHandler, RenderedWithEvents } from "../types";

let latestHashString = "a";

const hashCache: Record<string, string> = {};

/**
 * Makes a unique id from a string that is compatible with the DOM
 *
 * ids are intentionally short strings from the letters a-z, repeated
 */
export function idHash(str: string): string {
  // when we haven't cached an id for this string
  if (!(str in hashCache)) {
    // if we need more characters to create a unique id (i.e we are at "z", then go to "aa")
    if (latestHashString.endsWith("z")) {
      latestHashString = "a".repeat(unique.length + 1);
    } else {
      // otherwise, just increment the last char in the string (i.e "ab" goes to "ac")
      const lastChar = latestHashString.charCodeAt(latestHashString.length - 1);
      latestHashString =
        latestHashString.slice(0, latestHashString.length - 1) + String.fromCharCode(lastChar + 1);
    }
    hashCache[str] = latestHashString;
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
  return encodeURI(str.replaceAll("'", "").replaceAll('"', "")).toLowerCase();
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
