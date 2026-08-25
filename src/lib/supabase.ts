import { MongoClient, type Db as MongoDatabase, type Document } from "mongodb";

type QueryResult<T = any> = { data: T; error: Error | null };

type GlobalMongo = {
  mongoClient?: MongoClient;
  mongoDb?: MongoDatabase;
  mongoIndexesReady?: boolean;
  mongoConnectPromise?: Promise<MongoDatabase | null>;
};

const globalForMongo = globalThis as typeof globalThis & GlobalMongo;
const memoryStore = new Map<string, any[]>();

function parseSelectedFields(fields: string): string[] | undefined {
  const trimmed = fields.trim();
  if (!trimmed || trimmed === "*") return undefined;
  if (trimmed.includes(":") || trimmed.includes("(") || trimmed.includes("\n")) {
    return undefined;
  }
  const parsed = trimmed
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : undefined;
}

function omitUndefined<T extends Record<string, unknown>>(item: T) {
  return Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== undefined)
  ) as T;
}

function withDefaults(item: Record<string, unknown>) {
  const now = new Date().toISOString();
  return omitUndefined({
    ...item,
    id: typeof item.id === "string" && item.id ? item.id : crypto.randomUUID(),
    createdAt: item.createdAt ?? now,
    updatedAt: item.updatedAt ?? now,
  });
}

function stripMongoId<T extends Document>(doc: T | null | undefined) {
  if (!doc) return doc;
  const { _id, ...rest } = doc as T & { _id?: unknown };
  return rest as Omit<T, "_id">;
}

function selectFields<T>(rows: T[], fields?: string[]) {
  if (!fields || fields.length === 0) {
    return rows;
  }

  return rows.map((row) => {
    const selected: Record<string, unknown> = {};
    for (const field of fields) {
      if (field in (row as Record<string, unknown>)) {
        selected[field] = (row as Record<string, unknown>)[field];
      }
    }
    return selected as T;
  });
}

function applyFilters(rows: any[], filters: Array<[string, unknown]>) {
  return rows.filter((row) =>
    filters.every(([column, value]) => (row as Record<string, unknown>)[column] === value)
  );
}

function sortRows(rows: any[], column?: string, ascending = true) {
  if (!column) return rows;

  return [...rows].sort((a, b) => {
    const first = a?.[column];
    const second = b?.[column];

    if (first === second) return 0;
    if (first == null) return 1;
    if (second == null) return -1;

    const comparison = String(first).localeCompare(String(second));
    return ascending ? comparison : comparison * -1;
  });
}

function getMemoryCollection(table: string) {
  if (!memoryStore.has(table)) {
    memoryStore.set(table, []);
  }
  return memoryStore.get(table) as any[];
}

async function ensureIndexes(db: MongoDatabase) {
  if (globalForMongo.mongoIndexesReady) return;

  await db.collection("User").createIndexes([
    { key: { username: 1 }, unique: true, name: "user_username_unique" },
    { key: { email: 1 }, unique: true, name: "user_email_unique" },
    { key: { phoneNumber: 1 }, unique: true, name: "user_phone_unique" },
  ]);
  await db.collection("Like").createIndex(
    { userId: 1, postId: 1 },
    { unique: true, name: "like_user_post_unique" }
  );

  globalForMongo.mongoIndexesReady = true;
}

async function connectMongoIfConfigured(): Promise<MongoDatabase | null> {
  if (globalForMongo.mongoDb) return globalForMongo.mongoDb;
  if (globalForMongo.mongoConnectPromise) return globalForMongo.mongoConnectPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  globalForMongo.mongoConnectPromise = (async () => {
    try {
      const client =
        globalForMongo.mongoClient ??
        new MongoClient(uri, {
          serverSelectionTimeoutMS: 5000,
        });
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || "agrismart_local");
      await ensureIndexes(db);
      globalForMongo.mongoClient = client;
      globalForMongo.mongoDb = db;
      return db;
    } catch (error) {
      console.warn("MongoDB connection failed, falling back to in-memory storage:", error);
      globalForMongo.mongoConnectPromise = undefined;
      return null;
    }
  })();

  return globalForMongo.mongoConnectPromise;
}

class QueryBuilder<T = any> implements PromiseLike<QueryResult<T[]>> {
  private table: string;
  private selectedFields?: string[];
  private filters: Array<[string, unknown]> = [];
  private sortColumn?: string;
  private sortAscending = true;
  private pendingOperation: "select" | "insert" | "update" | "delete" = "select";
  private payload?: Partial<T> | Partial<T>[];

  constructor(table: string) {
    this.table = table;
  }

  select(fields = "*") {
    this.selectedFields = parseSelectedFields(fields);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push([column, value]);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sortColumn = column;
    this.sortAscending = options?.ascending ?? true;
    return this;
  }

  insert(payload: Partial<T> | Partial<T>[]) {
    this.pendingOperation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Partial<T>) {
    this.pendingOperation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.pendingOperation = "delete";
    return this;
  }

  then<TResult1 = QueryResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async single(): Promise<QueryResult<T | null>> {
    const result = await this.execute();
    if (result.error) {
      return { data: null, error: result.error };
    }
    const value = Array.isArray(result.data) ? result.data[0] ?? null : result.data ?? null;
    return { data: value, error: null };
  }

  async maybeSingle(): Promise<QueryResult<T | null>> {
    return this.single();
  }

  async execute(): Promise<QueryResult<T[]>> {
    try {
      const mongo = await connectMongoIfConfigured();
      if (mongo) {
        return await this.executeMongo(mongo);
      }
      return this.executeMemory();
    } catch (error) {
      return {
        data: [] as T[],
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  private filterObject() {
    return Object.fromEntries(this.filters);
  }

  private async executeMongo(mongo: MongoDatabase): Promise<QueryResult<T[]>> {
    const collection = mongo.collection(this.table);
    const filter = this.filterObject();

    if (this.pendingOperation === "insert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload as Partial<T>]).map(
        (item) => withDefaults({ ...(item as Record<string, unknown>) })
      );
      if (items.length === 1) {
        await collection.insertOne(items[0]);
      } else {
        await collection.insertMany(items);
      }
      const inserted = items.map((item) => stripMongoId(item));
      return { data: selectFields(inserted as T[], this.selectedFields), error: null };
    }

    if (this.pendingOperation === "update") {
      const updates = omitUndefined({
        ...(this.payload as Record<string, unknown>),
        updatedAt: (this.payload as Record<string, unknown>)?.updatedAt ?? new Date().toISOString(),
      });
      await collection.updateMany(filter, { $set: updates });
      const updatedDocs = await collection.find(filter).toArray();
      const updated = updatedDocs.map((doc) => stripMongoId(doc));
      return { data: selectFields(updated as T[], this.selectedFields), error: null };
    }

    if (this.pendingOperation === "delete") {
      const existing = await collection.find(filter).toArray();
      if (existing.length > 0) {
        await collection.deleteMany(filter);
      }
      const removed = existing.map((doc) => stripMongoId(doc));
      return { data: selectFields(removed as T[], this.selectedFields), error: null };
    }

    const cursor = collection.find(filter);
    if (this.sortColumn) {
      cursor.sort({ [this.sortColumn]: this.sortAscending ? 1 : -1 });
    }
    const docs = (await cursor.toArray()).map((doc) => stripMongoId(doc));
    return { data: selectFields(docs as T[], this.selectedFields), error: null };
  }

  private executeMemory(): QueryResult<T[]> {
    const records = getMemoryCollection(this.table);

    if (this.pendingOperation === "insert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload as Partial<T>]).map(
        (item) => withDefaults({ ...(item as Record<string, unknown>) })
      );
      records.push(...items);
      return { data: selectFields(items as T[], this.selectedFields), error: null };
    }

    let rows = applyFilters(records, this.filters);

    if (this.pendingOperation === "update") {
      const updates = omitUndefined({
        ...(this.payload as Record<string, unknown>),
        updatedAt: (this.payload as Record<string, unknown>)?.updatedAt ?? new Date().toISOString(),
      });
      const updatedRows: any[] = [];

      for (const row of rows) {
        const merged = { ...row, ...updates };
        const index = records.indexOf(row);
        if (index >= 0) {
          records[index] = merged;
        }
        updatedRows.push(merged);
      }

      return {
        data: selectFields(updatedRows, this.selectedFields),
        error: null,
      };
    }

    if (this.pendingOperation === "delete") {
      const removedRows: any[] = [];
      const remaining = records.filter((row) => {
        const shouldDelete = this.filters.every(([column, value]) => row[column] === value);
        if (shouldDelete) {
          removedRows.push(row);
        }
        return !shouldDelete;
      });

      memoryStore.set(this.table, remaining);
      return {
        data: selectFields(removedRows, this.selectedFields),
        error: null,
      };
    }

    rows = sortRows(rows, this.sortColumn, this.sortAscending);
    return { data: selectFields(rows, this.selectedFields), error: null };
  }
}

export function createDatabase() {
  return {
    from(table: string) {
      return new QueryBuilder(table);
    },
  };
}

export const db = createDatabase();
export const supabase = db;
export const createLocalDatabase = createDatabase;
