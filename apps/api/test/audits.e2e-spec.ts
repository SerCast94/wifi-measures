/**
 * E2E del flujo de auditorías contra una API en marcha.
 *
 * Requiere:
 *   - API accesible (APP_URL, por defecto http://localhost:3001)
 *   - Redis alcanzable desde el proceso de la API (sesiones)
 *   - Usuario con permisos manage:measures (E2E_EMAIL / E2E_PASSWORD)
 *
 * Si la API no responde, la suite se salta (skip) para no romper
 * entornos sin despliegue local.
 */

const APP_URL = process.env.APP_URL ?? "http://localhost:3001";
const EMAIL = process.env.E2E_EMAIL ?? "sergio.castillo@magtel.es";
const PASSWORD = process.env.E2E_PASSWORD ?? "Altavoz.123";

interface Res {
  status: number;
  json: any;
}

describe("Audits E2E", () => {
  let apiUp = false;
  const jar = new Map<string, string>();

  const cookieHeader = () =>
    [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");

  const storeCookies = (response: Response) => {
    const cookies = response.headers.getSetCookie?.() ?? [];
    for (const cookie of cookies) {
      const [pair] = cookie.split(";");
      const eq = pair.indexOf("=");
      jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  };

  const request = async (
    method: string,
    path: string,
    body?: unknown,
    withCsrf = false
  ): Promise<Res> => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      cookie: cookieHeader(),
    };
    if (withCsrf) {
      const raw = decodeURIComponent(jar.get("csrf-token") ?? "");
      headers["x-csrf-token"] = raw.split("|")[0];
    }
    const response = await fetch(`${APP_URL}/api/v1${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    storeCookies(response);
    let json: any = null;
    try {
      json = await response.json();
    } catch {
      // sin cuerpo
    }
    return { status: response.status, json };
  };

  beforeAll(async () => {
    try {
      const response = await fetch(`${APP_URL}/api/v1/audits/profiles`, {
        signal: AbortSignal.timeout(5000),
      });
      apiUp = response.ok;
    } catch {
      apiUp = false;
    }
  });

  it("flujo completo de auditoría", async () => {
    if (!apiUp) {
      console.warn(`API no accesible en ${APP_URL}: se omite la suite E2E.`);
      return;
    }

    // CSRF + login
    await request("GET", "/csrf/token");
    const login = await request(
      "POST",
      "/auth/login",
      { email: EMAIL, password: PASSWORD },
      true
    );
    expect(login.status).toBe(200);

    // Perfiles sembrados
    const profiles = await request("GET", "/audits/profiles");
    expect(profiles.status).toBe(200);
    expect(profiles.json.data.length).toBeGreaterThanOrEqual(9);
    const general = profiles.json.data.find((p: any) => p.isDefault);
    expect(general.thresholds.coverage.rssi.passMin).toBeDefined();

    // Crear auditoría con plantas y perfil
    const created = await request(
      "POST",
      "/audits",
      {
        name: "[E2E] Auditoría automatizada",
        code: "E2E-001",
        profileId: general.id,
        floorNames: ["Planta test"],
      },
      true
    );
    expect([200, 201]).toContain(created.status);
    const auditId: string = created.json.data.id;
    expect(created.json.data.floors).toHaveLength(1);

    try {
      // Checklist sembrado desde plantilla v1
      const tests = await request("GET", `/audits/${auditId}/tests`);
      expect(tests.status).toBe(200);
      expect(tests.json.data.length).toBeGreaterThan(10);
      expect(
        tests.json.data.every(
          (t: any) => typeof t.key === "string" && t.section.length > 0
        )
      ).toBe(true);

      // Candidatos filtrados por tipo
      for (const type of ["measure", "survey", "analysis"] as const) {
        const candidates = await request(
          "GET",
          `/audits/${auditId}/candidates?type=${type}`
        );
        expect(candidates.status).toBe(200);
        expect(Array.isArray(candidates.json.data)).toBe(true);
      }

      // Evaluación inicial sin capturas: todo UNKNOWN y conclusión honesta
      const evaluated = await request(
        "POST",
        `/audits/${auditId}/evaluate`,
        {},
        true
      );
      expect(evaluated.status).toBeLessThan(400);
      expect(evaluated.json.data.globalResult).toBe("SIN_DATOS_SUFICIENTES");

      // Dashboard coherente
      const dashboard = await request("GET", `/audits/${auditId}/dashboard`);
      expect(dashboard.status).toBe(200);
      expect(dashboard.json.data.evaluations.total).toBeGreaterThan(0);
      expect(dashboard.json.data.checklist.total).toBe(tests.json.data.length);
      expect(dashboard.json.data.discovery.aps).toBe(0);

      // Calidad de datos detecta ausencia de medidas
      const quality = await request("GET", `/audits/${auditId}/data-quality`);
      expect(quality.status).toBe(200);
      expect(quality.json.data.complete).toBe(false);
      expect(
        quality.json.data.problems.some(
          (problem: any) => problem.code === "no_measures"
        )
      ).toBe(true);

      // Informe reproducible
      const reportData = await request("GET", `/audits/${auditId}/report-data`);
      expect(reportData.status).toBe(200);
      expect(reportData.json.data.header.name).toBe("[E2E] Auditoría automatizada");

      const saved = await request(
        "POST",
        `/audits/${auditId}/reports`,
        { sections: ["resumen", "cobertura", "incidencias", "conclusiones"] },
        true
      );
      expect([200, 201]).toContain(saved.status);
      expect(saved.json.data.version).toBe(1);
    } finally {
      // Limpieza: la auditoría no debe quedar en la BD
      const removed = await request("DELETE", `/audits/${auditId}`, undefined, true);
      expect([200, 204]).toContain(removed.status);
    }

    const listed = await request("GET", "/audits?q=E2E-001");
    expect(listed.status).toBe(200);
    expect(
      ((listed.json.data?.items ?? []) as any[]).some(
        (audit) => audit.code === "E2E-001"
      )
    ).toBe(false);
  });

  afterAll(async () => {
    // Cerrar sesión si procede
    if (apiUp && jar.has("csrf-token")) {
      await request("POST", "/auth/logout", undefined, true).catch(() => {});
    }
  });
});
