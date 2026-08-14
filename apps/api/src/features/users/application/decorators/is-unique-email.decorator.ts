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
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository
  ) {}

  async validate(email: string, args: ValidationArguments): Promise<boolean> {
    const [existingIdField] = args.constraints;
    const existingId: string | null = existingIdField
      ? (args.object as any)[existingIdField]
      : null;

    const existingUser = await this.usersRepository.getByEmail(email);
    return existingId
      ? !existingUser || existingUser.id === existingId
      : !existingUser;
  }

  defaultMessage(_args: ValidationArguments): string {
    return `The email "$value" is already taken.`;
  }
}

// Decorador que aplica la validación
export function IsUniqueEmail(
  existingIdField: string | null = null,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [existingIdField],
      validator: IsUniqueEmailConstraint,
    });
  };
}
