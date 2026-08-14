# WiFi Measures

Proyecto para gestionar auditorías Wi‑Fi obtenidas desde Link‑Live (NetAlly).

Instrucciones rápidas:

1. Crear un entorno virtual con Python 3.12
2. Instalar dependencias:

```bash
pip install -r requirements.txt
```

3. Ejecutar la aplicación:

```bash
uvicorn main:app --reload
```
# Plantilla Monorepo para aplicaciones web con NestJS, React+Vite+Shadcn/ui y TypeScript

## Descripción

Esta plantilla proporciona una estructura básica para desarrollar aplicaciones web utilizando NestJS en el backend y React con Vite en el frontend. Incluye configuraciones y ejemplos para facilitar el desarrollo y la integración de componentes.

## Características

- Estructura de carpetas organizada para aplicaciones monorepo
- Configuración de TypeScript para el backend y el frontend
- Ejemplos de componentes de interfaz de usuario utilizando Shadcn/ui
- Integración con herramientas de desarrollo modernas como Vite
- Soporte para pruebas y documentación

## Instalación


1. Clona el repositorio

   ```bash
   git clone https://github.com/<your-org>/wifi-measures.git
   ```

2. Navega al directorio del proyecto:

   ```bash
   cd wifi-measures
   ```

3. Instala las dependencias:

   ```bash
   npm install
   ```

4. Crea un archivo .env en la raíz del proyecto copiando el contenido del archivo .env.example tanto para el backend (apps/api) como para el frontend (apps/web). Asegúrate de configurar las variables de entorno necesarias para tu entorno local.

   ```bash
   cp .env.example .env
   ```

### Desarrollo Local

1. Aplica las migraciones de la base de datos:

   ```bash
   cd apps/api
   ```

   ```bash
   npx prisma migrate dev --schema=src/core/database/schema/schema.prisma
   ```

2. Inicia la aplicación:

   ```bash
   npm run dev
   ```

   Esto desplegará tanto el backend como el frontend de la aplicación.

### Producción Local

1. Construye la aplicación:

   ```bash
   npm run build
   ```

2. Ejecuta las migraciones de la base de datos:

   ```bash
   cd apps/api
   ```

   ```bash
   npx prisma migrate deploy --schema=src/core/database/schema/schema.prisma
   ```

3. Inicia la aplicación:

   ```bash
   npm run start:prod
   ```

## Docker

1. Asegúrate de tener Docker y Docker Compose instalados en tu máquina.

   - [Docker](https://docs.docker.com/get-docker/)
   - [Docker Compose](https://docs.docker.com/compose/install/)

2. Clona el repositorio como se indica en la sección de instalación.

3. Copiar el archivo `.env.example` a `.env` de la raíz del repositorio y configurar las variables de entorno necesarias.

4. Creación de imagen y despliegue con docker-compose

   ```bash
   docker-compose up --build -d
   ```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulte el archivo [LICENSE](LICENSE) para obtener más información.
