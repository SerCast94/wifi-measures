import { createParser } from "nuqs";

export const parseAsPositiveInt = createParser({
  parse: (value) => {
    const parsed = Number(value);
    return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
  },
  serialize: (value) => value.toString(),
});
