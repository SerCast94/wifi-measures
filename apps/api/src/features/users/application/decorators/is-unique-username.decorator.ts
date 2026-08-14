import { Inject, Injectable } from "@nestjs/common";

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

import { USERS_REPOSITORY_TOKEN } from "@features/users/domain/config/tokens";
import { IUsersRepository } from "@features/users/domain/interfaces/users-repository.interface";

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueUsernameConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository
  ) {}

  async validate(
    username: string,
    args: ValidationArguments
  ): Promise<boolean> {
    const [existingIdField] = args.constraints;
    const existingId: string | null = existingIdField
      ? (args.object as any)[existingIdField]
      : null;

    // Comprobar si existe otro proyecto con el mismo nombre, excluyendo el `existingId`
    const existingUser = await this.usersRepository.getByUsername(username);
    return existingId
      ? !existingUser || existingUser.id === existingId
      : !existingUser;
  }

  defaultMessage(_args: ValidationArguments): string {
    return `The username "$value" is already taken.`;
  }
}

// Decorador que aplica la validación
export function IsUniqueUsername(
  existingIdField: string | null = null,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [existingIdField],
      validator: IsUniqueUsernameConstraint,
    });
  };
}
