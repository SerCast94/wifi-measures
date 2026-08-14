import { Global, Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";

import Keyv from "keyv";
import KeyvRedis from "@keyv/redis";
import { CacheableMemory } from "cacheable";

import { AppCacheService } from "./cache.service";
import { AppConfigModule } from "@config/app-config.module";
import { AppConfigService } from "@config/app-config.service";

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [AppConfigModule],
      useFactory: async (configService: AppConfigService) => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new Keyv({
              store: new KeyvRedis({
                url: `redis://${configService.get("redisHost")}:${configService.get(
                  "redisPort"
                )}`,
                password: configService.get("redisPassword"),
              }),
              ttl: 60000,
            }),
          ],
        };
      },
      inject: [AppConfigService],
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService],
})
export class AppCacheModule {}
