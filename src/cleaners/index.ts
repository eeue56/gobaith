import { LATEST_DATABASE_VERSION } from "../types";
import { renameStateFields } from "./database_3";
import { addDatabaseVersion } from "./database_4";
import { renameField } from "./rename_fields";

/**
 * Run each cleaner in order.
 */
export function cleanData(data: unknown): unknown {
  if (typeof data !== "object") {
    console.error("Importer: expected object, got", typeof data);
    return data;
  }

  // databaseVersion was added in v4
  if (!("databaseVersion" in (data as any))) {
    // these two operations are safe to do, if the version is < 4
    const migration = renameField(renameStateFields, data);
    data = migration.data;
    console.log("Importer: cleaned", migration.migrated, " entries");
    data = addDatabaseVersion(data);
    console.log("Importer: added database version");
  }

  // make sure we don't overwrite future database versions
  if (((data as any)["databaseVersion"] as number) > LATEST_DATABASE_VERSION) {
    console.warn(
      "Importer: imported data has a newer database version than the app!\nTry refreshing a few times before importing."
    );
    return data;
  }

  // here database version specific cleaning will be added

  return data;
}
