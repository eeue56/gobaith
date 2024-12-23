import { renameStateFields } from "./database_3";
import { renameField } from "./rename_fields";

/**
 * Run each cleaner in order.
 */
export function cleanData(data: unknown): unknown {
  const migration = renameField(renameStateFields, data);
  console.log("Importer: cleaned", migration.migrated, " entries");
  return migration.data;
}
