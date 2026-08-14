import { Injectable } from "@nestjs/common";

import { readableConfigSchema, ReadableEnvVariables } from "./env.schema";

@Injectable()
export class AppConfigService {
  private readonly config: ReadableEnvVariables;

  constructor() {
    const parsedEnv = readableConfigSchema.safeParse(process.env);

    if (!parsedEnv.success) {
      console.error("Errores de configuración:", parsedEnv.error.format());
      throw new Error("Configuración inválida");
    }

    this.config = parsedEnv.data;
  }

  get<T extends keyof ReadableEnvVariables>(key: T): ReadableEnvVariables[T] {
    return this.config[key];
  }
}
