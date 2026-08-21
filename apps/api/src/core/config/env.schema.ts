import { z, ZodEffects, ZodType, ZodTypeDef } from "zod";

export const allowedLogLevels = [
  "error",
  "warn",
  "log",
  "debug",
  "verbose",
  "all",
];

export const envSchema = z.object({
  APP_NAME: cleanEmptyString(
    z.string().optional().default("NestJS Application")
  ),
  APP_VERSION: cleanEmptyString(z.string().optional().default("1.0.0")),
  APP_DESCRIPTION: cleanEmptyString(
    z.string().optional().default("NestJS Application Description")
  ),
  APP_PORT: cleanEmptyString(
    z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 3000))
  ),
  APP_HOST: cleanEmptyString(z.string().optional().default("localhost")),
  APP_PREFIX: cleanEmptyString(z.string().optional().default("api")),
  APP_ENV: cleanEmptyString(
    z
      .enum(["development", "production", "test"])
      .optional()
      .default("development")
  ),
  LOG_LEVEL: cleanEmptyString(
    z
      .string()
      .optional()
      .default("error")
      .transform((val) => val.split(",").map((item) => item.trim()))
      .refine(
        (array) => array.every((item) => allowedLogLevels.includes(item)),
        {
          message:
            'Invalid LOG_LEVEL. Must be one of "error", "warn", "log", "debug", "verbose", "all"',
        }
      )
  ),
  DELAY_RESPONSE: cleanEmptyString(
    z
      .string()
      .optional()
      .default("0")
      .transform((val) => (val ? parseInt(val, 10) : 0))
  ),
  ALLOWED_ORIGINS: cleanEmptyString(
    z
      .string()
      .optional()
      .default("http://localhost")
      .transform((val) => val.split(",").map((item) => item.trim()))
  ),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z
    .string()
    .default("6379")
    .transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional(),
  COOKIE_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  SESSION_EXPIRES_IN_SECONDS: z
    .string()
    .default("86400")
    .transform((val) => parseInt(val, 10)),
  SESSION_COOKIE_NAME: z.string().default("SESSION_ID"),
  CSRF_SECRET: z.string().min(32),
  CSRF_COOKIE_NAME: z.string().default("CSRF_TOKEN"),
  LINKLIVE_BASE_URL: z.string().min(1).default("https://link-live.com"),
  LINKLIVE_AUTH_URL: z.string().min(1).default("https://id.link-live.com"),
  LINKLIVE_USERNAME: cleanEmptyString(z.string().optional().default("")),
  LINKLIVE_PASSWORD: cleanEmptyString(z.string().optional().default("")),
  LINKLIVE_APP_ID: cleanEmptyString(z.string().optional().default("")),
  LINKLIVE_ORG_ID: cleanEmptyString(z.string().optional().default("")),
});

export const readableConfigSchema = envSchema.transform((env) => ({
  appName: env.APP_NAME,
  appVersion: env.APP_VERSION,
  appDescription: env.APP_DESCRIPTION,
  port: env.APP_PORT,
  host: env.APP_HOST,
  globalPrefix: env.APP_PREFIX,
  env: env.APP_ENV,
  logLevel: env.LOG_LEVEL,
  delayResponse: env.DELAY_RESPONSE,
  allowedOrigins: env.ALLOWED_ORIGINS,
  redisHost: env.REDIS_HOST,
  redisPort: env.REDIS_PORT,
  redisPassword: env.REDIS_PASSWORD,
  cookieSecret: env.COOKIE_SECRET,
  sessionSecret: env.SESSION_SECRET,
  sessionExpiration: env.SESSION_EXPIRES_IN_SECONDS,
  sessionCookieName: env.SESSION_COOKIE_NAME,
  csrfSecret: env.CSRF_SECRET,
  csrfCookieName: env.CSRF_COOKIE_NAME,
  linkLiveBaseUrl: env.LINKLIVE_BASE_URL,
  linkLiveAuthUrl: env.LINKLIVE_AUTH_URL,
  linkLiveUsername: env.LINKLIVE_USERNAME,
  linkLivePassword: env.LINKLIVE_PASSWORD,
  linkLiveAppId: env.LINKLIVE_APP_ID,
  linkLiveOrgId: env.LINKLIVE_ORG_ID,
}));

export type ReadableEnvVariables = z.infer<typeof readableConfigSchema>;

function cleanEmptyString<T extends ZodType<any, ZodTypeDef, any>>(
  schema: T
): ZodEffects<T, T["_output"], unknown> {
  return z.preprocess((value) => {
    if (value === "" || value == null) {
      return undefined;
    }
    return value;
  }, schema) as ZodEffects<T, T["_output"], unknown>;
}
