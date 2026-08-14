import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { HAS_ROLES_KEY } from "../decorators/roles.decorator";
import { AuthService } from "@features/auth/application/auth.service";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<{
      roles: string | string[];
      searchMode: "any" | "all";
    }>(HAS_ROLES_KEY, context.getHandler());

    if (!metadata) {
      return true;
    }

    const { roles: rawRoles, searchMode } = metadata;

    const request = context.switchToHttp().getRequest();
    const user = await this.authService.getAuthUserById(request.session.userId);

    if (!user || !user.roles) {
      throw new UnauthorizedException("Unauthorized");
    }

    const requiredRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

    const hasRole =
      searchMode == "any"
        ? user.hasSomeRole(requiredRoles)
        : user.hasAllRoles(requiredRoles);

    if (!hasRole)
      throw new ForbiddenException(
        "No tienes los roles necesarios para acceder a esta ruta."
      );

    return true;
  }
}
