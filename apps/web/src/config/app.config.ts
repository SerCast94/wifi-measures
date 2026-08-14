export class AppConfig {
  static readonly appName = import.meta.env.VITE_APP_NAME || "Vite+React App";
  static readonly appVersion = import.meta.env.VITE_APP_VERSION || "0.0.1";
  static readonly stage = import.meta.env.VITE_APP_STAGE || "development";
}
