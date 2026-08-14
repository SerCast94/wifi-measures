export interface ApiResponseSuccess<T> {
  data: T;
  statusCode: number;
  message: string;
  isArray: boolean;
  quantity: number;
  duration: string;
  method: string;
}

export interface ApiErrorResponse {
  errorToken: string;
  message: string;
  statusCode: number;
  path: string;
  timestamp: string;
  validationErrors?: {
    [key: string]: string[];
  };
}
