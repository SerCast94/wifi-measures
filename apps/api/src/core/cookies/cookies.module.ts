import { Global, Module } from "@nestjs/common";

import { CookiesService } from "./cookies.service";

@Global()
@Module({
  providers: [CookiesService],
})
export class CookiesModule {}
