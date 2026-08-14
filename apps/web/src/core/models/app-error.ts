export type FormErrors = {
  [key: string]: string[];
};

export class AppError extends Error {
  public statusCode: number;
  public formErrors?: FormErrors;

  constructor(message: string, statusCode: number, formErrors?: FormErrors) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.formErrors = formErrors;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
