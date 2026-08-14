import { Global, Module } from "@nestjs/common";
import { ResponsesService } from "./responses.service";

@Global()
@Module({
  providers: [ResponsesService],
})
export class ResponsesModule {}
