import { Outlet } from "react-router-dom";

import CustomSuspense from "../../components/CustomSuspense";
import RedirectIfAuthenticated from "@/features/auth/components/RedirectIfAuthenticated";

function Layout() {
  return (
    <div className="flex flex-col items-center flex-auto min-w-0 min-h-screen sm:flex-row sm:justify-center lg:items-start lg:justify-start">
      <div className="relative items-center justify-center flex-auto hidden h-full p-24 overflow-hidden lg:flex xl:px-32 bg-primary-700">
        <img
          src="background.webp"
          alt="Description of image"
          className="absolute inset-0 object-cover w-full h-full"
        />
        {/* Overlay negro semitransparente */}
        <div className="absolute inset-0 bg-black pointer-events-none opacity-70" />
        <div className="relative z-10 w-full max-w-[60rem]">
          <div className="text-3xl font-bold !leading-snug text-primary-foreground xl:text-4xl">
            Plataforma para la Automatización, Visualización y <br />
            Generación de Informes de Medidas Wi‑Fi
          </div>
          <section className="py-6 mx-auto mt-10">
            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
              <div className="p-6 bg-transparent border rounded-lg shadow-md shadow-primary-900 text-primary-foreground border-primary-foreground">
                <h2 className="text-xl font-semibold">
                  🛠️ Automatización de Medidas
                </h2>
                <p className="mt-2 text-primary-foreground">
                  Configura y gestiona la toma de medidas Wi‑Fi de manera
                  automática, optimizando tiempos y reduciendo errores manuales.
                </p>
              </div>
              <div className="p-6 bg-transparent border rounded-lg shadow-md shadow-primary-900 text-primary-foreground border-primary-foreground">
                <h2 className="text-xl font-semibold">
                  📂 Importación de Datos Multiformato
                </h2>
                <p className="mt-2 text-primary-foreground">
                  Carga fácilmente mediciones desde archivos CSV, XLSX y XML,
                  integrando toda la información en un único entorno
                  centralizado.
                </p>
              </div>
              <div className="p-6 bg-transparent border rounded-lg shadow-md shadow-primary-900 text-primary-foreground border-primary-foreground">
                <h2 className="text-xl font-semibold">
                  🗺️ Visualización y Reportes Interactivos
                </h2>
                <p className="mt-2 text-primary-foreground">
                  Explora los resultados en un mapa dinámico, consulta metadatos
                  y genera informes estandarizados listos para entregar a
                  clientes.
                </p>
              </div>
            </div>
          </section>
          <section className="mt-10 text-center">
                <p className="text-lg text-primary-foreground">
              🚀{" "}
              <strong>
                ¡Accede ya y transforma la forma en que gestionas tus medidas
                Wi‑Fi!
              </strong>
            </p>
          </section>
        </div>
      </div>

      <div className="w-full h-full px-12 py-28 ltr:border-l-1 rtl:border-r-1 sm:h-auto sm:w-auto sm:rounded-xl sm:p-16 lg:p-12 sm:shadow lg:flex lg:h-full lg:rounded-none lg:relative lg:items-center lg:justify-center lg:flex-auto lg:shadow-none bg-background">
        <CustomSuspense>
          <Outlet />
        </CustomSuspense>
      </div>
    </div>
  );
}

function AuthLayout() {
  return (
    <RedirectIfAuthenticated>
      <Layout />
    </RedirectIfAuthenticated>
  );
}

export default AuthLayout;
