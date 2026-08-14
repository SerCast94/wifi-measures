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
export class IsValidUserIdConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository
  ) {}

  async validate(userId: string, _args: ValidationArguments): Promise<boolean> {
    const existingUser = await this.usersRepository.getById(userId);
    return !!existingUser;
  }

  defaultMessage(_args: ValidationArguments): string {
    return `The user with id "$value" does not exist.`;
  }
}

// Decorador que aplica la validación
export function IsValidUserId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsValidUserIdConstraint,
    });
  };
}
