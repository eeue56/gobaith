import { DebuggingInfo } from "../types";

const DEBUGGING_INFO_KEY = "debugging-info";

export function storeDebuggingInfo(info: DebuggingInfo): void {
  localStorage.setItem(DEBUGGING_INFO_KEY, JSON.stringify(info));
}

export function getDebuggingInfo(): DebuggingInfo | null {
  const infoAsString = localStorage.getItem(DEBUGGING_INFO_KEY);

  if (infoAsString === null) return null;

  try {
    const parsed = JSON.parse(infoAsString);
    return parsed;
  } catch (error) {
    return null;
  }
}
