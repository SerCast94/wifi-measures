import { defineConfig, devices } from "@playwright/test";

/**
 * E2E del frontend. Por defecto contra el despliegue docker local
 * (BASE_URL=http://localhost:3001). Credenciales vía E2E_EMAIL/E2E_PASSWORD.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
