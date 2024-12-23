type MigrationStatus = { data: unknown; migrated: number };

export type PathPart = {
  kind: "Property" | "Array";
  field: string;
};

export type FieldRename = {
  path: PathPart[];
  before: string;
  after: string;
};

/**
 * Rename a field in the given data.
 * The field may be deeply nested, or in an array.
 *
 * If it is not possible to rename, then do not modify the data.
 */
export function renameField(
  rename: FieldRename,
  data: unknown
): MigrationStatus {
  let dataSlice: unknown = data;

  const pathSoFar: string[] = [];

  // verify we can actually run the rename before attemping to run it
  for (const pathPart of rename.path) {
    switch (pathPart.kind) {
      case "Property": {
        if (!(pathPart.field in (dataSlice as any))) {
          console.error(
            "Cleaner: Expected field",
            pathSoFar.join(" > "),
            "-->",
            pathPart.field,
            "in data model but did not find it. Alternatives:",
            Object.keys(dataSlice as any)
          );
          return { data, migrated: 0 };
        }

        dataSlice = (dataSlice as any)[pathPart.field];
        break;
      }
      case "Array": {
        if (!(pathPart.field in (dataSlice as any))) {
          console.error(
            "Cleaner: Expected array field",
            pathSoFar.join(" > "),
            "-->",
            pathPart.field,
            "in data model but did not find it. Alternatives:",
            Object.keys(dataSlice as any)
          );
          return { data, migrated: 0 };
        }

        if (!Array.isArray((dataSlice as any)[pathPart.field])) {
          console.error(
            "Cleaner: Expected an array field",
            pathSoFar.join(" > "),
            "-->",
            pathPart.field,
            "in data model but it was not an array."
          );
          return { data, migrated: 0 };
        }

        // only check the first item in the array for the next field
        dataSlice = (dataSlice as any)[pathPart.field][0];
        break;
      }
    }

    pathSoFar.push(pathPart.field);
  }

  if (
    !(rename.before in (dataSlice as any)) ||
    rename.after in (dataSlice as any)
  ) {
    console.log("Cleaner: No need for cleaning");
    return { data, migrated: 0 };
  }
  return runRenameField(rename, data, data);
}

/**
 * Actually execute the rename
 */
function runRenameField(
  rename: FieldRename,
  dataSlice: unknown,
  data: unknown
): MigrationStatus {
  if (rename.path.length === 0) {
    (dataSlice as any)[rename.after] = (dataSlice as any)[rename.before];
    delete (dataSlice as any)[rename.before];
    return { data, migrated: 1 };
  }

  const frontPath = rename.path[0];
  const renameWithoutFront = {
    ...rename,
    path: rename.path.slice(1, rename.path.length),
  };

  switch (frontPath.kind) {
    case "Property": {
      const nextSlice = (dataSlice as any)[frontPath.field];
      return runRenameField(renameWithoutFront, nextSlice, data);
    }
    case "Array": {
      const migration: MigrationStatus = { data, migrated: 0 };
      const fields: unknown[] = (dataSlice as any)[frontPath.field];

      for (const x of fields) {
        const status = runRenameField(renameWithoutFront, x, data);
        migration.migrated += status.migrated;
        migration.data = status.data;
      }

      return migration;
    }
  }
}
