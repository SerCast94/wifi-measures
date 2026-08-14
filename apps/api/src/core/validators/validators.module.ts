import { Global, Module } from "@nestjs/common";

import { MatchConstraint } from "./match.validator";

@Global()
@Module({
  providers: [MatchConstraint],
  exports: [MatchConstraint],
})
export class ValidatorsModule {}
