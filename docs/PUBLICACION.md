# Publicación por el propietario

La implementación no publica ni sube archivos a las cuentas. La subida a GitHub
corresponde al propietario. Configuración pública única: project.config.json.
Nunca colocar credenciales en ese archivo, HTML, QR ni variables de GitHub Pages.

## Git y GitHub Pages

Rama main; repositorio público github.com/juanmaone/Beerjs117.
Revisar `git status --short` y `git ls-files` antes de subir. `.checks`, `.local`,
.env, perfiles, sesiones, cachés y logs están excluidos. Los fixtures usan datos ficticios.
No añadir resultados parciales como backup-real.json.

En GitHub: crear el repositorio sin README inicial; añadir origin si falta y subir main.
En esta sesión `.git` quedó de solo lectura: `git add` no pudo crear index.lock.
No hay commits creados por el agente. Ejecutar `pwsh -File scripts/prepare-git.ps1`
como propietario crea los tres commits (contenido, skill, seguimiento) y prepara
origin. El script no hace push. Revisarlo antes de ejecutarlo.
En Settings > Pages elegir **GitHub Actions** como fuente. El workflow prueba y
construye; publica únicamente dist/. No publica el runner como servicio.
La URL prevista es https://juanmaone.github.io/Beerjs117/ .
El propietario verifica que el sitio y sus tres descargas responden antes del evento.

## Cloudflare gratuito, SQLite y WebSockets

Crear o usar una cuenta Workers **Free**, sin activar servicios ni planes pagos.
Los Durable Objects con SQLite están disponibles en Free; al superar las cuotas
gratuitas se rechazan operaciones. Revisar cuotas vigentes antes del evento.
El código usa hibernación WebSocket, snapshots al inicio/final de variantes,
máximo 150 sockets por sesión, expiración/alarm a las 24 horas y cierre anticipado.
No hay rutas Docker, comandos arbitrarios ni ejecución remota.

1. Instalar con `npm ci`; autenticar el CLI: `npx wrangler login`.
2. Crear una clave aleatoria larga para crear sesiones (por ejemplo 32 bytes
   aleatorios). Guardarla en un gestor y en `.local/sync.json` local.
3. `npx wrangler secret put CREATE_TOKEN --config sync/wrangler.jsonc`.
4. Revisar ALLOWED_ORIGIN: `https://juanmaone.github.io` (un origen no incluye ruta).
5. Generar el módulo con `npm run sync:build`; desplegar con
   `npx wrangler deploy --config sync/wrangler.jsonc`.
6. Copiar la URL HTTPS workers.dev resultante a syncUrl de project.config.json.
   Reconstruir con `npm run build`, subir el cambio y esperar Pages.
7. Crear `.local/sync.json` en la computadora del expositor:

```json
{
  "syncUrl": "https://TU-WORKER.TU-SUBDOMINIO.workers.dev",
  "createToken": "CLAVE-EXCLUSIVA-DEL-EXPOSITOR"
}
```

Solo el runner lee createToken. Cada sesión recibe otra clave de publicación que
permanece en memoria del runner y nunca llega al navegador. El QR solo contiene el
identificador público de lectura. No compartir capturas de configuración local.
El URL de sesión es público para quien lo conoce; no transmitir datos sensibles.
Solo se transmiten las salidas de estas demos conocidas y secretos ficticios.

El servicio devuelve estado, comandos, texto de consolas, fuente, ejecución y exit;
las notas privadas no se transmiten. El texto largo se trunca con una marca visible
para mantener snapshots por debajo del límite. Las revisiones se serializan.

Abrir `http://127.0.0.1:8787/` con el runner iniciado, pulsar En vivo > Crear sesión.
El QR aparece en apertura y puede recuperarse con En vivo / QR. Cerrar sesión al
terminar. Si se reinicia el runner se pierde su credencial de sesión: crear otra;
la anterior caduca sola. Si falla Internet, la cola pública no detiene Docker y
reintenta el estado actual cada diez segundos. En Free no hay garantía de servicio.

## Pruebas locales y versiones

`npm test`, `npm run build`, `npm run test:browser`, `npm run test:sync`.
Las pruebas de sincronización usan Workerd local, dos contextos de navegador y
100 WebSockets; no sustituyen dos teléfonos físicos por Internet.
`sync/dev.jsonc` contiene una clave inequívocamente ficticia para localhost;
**no desplegar esa configuración**.

Para una versión: actualizar versiones centrales y package.json, atribución de la
skill si cambia su versión y lockfile; ejecutar build, revisar el Word y etiquetar
`v1.0.0`. El workflow de tags crea release con charla ZIP, skill ZIP y guía Word.
No incluye capturas Docker si falta un respaldo completo validado.

## Fuentes de despliegue

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Hibernación: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Free y SQLite: https://developers.cloudflare.com/durable-objects/platform/pricing/

Consultadas el 27/10/2026; confirmar los límites antes de cada evento.

## Render de la guía

`npm run guide` genera el Word. En Windows con ONLYOFFICE Desktop instalado:
`scripts/render-guide.ps1 -ConverterPath RUTA/x2t.exe -FontDir RUTA/data/fonts`.
FontDir debe contener AllFonts.js y font_selection.bin de la instalación local.
Genera PDF y PNG de todas las páginas en artifacts/guide-pages para revisión.
En otros sistemas puede usarse LibreOffice headless y pdftoppm. El PDF de revisión
no sustituye el Word entregable y no se publica automáticamente.
