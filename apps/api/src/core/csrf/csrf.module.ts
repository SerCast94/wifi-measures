import { Global, Module } from "@nestjs/common";

import { CsrfService } from "./csrf.service";
import { CsrfController } from "./csrf.controller";

@Global()
@Module({
  providers: [CsrfService],
  controllers: [CsrfController],
  exports: [CsrfService],
})
export class CsrfModule {}
