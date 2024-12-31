/**
 * Put the database version into the data
 */
export function markDatabaseVersion(data: unknown, version: number): unknown {
  if (typeof data === "object") {
    (data as any)["databaseVersion"] = version;
    return data;
  }
  return data;
}
