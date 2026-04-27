const DB_NAME = "whaleResearchForms";
const DB_VERSION = 1;
const STORE_NAME = "savedEntries";

let dbPromise;

function openDatabase() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.objectStoreNames.contains(STORE_NAME)
        ? request.transaction.objectStore(STORE_NAME)
        : db.createObjectStore(STORE_NAME, { keyPath: "id" });

      if (!store.indexNames.contains("formId")) {
        store.createIndex("formId", "formId", { unique: false });
      }

      if (!store.indexNames.contains("createdAt")) {
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error("Could not open local saved entries database."));
    };
  });

  return dbPromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

async function withStore(mode, callback) {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, mode);
  const store = transaction.objectStore(STORE_NAME);
  const result = await callback(store);

  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction was aborted."));
  });

  return result;
}

export async function saveEntry(entry) {
  if (!entry || !entry.id) {
    throw new Error("Saved entries must include an id.");
  }

  await withStore("readwrite", (store) => requestToPromise(store.put(entry)));
  return entry;
}

export async function getEntries() {
  const entries = await withStore("readonly", (store) => requestToPromise(store.getAll()));
  return entries.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}

export async function getEntry(id) {
  return withStore("readonly", (store) => requestToPromise(store.get(id)));
}

export async function deleteEntry(id) {
  await withStore("readwrite", (store) => requestToPromise(store.delete(id)));
}
