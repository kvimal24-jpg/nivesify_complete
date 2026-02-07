import { openDB, IDBPDatabase } from "idb";

const dbName = "mfhc";
const navStoreKey = "nav-history";

interface NavMeta {
  scheme_code: number;
  scheme_name: string;
}

interface NavDataPoint {
  date: string;
  nav: string;
}

interface NavResponse {
  meta: NavMeta;
  data: NavDataPoint[];
}

interface NavData {
  data: NavResponse;
  timestamp: number;
}

let db: IDBPDatabase | null = null;

const initDB = async () => {
  if (!db) {
    db = await openDB(dbName, 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(navStoreKey)) {
          database.createObjectStore(navStoreKey);
        }
      },
    });
  }
  return db;
};

export const navHistoryDB = {
  async get(schemeCode: number) {
    const database = await initDB();
    return database.get(navStoreKey, schemeCode) as Promise<NavData | undefined>;
  },

  async set(schemeCode: number, data: NavResponse) {
    const database = await initDB();
    const navData: NavData = {
      data,
      timestamp: Date.now(),
    };
    return database.put(navStoreKey, navData, schemeCode);
  },

  async getAll() {
    const database = await initDB();
    return database.getAll(navStoreKey) as Promise<NavData[]>;
  },
};
