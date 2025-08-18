import { DebuggingInfo } from "../types";

const DEBUGGING_INFO_KEY = "debugging-info";

export function storeDebuggingInfo(info: DebuggingInfo): void {
  localStorage.setItem(DEBUGGING_INFO_KEY, JSON.stringify(info));
}

export function getDebuggingInfo(): DebuggingInfo | null {
  const infoAsString = localStorage.getItem(DEBUGGING_INFO_KEY);

  console.log("debug info:", infoAsString);

  if (infoAsString === null) return null;

  try {
    const parsed = JSON.parse(infoAsString);

    console.log("debug info parsed:", parsed);

    return parsed;
  } catch (error) {
    console.error("debug error", error);
    return null;
  }
}
