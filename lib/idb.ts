export async function getDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('EquilibriaDB', 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addTransactionToQueue(data: any) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.add(data);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTransactionQueue() {
  const db = await getDB();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
