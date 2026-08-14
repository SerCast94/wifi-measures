import { Inject, Injectable } from "@nestjs/common";
import type { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

@Injectable()
export class AppCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async remember<T>(
    key: string,
    ttl: number, // en segundos
    callback: () => Promise<T>
  ): Promise<T> {
    const cached = await this.cacheManager.get<Awaited<T>>(key);
    if (cached !== null && cached !== undefined) {
      return cached as T;
    }

    const result = await callback();
    await this.cacheManager.set(key, result, ttl * 1000); // cache-manager usa milisegundos

    return result;
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.cacheManager.get<Awaited<T>>(key);
    return cached !== null && cached !== undefined ? (cached as T) : null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl * 1000); // cache-manager usa milisegundos
  }

  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async has(key: string): Promise<boolean> {
    const cached = await this.cacheManager.get(key);
    return cached !== null && cached !== undefined;
  }

  async clear(): Promise<void> {
    await this.cacheManager.clear();
  }
}
