const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const PORTS = [3001, 5173]; // Puertos para NestJS y Vite

async function findProcessOnPort(port) {
	try {
		const { stdout } = await execAsync(
			`netstat -ano | findstr :${port} | findstr LISTENING`
		);
		const lines = stdout.trim().split("\n");

		for (const line of lines) {
			const match = line.match(/\s+(\d+)\s*$/);
			if (match) {
				return match[1]; // Retorna el PID
			}
		}
		return null;
	} catch (error) {
		return null; // Si no encuentra nada, retorna null
	}
}

async function killProcess(pid) {
	try {
		// Primero intentamos cerrar el proceso amablemente
		await execAsync(`taskkill /PID ${pid}`);
		console.log(`Proceso ${pid} cerrado correctamente`);
	} catch (error) {
		try {
			// Si falla, forzamos el cierre
			await execAsync(`taskkill /F /PID ${pid}`);
			console.log(`Proceso ${pid} forzado a cerrar`);
		} catch (forceError) {
			console.log(`No se pudo cerrar el proceso ${pid}: ${forceError.message}`);
		}
	}
}

async function killPort(port) {
	console.log(`Buscando procesos en el puerto ${port}...`);

	const pid = await findProcessOnPort(port);

	if (pid) {
		console.log(`Encontrado proceso (PID: ${pid}) en puerto ${port}`);
		await killProcess(pid);
		// Verificamos que el puerto se haya liberado
		const pidAfterKill = await findProcessOnPort(port);
		if (!pidAfterKill) {
			console.log(`✅ Puerto ${port} liberado exitosamente`);
		} else {
			console.log(
				`⚠️ El puerto ${port} sigue ocupado por el proceso ${pidAfterKill}`
			);
		}
	} else {
		console.log(`ℹ️ No se encontraron procesos en el puerto ${port}`);
	}
}

async function main() {
	console.log("🔄 Iniciando limpieza de puertos...");

	for (const port of PORTS) {
		try {
			await killPort(port);
		} catch (error) {
			console.error(
				`Error al intentar liberar el puerto ${port}:`,
				error.message
			);
		}
	}

	console.log("✨ Proceso de limpieza completado");
}

// Manejo de errores global
main().catch((error) => {
	console.error("Error en el script:", error);
	process.exit(1);
});
