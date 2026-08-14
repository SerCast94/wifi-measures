import { Decimal } from "@prisma/client/runtime/library";

export const cleanResponseToChar = (
  response?: string | string[] | number
): string | number | null => {
  if (!response || Array.isArray(response)) {
    return null;
  }

  return response;
};

export const cleanResponseToNumber = (response?: number): number | null => {
  if (!response || isNaN(response)) {
    return null;
  }

  return response;
};

export const toNumberOrNull = (v?: Decimal | null): number | null =>
  v != null ? v.toNumber() : null;
