import { HttpException, HttpStatus } from "@nestjs/common";

export class EntityNotFoundException extends HttpException {
  constructor(entity: string, id: string | number, errorToken?: string) {
    super(
      {
        message: `${entity} with id ${id} not found`,
        error: errorToken,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class DatabaseException extends HttpException {
  constructor(error: string, errorToken?: string) {
    super(
      {
        message: `Database error: ${error}`,
        error: errorToken,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class LdapServerException extends HttpException {
  constructor(error: string, errorToken?: string) {
    super(
      {
        message: `Server error: ${error}`,
        error: errorToken,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export class LdapInvalidCredentialsException extends HttpException {
  constructor(error: string, errorToken?: string) {
    super(
      {
        message: `Invalid credentials`,
        error: errorToken,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}
