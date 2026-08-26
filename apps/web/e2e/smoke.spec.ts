import { expect, test } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "sergio.castillo@magtel.es";
const PASSWORD = process.env.E2E_PASSWORD ?? "Altavoz.123";

test("flujo humo: login → auditorías → nueva auditoría", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByPlaceholder(/email address/i).fill(EMAIL);
  await page.getByPlaceholder(/password/i).fill(PASSWORD);
  await page.locator('button[type="submit"]').click();

  // El sidebar muestra la sección de auditorías
  await expect(page.getByRole("link", { name: "Auditorías" })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("link", { name: "Auditorías" }).click();
  await expect(page).toHaveURL(/\/audits$/);
  await expect(
    page.getByText(/Nueva auditoría|Todavía no hay auditorías/)
  ).toBeVisible();

  // El listado ofrece comparativa y creación
  await page.getByRole("link", { name: "Comparar" }).waitFor({ state: "visible" });
  await page.goto("/audits/new");
  await expect(page.getByText("Nueva auditoría Wi-Fi")).toBeVisible();
});
