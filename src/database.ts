import {
  APP_STATE_OBJECT_STORE_NAME,
  AppState,
  DatabaseVersion,
  isDatabaseVersion,
  LATEST_DATABASE_VERSION,
  Settings,
  SETTINGS_OBJECT_STORE_NAME,
  StoreName,
} from "./types";

import { renameStateFields } from "./cleaners/database_3";
import { addDatabaseVersion } from "./cleaners/database_4";
import { addQueriesToSettings } from "./cleaners/database_5";
import { renameField } from "./cleaners/rename_fields";

async function getObject(
  storeName: StoreName,
  transaction: IDBTransaction
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const store = transaction.objectStore(storeName);
    const obj = store.get(storeName);

    obj.onsuccess = () => {
      resolve(obj.result);
    };

    obj.onerror = (event) => {
      const message = `IndexedDB: failed to fetch ${storeName}`;
      reject(message);
    };
  });
}

async function putObject(
  storeName: StoreName,
  value: unknown,
  transaction: IDBTransaction,
  db: IDBDatabase
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const store = transaction.objectStore(storeName);

    store.put(value);

    transaction.onerror = (event) => {
      const message = `Database failed to write data during migration`;
      console.error(message, event);
      reject(message);
    };

    transaction.oncomplete = () => {
      resolve(db);
    };
  });
}

function upgradeDatabaseToVersion3(
  db: IDBDatabase,
  transaction: IDBTransaction
): Promise<IDBDatabase> {
  return new Promise(async (resolve, reject) => {
    // load from the database
    const storeName = APP_STATE_OBJECT_STORE_NAME;

    console.log("IndexedDB: creating transaction");
    const currentData = await getObject(storeName, transaction);

    if (typeof currentData === "undefined") {
      console.log("IndexedDB: no entry yet, no need to migrate");
      resolve(db);
      return;
    }

    console.info("IndexedDB: renaming the fields...");
    const renamedData = renameField(renameStateFields, currentData);
    console.log(`IndexedDB: migrated ${renamedData.migrated} entries.`);

    if (renamedData.migrated === 0) {
      console.log("IndexedDB: no changes to data, skipping write.");
      resolve(db);
      return;
    }

    // store in the database
    console.info("IndexedDB: writing to the store");
    try {
      const _db = await putObject(storeName, renamedData.data, transaction, db);
      resolve(_db);
    } catch (error) {
      reject(error);
    }
  });
}

function upgradeDatabaseToVersion4(
  db: IDBDatabase,
  transaction: IDBTransaction
): IDBDatabase | Promise<IDBDatabase> {
  return new Promise(async (resolve, reject) => {
    // load from the database
    console.log("IndexedDB: creating transaction");

    {
      const storeName = APP_STATE_OBJECT_STORE_NAME;
      const currentData = await getObject(storeName, transaction);

      if (typeof currentData === "undefined") {
        console.log("IndexedDB: no entry yet, no need to migrate");
        resolve(db);
        return;
      }

      const newData = addDatabaseVersion(currentData);

      // store in the database
      console.info(
        "IndexedDB: writing to the store",
        APP_STATE_OBJECT_STORE_NAME,
        newData
      );

      try {
        await putObject(storeName, newData, transaction, db);
      } catch (error) {
        reject(error);
        return;
      }
    }

    {
      const storeName = SETTINGS_OBJECT_STORE_NAME;
      const currentData = await getObject(storeName, transaction);

      if (typeof currentData === "undefined") {
        console.log("IndexedDB: no entry yet, no need to migrate");
        resolve(db);
        return;
      }

      const newData = addDatabaseVersion(currentData);

      // store in the database
      console.info(
        "IndexedDB: writing to the store",
        SETTINGS_OBJECT_STORE_NAME,
        newData
      );

      try {
        await putObject(storeName, newData, transaction, db);
      } catch (error) {
        reject(error);
        return;
      }
    }

    resolve(db);
  });
}

function upgradeDatabaseToVersion5(
  db: IDBDatabase,
  transaction: IDBTransaction
): IDBDatabase | Promise<IDBDatabase> {
  return new Promise(async (resolve, reject) => {
    // load from the database
    console.log("IndexedDB: creating transaction");
    const storeName = SETTINGS_OBJECT_STORE_NAME;
    const currentData = await getObject(storeName, transaction);

    if (typeof currentData === "undefined") {
      console.log("IndexedDB: no entry yet, no need to migrate");
      resolve(db);
      return;
    }

    const newData = addQueriesToSettings(currentData);

    // store in the database
    console.info(
      "IndexedDB: writing to the store",
      SETTINGS_OBJECT_STORE_NAME,
      newData
    );

    try {
      await putObject(storeName, newData, transaction, db);
    } catch (error) {
      reject(error);
      return;
    }
  });
}

/**
 * Run a migration for a specific version of the database
 * These should be written by hand, most of the time.
 */
async function runMigration(
  version: DatabaseVersion,
  db: IDBDatabase,
  transaction: IDBTransaction
): Promise<IDBDatabase> {
  switch (version) {
    case 0:
    case 1: {
      if (!db.objectStoreNames.contains(SETTINGS_OBJECT_STORE_NAME)) {
        db.createObjectStore(SETTINGS_OBJECT_STORE_NAME, {
          keyPath: "kind",
        });
      }

      if (!db.objectStoreNames.contains(APP_STATE_OBJECT_STORE_NAME)) {
        db.createObjectStore(APP_STATE_OBJECT_STORE_NAME, {
          keyPath: "kind",
        });
      }
      return db;
    }
    case 2: {
      return db;
    }
    case 3: {
      console.info(
        "IndexedDB: Renaming elevatation => elevation\nThis was an intentional mispelling to demostrate how to rename fields without losing data."
      );
      return upgradeDatabaseToVersion3(db, transaction);
    }
    case 4: {
      console.info(
        "IndexedDB: Add database version to AppState / Settings so it's easier to import/export."
      );
      return upgradeDatabaseToVersion4(db, transaction);
    }
    case 5: {
      console.info("IndexedDB: Adding queries to settings");
      return upgradeDatabaseToVersion5(db, transaction);
    }
  }
}

/**
 * Run every migration between the old version and the new version
 */
async function runMigrations(
  db: IDBDatabase,
  transaction: IDBTransaction,
  previousVersion: DatabaseVersion,
  newVersion: DatabaseVersion
): Promise<IDBDatabase | string> {
  const versionToStartPatchAt = previousVersion + 1;
  if (!isDatabaseVersion(versionToStartPatchAt)) {
    return `Error: ${versionToStartPatchAt} is not a known database version`;
  }

  for (let i = versionToStartPatchAt; i <= newVersion; i++) {
    try {
      db = await runMigration(i, db, transaction);
    } catch (error) {
      console.error(error);
      return `Error running migration from version ${previousVersion} to ${newVersion}`;
    }
  }

  return db;
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise(async (resolve, reject) => {
    const request = indexedDB.open("mood-tracker", LATEST_DATABASE_VERSION);

    request.onupgradeneeded = async (event: IDBVersionChangeEvent) => {
      const db = request.result;

      console.log(
        `IndexedDB: Upgrading from ${event.oldVersion} to ${event.newVersion}`
      );

      if (event.newVersion === null) {
        console.log("IndexedDB: Deleting database...");
        return;
      }

      let hasError = false;
      if (!isDatabaseVersion(event.oldVersion)) {
        console.error("IndexedDB: Unknown database version", event.oldVersion);
        hasError = true;
      }
      if (!isDatabaseVersion(event.newVersion)) {
        console.error("IndexedDB: Unknown database version", event.newVersion);
        hasError = true;
      }

      const transaction = (event.target as IDBOpenDBRequest).transaction;

      if (!transaction) {
        console.error(
          "IndexedDB: transaction was null during migration process"
        );
        hasError = true;
      }

      if (!hasError) {
        console.info(
          "IndexedDB: Database versions make sense, running migration..."
        );
        try {
          const migrationResult = await runMigrations(
            db,
            transaction as IDBTransaction,
            event.oldVersion as DatabaseVersion,
            event.newVersion as DatabaseVersion
          );
          if (typeof migrationResult === "string") {
            throw migrationResult;
          }
          console.info("IndexedDB: Migrations run!");
        } catch (error) {
          console.error("IndexedDB failed to run migrations:", error);
          reject(error);
        }
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      request.transaction?.abort();
      reject(request.error);
    };
  });
}

type ReturnObjectStore<storeName> =
  storeName extends typeof SETTINGS_OBJECT_STORE_NAME ? Settings : AppState;

async function loadFromDatabase<
  storeName extends StoreName,
  returnObject extends ReturnObjectStore<storeName>
>(storeName: storeName): Promise<returnObject> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();

      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);

      const obj = store.get(storeName);

      transaction.oncomplete = (event) => {
        resolve(obj.result as returnObject);
      };

      transaction.onerror = (event) => {
        console.error("IndexedDB: Transaction failed", event);
        reject();
      };
    } catch (error) {
      console.error("IndexedDB: Failed to open database:", error);
      reject();
    }
  });
}

type ObjectStoreToSave<storeName> =
  storeName extends typeof SETTINGS_OBJECT_STORE_NAME ? Settings : AppState;

async function syncToDatabase<
  storeName extends StoreName,
  objectToSave extends ObjectStoreToSave<storeName>
>(storeName: storeName, object: objectToSave): Promise<void> {
  try {
    const db = await openDatabase();

    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    store.put(object);

    transaction.oncomplete = () => {};

    transaction.onerror = (event) => {
      console.error("IndexedDB: Transaction failed", event);
    };
  } catch (error) {
    console.error("IndexedDB: Failed to open database:", error);
  }
}

export async function syncSettingsToDatabase(
  settings: Settings
): Promise<void> {
  return syncToDatabase(SETTINGS_OBJECT_STORE_NAME, settings);
}

export async function loadSettingsFromDatabase(): Promise<Settings> {
  return loadFromDatabase(SETTINGS_OBJECT_STORE_NAME);
}

export async function syncStateToDatabase(state: AppState): Promise<void> {
  return syncToDatabase(APP_STATE_OBJECT_STORE_NAME, state);
}

export async function loadStateToDatabase(): Promise<AppState> {
  return loadFromDatabase(APP_STATE_OBJECT_STORE_NAME);
}
