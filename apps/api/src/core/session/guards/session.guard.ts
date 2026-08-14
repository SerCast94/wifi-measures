import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { Request } from "express";

import { IS_PUBLIC_KEY } from "../decorators/is-public.decorator";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler()
    );
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const { session } = request;

    if (!session || !session.userId) {
      throw new UnauthorizedException("Unauthorized");
    }

    return true;
  }
}
