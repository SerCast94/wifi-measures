import * as dotenv from "dotenv";
import * as path from "path";

// Carga el .env de la raíz del monorepo para los tests E2E ejecutados
// desde apps/api (jest no lo encuentra porque busca en el cwd).
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// En ejecución desde el host, el hostname interno de docker no resuelve:
// se sustituye por localhost para alcanzar el Postgres publicado en 5432.
if (process.env.DATABASE_URL?.includes("@template-postgres")) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
    "@template-postgres",
    "@localhost"
  );
}
