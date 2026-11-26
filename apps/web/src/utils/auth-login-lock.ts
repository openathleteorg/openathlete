const STORE = 'login';

let openingDatabase: Promise<IDBDatabase> | undefined;

function getDatabase(): Promise<IDBDatabase> {
  if (openingDatabase) return openingDatabase;

  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('openathlete-auth-coordination', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => {
      const database = request.result;
      const forgetConnection = () => {
        if (openingDatabase === opening) openingDatabase = undefined;
      };
      database.onversionchange = () => {
        database.close();
        forgetConnection();
      };
      database.onclose = forgetConnection;
      resolve(database);
    };
    request.onerror = () =>
      reject(
        request.error ?? new Error('Cannot open login coordination storage.'),
      );
  });
  openingDatabase = opening;
  void opening.catch(() => {
    if (openingDatabase === opening) openingDatabase = undefined;
  });
  return opening;
}

/**
 * A readwrite transaction makes these synchronous localStorage writes exclusive
 * across tabs, including on self-hosted HTTP. IndexedDB stores no credentials.
 */
export async function withAuthLoginLock<T>(write: () => T): Promise<T> {
  const database = await getDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    let result: T;
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error('Login coordination transaction aborted.'),
      );
    const acquired = transaction.objectStore(STORE).get(STORE);
    acquired.onsuccess = () => {
      try {
        result = write();
      } catch (error) {
        reject(error);
        transaction.abort();
      }
    };
  });
}
