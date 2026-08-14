import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthService } from "@features/auth/application/auth.service";
import { HAS_PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<{
      permissions: string | string[];
      searchMode: "any" | "all";
    }>(HAS_PERMISSIONS_KEY, context.getHandler());

    if (!metadata) {
      return true;
    }

    const { permissions: rawPermissions, searchMode } = metadata;

    const request = context.switchToHttp().getRequest();
    const user = await this.authService.getAuthUserById(request.session.userId);

    if (!user || !user.permissions) {
      throw new UnauthorizedException("Unauthorized");
    }

    const requiredPermissions = Array.isArray(rawPermissions)
      ? rawPermissions
      : [rawPermissions];

    const hasPermission =
      searchMode == "any"
        ? user.hasSomePermissions(requiredPermissions)
        : user.hasAllPermissions(requiredPermissions);

    if (!hasPermission)
      throw new ForbiddenException(
        "No tienes los permisos necesarios para acceder a esta ruta."
      );

    return true;
  }
}
