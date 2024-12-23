export function addDatabaseVersion(data: unknown): unknown {
  if (typeof data === "object") {
    // only add databaseVersion if it's not already there
    if ("databaseVersion" in (data as any)) {
      return data;
    }
    (data as any)["databaseVersion"] = 4;
    return data;
  }
  return data;
}
