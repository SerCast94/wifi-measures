import { Global, Module } from "@nestjs/common";
import { OdkService } from "./odk.service";

@Global()
@Module({
  providers: [OdkService],
  exports: [OdkService],
})
export class OdkModule {}
