interface StoredValue {
  value: string;
  expiresAt?: number;
}

export interface FlagStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  keys(prefix: string): Promise<string[]>;
  setNx<T>(key: string, value: T, ttlSeconds: number): Promise<boolean>;
  incrWithTtl(key: string, ttlSeconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
}

function ttlMilliseconds(ttlSeconds: number): number {
  return Math.max(1, Math.ceil(ttlSeconds)) * 1000;
}

class MemoryFlagStore implements FlagStore {
  private readonly values = new Map<string, StoredValue>();

  private read(key: string): StoredValue | null {
    const stored = this.values.get(key);
    if (!stored) {
      return null;
    }
    if (stored.expiresAt !== undefined && stored.expiresAt <= Date.now()) {
      this.values.delete(key);
      return null;
    }
    return stored;
  }

  async get<T>(key: string): Promise<T | null> {
    const stored = this.read(key);
    return stored ? (JSON.parse(stored.value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.values.set(key, {
      value: JSON.stringify(value),
      expiresAt:
        ttlSeconds === undefined
          ? undefined
          : Date.now() + ttlMilliseconds(ttlSeconds),
    });
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  async keys(prefix: string): Promise<string[]> {
    const matching: string[] = [];
    for (const key of this.values.keys()) {
      if (this.read(key) && key.startsWith(prefix)) {
        matching.push(key);
      }
    }
    return matching;
  }

  async setNx<T>(
    key: string,
    value: T,
    ttlSeconds: number,
  ): Promise<boolean> {
    if (this.read(key)) {
      return false;
    }

    this.values.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlMilliseconds(ttlSeconds),
    });
    return true;
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const stored = this.read(key);
    if (!stored) {
      this.values.set(key, {
        value: JSON.stringify(1),
        expiresAt: Date.now() + ttlMilliseconds(ttlSeconds),
      });
      return 1;
    }

    const current = Number(JSON.parse(stored.value));
    const next = Number.isFinite(current) ? current + 1 : 1;
    stored.value = JSON.stringify(next);
    return next;
  }

  async ttl(key: string): Promise<number> {
    const stored = this.read(key);
    if (!stored) {
      return -2;
    }
    if (stored.expiresAt === undefined) {
      return -1;
    }
    return Math.max(1, Math.ceil((stored.expiresAt - Date.now()) / 1000));
  }
}

interface UpstashResponse<T> {
  result?: T;
  error?: string;
}

class UpstashFlagStore implements FlagStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async command<T>(args: (string | number)[]): Promise<T> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as UpstashResponse<T>;
    if (payload.error) {
      throw new Error(`Upstash error: ${payload.error}`);
    }

    return payload.result as T;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.command<string | null>(["GET", key]);
    return value === null || value === undefined
      ? null
      : (JSON.parse(value) as T);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds === undefined) {
      await this.command(["SET", key, serialized]);
      return;
    }

    const ttl = Math.max(1, Math.ceil(ttlSeconds));
    await this.command(["SET", key, serialized, "EX", ttl]);
  }

  async delete(key: string): Promise<void> {
    await this.command(["DEL", key]);
  }

  async keys(prefix: string): Promise<string[]> {
    const keys = await this.command<string[] | null>(["KEYS", `${prefix}*`]);
    return keys ?? [];
  }

  async setNx<T>(
    key: string,
    value: T,
    ttlSeconds: number,
  ): Promise<boolean> {
    const result = await this.command<string | null>([
      "SET",
      key,
      JSON.stringify(value),
      "EX",
      Math.max(1, Math.ceil(ttlSeconds)),
      "NX",
    ]);
    return result === "OK";
  }

  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.command<number>(["INCR", key]);
    if (count === 1) {
      await this.command([
        "EXPIRE",
        key,
        Math.max(1, Math.ceil(ttlSeconds)),
      ]);
    }
    return count;
  }

  async ttl(key: string): Promise<number> {
    return this.command<number>(["TTL", key]);
  }
}

let overrideStore: FlagStore | null = null;
let memoryStore: FlagStore | null = null;
let upstashStore: FlagStore | null = null;

export function createMemoryStore(): FlagStore {
  return new MemoryFlagStore();
}

export function setFlagStore(store: FlagStore | null): void {
  overrideStore = store;
}

export function getDefaultStore(): FlagStore {
  if (overrideStore) {
    return overrideStore;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_TOKEN is required when UPSTASH_REDIS_REST_URL is set",
    );
  }

  if (!url && token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL is required when UPSTASH_REDIS_REST_TOKEN is set",
    );
  }

  if (url && token) {
    if (!upstashStore) {
      upstashStore = new UpstashFlagStore(url.replace(/\/+$/, ""), token);
    }
    return upstashStore;
  }

  if (!memoryStore) {
    memoryStore = createMemoryStore();
  }
  return memoryStore;
}
