import { Global, Module } from "@nestjs/common";
import { LinkLiveService } from "./linklive.service";

@Global()
@Module({
  providers: [LinkLiveService],
  exports: [LinkLiveService],
})
export class LinkLiveModule {}
