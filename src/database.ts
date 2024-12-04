import {
  APP_STATE_OBJECT_STORE_NAME,
  AppState,
  Settings,
  SETTINGS_OBJECT_STORE_NAME,
  StoreName,
} from "./types";

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("mood-tracker", 2);

    request.onupgradeneeded = (event) => {
      const db = request.result;

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
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
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

      const obj = store.get(APP_STATE_OBJECT_STORE_NAME);

      transaction.oncomplete = (event) => {
        resolve(obj.result as returnObject);
      };

      transaction.onerror = (event) => {
        console.error("Transaction failed", event);
        reject();
      };
    } catch (error) {
      console.error("Failed to open database:", error);
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
      console.error("Transaction failed", event);
    };
  } catch (error) {
    console.error("Failed to open database:", error);
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
