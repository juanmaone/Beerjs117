# Guion de escena · 25–30 minutos

Público mixto. Seis demos, 18 variantes. Objetivo: revisar la confianza del proceso,
sus dependencias y la instalación sin exigir migrar de runtime.

| Slide | Tiempo | Mostrar / explicar |
|---|---|---|
| 1 | 0:00–0:45 | Apertura y QR de sesión, recuperable con En vivo. |
| 2 | 0:45–2:00 | Node, dependencias y capacidades del proceso. |
| 3 | 2:00–5:00 | Siete arrepentimientos: Promises, seguridad, GYP, package.json, node_modules, extensiones, index.js. Complejidad, mantenimiento y seguridad tienen consecuencias diferentes. |
| 4 | 5:00–6:30 | Deno 1, compatibilidad gradual (npm 1.28, package.json 1.31), consolidación en Deno 2. |
| 5 | 6:30–7:15 | Deno y Cloudflare: anuncio 9/10/2026, mantenimiento temporal; citar el anuncio. |
| 6 | 7:15–9:30 | Archivos: solo el archivo de entrada está autorizado en Node con permisos. |
| 7 | 9:30–11:00 | Entorno: Node no tiene --allow-env. Secretos mínimos por proceso. |
| 8 | 11:00–13:00 | Red: servidor de laboratorio separado, hijo restringido. Solo loopback. |
| 9 | 13:00–14:30 | Subprocesos: ejecutar un programa amplía la confianza. |
| 10 | 14:30–17:00 | Instalación: primero INSTALL_EXIT=0, luego marcadores. npm y Node son independientes. |
| 11 | 17:00–18:15 | allowScripts, strict-allow-scripts, min-release-age y excepciones para parches. |
| 12 | 18:15–20:00 | TypeScript: ejecutar no es verificar. deno check y tsc --noEmit. |
| 13 | 20:00–21:30 | Capacidades y límites por versión, permisos opt-in, auditoría no bloquea. |
| 14 | 21:30–23:00 | Aplicación: soporte, permisos, secretos, validación, aislamiento. |
| 15 | 23:00–25:00 | Dependencias y equipo: scripts, lockfile, npm ci, actualizaciones y CI. |
| 16 | 25:00–27:00 | Skill de lectura, QR permanente, Word y ZIP, créditos y licencias. |

**Aviso privado después de la slide 3:** responder todas las preguntas iniciales
(versiones, gestor, scripts y confianza). Hay unos tres minutos de margen hasta los 30.

**Aviso privado antes del cierre:** repetir «¿Cuánta confianza tenés ahora en tu
configuración y en tu forma de desarrollar software seguro?» y comparar con el inicio.
No hay diapositivas de encuestas ni integración con Mentimeter.

Flechas: navegación. N: notas privadas; no se transmiten. En vivo: crear/cerrar sesión
y recuperar el QR. Docker sigue local; un teléfono no puede ejecutar variantes.
Al perder Internet continuar localmente. Al fallar Docker conservar el error;
cambiar explícitamente a un respaldo real completo. Nunca sustituir silenciosamente
un fallo por una salida esperada. Las seis claves internas siguen siendo 4, 5, 6, 7, 9 y 11.

Ver `artifacts/guia-demos.docx` (generar con `npm run guide`) para fichas,
glosario y recuperación. Ver VALIDACION.md antes de afirmar que el ensayo está aprobado.

Propuestas opcionales: hilo conductor, segunda ejecución corregida, predicciones
del público, incidente real breve y material reproducible. La descarga por QR es parte de esta versión.

Apertura: Juan Martín Funes y QR de LinkedIn. Slide 17 (27:00–29:00): agradecimiento, preguntas, LinkedIn y QR a node-security-audit en el repositorio.
