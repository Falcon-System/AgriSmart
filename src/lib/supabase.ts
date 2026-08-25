import { MongoClient, type Db as MongoDatabase } from "mongodb";

const memoryStore = new Map<string, any[]>();
let mongoDb: MongoDatabase | null = null;

async function connectMongoIfConfigured() {
  if (mongoDb) return mongoDb;

  if (!process.env.MONGODB_URI) {
    return null;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    mongoDb = client.db(process.env.MONGODB_DB || "agrismart_local");
    return mongoDb;
  } catch (error) {
    console.warn("MongoDB connection failed, falling back to in-memory storage:", error);
    return null;
  }
}

function getCollection(table: string) {
  if (!memoryStore.has(table)) {
    memoryStore.set(table, []);
  }

  return memoryStore.get(table) as any[];
}

function applyFilters(rows: any[], filters: Array<(row: any) => boolean>) {
  return rows.filter((row) => filters.every((predicate) => predicate(row)));
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

class LocalQueryBuilder<T = any> {
  private table: string;
  private selectedFields?: string[];
  private filters: Array<(row: T) => boolean> = [];
  private sortColumn?: string;
  private sortAscending = true;
  private pendingOperation: "select" | "insert" | "update" | "delete" = "select";
  private payload?: Partial<T> | Partial<T>[];

  constructor(table: string) {
    this.table = table;
  }

  select(fields = "*") {
    this.selectedFields = fields === "*" ? undefined : fields.split(",").map((field) => field.trim()).filter(Boolean);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => (row as Record<string, unknown>)[column] === value);
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

  async single() {
    const result = await this.execute();
    const value = Array.isArray(result.data) ? result.data[0] ?? null : result.data ?? null;
    return { data: value, error: result.error };
  }

  async execute() {
    const records = getCollection(this.table);

    if (this.pendingOperation === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload as Partial<T>];
      const inserted = items.map((item) => ({ ...(item as Record<string, unknown>) }));
      records.push(...(inserted as any[]));
      return { data: selectFields(inserted as any[], this.selectedFields), error: null };
    }

    let rows = applyFilters(records, this.filters);

    if (this.pendingOperation === "update") {
      const updates = this.payload as Partial<T>;
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
        const shouldDelete = this.filters.every((predicate) => predicate(row));
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
    const selected = selectFields(rows, this.selectedFields);
    return { data: selected, error: null };
  }
}

export function createLocalDatabase() {
  return {
    from(table: string) {
      return new LocalQueryBuilder(table);
    },
  };
}

export const db = createLocalDatabase();
export const supabase = db;
