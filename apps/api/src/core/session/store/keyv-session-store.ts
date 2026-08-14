import KeyvRedis from "@keyv/redis";
import { Store } from "express-session";
import Keyv from "keyv";

export class KeyvSessionStore extends Store {
  private store: Keyv;

  constructor(redisUrl: string, redisPassword: string) {
    super();
    this.store = new Keyv({
      store: new KeyvRedis({
        url: redisUrl,
        password: redisPassword,
      }),
    });
  }

  // Método para obtener la sesión
  async get(
    sid: string,
    callback: (err: any, session?: any) => void
  ): Promise<void> {
    try {
      const session = await this.store.get(sid);
      callback(null, session);
    } catch (err) {
      if (typeof callback === "function") {
        callback(err);
      } else {
        console.error("Error al obtener la sesión:", err);
      }
    }
  }

  // Método para guardar la sesión
  async set(
    sid: string,
    session: any,
    callback: (err?: any) => void
  ): Promise<void> {
    try {
      await this.store.set(sid, session);
      callback();
    } catch (err) {
      if (typeof callback === "function") {
        callback(err);
      } else {
        console.error("Error al guardar la sesión:", err);
      }
    }
  }

  // Método para destruir la sesión
  async destroy(sid: string, callback: (err?: any) => void): Promise<void> {
    try {
      await this.store.delete(sid);
      if (typeof callback === "function") {
        callback();
      }
    } catch (err) {
      if (typeof callback === "function") {
        callback(err);
      } else {
        console.error("Error al destruir la sesión:", err);
      }
    }
  }
}
