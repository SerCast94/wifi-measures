import { Module } from "@nestjs/common";

import {
  ROLES_REPOSITORY_TOKEN,
  USERS_REPOSITORY_TOKEN,
} from "./domain/config/tokens";
import { UsersService } from "./application/users.service";
import { RolesService } from "./application/roles.service";
import { DatabaseModule } from "@core/database/database.module";
import { UsersController } from "./presentation/http/users.controller";
import { RolesController } from "./presentation/http/roles.controller";
import { IsValidRolesConstraint } from "./application/decorators/is-valid-roles.decorator";
import { IsUniqueEmailConstraint } from "./application/decorators/is-unique-email.decorator";
import { DatabaseRolesRepository } from "./infrastructure/repositories/database-roles.repository";
import { DatabaseUsersRepository } from "./infrastructure/repositories/database-users.repository";
import { IsUniqueUsernameConstraint } from "./application/decorators/is-unique-username.decorator";
import { IsValidUserIdConstraint } from "./application/decorators/is-valid-user-id.decorator";

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: USERS_REPOSITORY_TOKEN,
      useClass: DatabaseUsersRepository,
    },
    {
      provide: ROLES_REPOSITORY_TOKEN,
      useClass: DatabaseRolesRepository,
    },
    IsUniqueEmailConstraint,
    IsUniqueUsernameConstraint,
    IsValidRolesConstraint,
    IsValidUserIdConstraint,
    UsersService,
    RolesService,
  ],
  controllers: [UsersController, RolesController],
})
export class UsersModule {}
