import { Inject, Injectable } from "@nestjs/common";

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

import { ROLES_REPOSITORY_TOKEN } from "@features/users/domain/config/tokens";
import { IRolesRepository } from "@features/users/domain/interfaces/roles-repository.interface";

@ValidatorConstraint({ async: true })
@Injectable()
export class IsValidRolesConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(ROLES_REPOSITORY_TOKEN)
    private readonly rolesRepository: IRolesRepository
  ) {}

  async validate(
    roles: string[],
    _args: ValidationArguments
  ): Promise<boolean> {
    if (roles.length === 0) return true; // Si no hay roles, se considera válido
    if (!Array.isArray(roles)) return false; // Si no es un array, se considera no válido
    const existingRoles = await this.rolesRepository.getAll();
    const existingRolesIds = existingRoles.map((role) => role.id);

    return roles.every((role) => existingRolesIds.includes(role));
  }

  defaultMessage(_args: ValidationArguments): string {
    return `There are invalid roles in the list.`;
  }
}

// Decorador que aplica la validación
export function IsValidRoles(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidRolesConstraint,
    });
  };
}
