# BeerJS Córdoba — El legado de Ryan Dahl

## Presentación
Versión 1.0.0 · juanmafunes · **17 diapositivas, 25–30 minutos**.
Código y skill: MIT. Slides y guía: CC BY 4.0; ver LICENSE-CONTENT.md.

Instalar herramientas con `npm ci` y generar materiales con `npm run build`.
Abrí `beerjs-legado-node.html` en Chrome/Firefox; flechas para navegar y **N** para
notas. `abrir-presentacion.bat` abre ese archivo local. Con el runner iniciado,
también podés abrir `http://127.0.0.1:8787/`. Sin runner ni respaldo las terminales
no ejecutan ni simulan resultados. Conservar la carpeta assets junto al HTML.

`npm run build` genera `dist/index.html`, presentación pública, QR y tres descargas:
charla ZIP, skill ZIP y guía Word. Los originales descargables están en artifacts/.
Guion: `guion-25-30-minutos.md`; preguntas y dos avisos privados: `preguntas.md`.

## Ejecutar demos reales
Requisitos: Node 24 LTS y Docker con el motor iniciado, en modo contenedores Linux.
Internet para instalar herramientas y construir imágenes. `docker info` debe responder.

En Windows, abrí Docker Desktop y ejecutá `iniciar-demos.bat`: construye las tres imágenes, detiene la preparación si alguna falla e inicia el runner. Dejá esa ventana abierta y pulsá **Conectar runner** en el HTML. La primera preparación puede tardar varios minutos y necesita Internet.

```bash
docker build -f Dockerfile.node24 -t beerjs-node24:local .
docker build -f Dockerfile.node26 -t beerjs-node26:local .
docker build -f Dockerfile.deno -t beerjs-deno:local .
node runner-server.mjs
```

Abrí el HTML; al comprobar Docker y las tres imágenes cambia a `Modo REAL`. Si lo abriste antes de iniciar el runner, pulsá **Conectar runner**. Solo se aceptan seis demos predefinidas; se ejecutan en contenedores efímeros, con `--network none`, sin descargar imágenes durante la charla. Los puertos de prueba son internos al contenedor; no se publican al host.

La demo de red inicia un servidor de laboratorio separado en `127.0.0.1:8765`; el proceso restringido solo ejecuta `fetch`. El arnés de Deno tiene permisos para crear el servidor y lanzar el hijo; el hijo se ejecuta sin esos permisos. Así, la denegación corresponde a la conexión y no a crear un servidor.

La demo de instalación usa un tarball de `demo-hook` creado con `npm pack --ignore-scripts` durante el build. Un registro en `127.0.0.1:4873`, dentro de cada contenedor, sirve exclusivamente ese paquete. No usa dependencias `file:` ni requiere el registro público durante la charla. El arnés de Deno usa permisos amplios para preparar este laboratorio conocido; el comando `deno install` que se compara no habilita `--allow-scripts`.

Cada terminal muestra las versiones, el comando del arnés cuando corresponde, stdout, stderr y el código de salida. La instalación conserva su fallo original; solo se interpreta la ausencia de marcadores si `INSTALL_EXIT=0`. Una salida que contradiga la demo se marca como inesperada. Las denegaciones esperadas y los errores de tipos conservan su `exit=1` visible. Las políticas de Node no aíslan completamente código hostil.

**Recomendación:** realizar el ensayo completo sin red y grabar las salidas reales como respaldo. El host debe ser de prueba, sin credenciales personales, y Docker debe usar una cuenta sin privilegios administrativos cuando sea posible.

## Teléfonos y publicación

GitHub Pages aloja materiales y espectadores. Worker + Durable Objects SQLite
distribuyen estado de lectura mediante WebSockets. Docker solo corre localmente.
Completar syncUrl pública en project.config.json y la clave privada en
`.local/sync.json`, siguiendo `docs/PUBLICACION.md`. Esa carpeta queda fuera de Git.

Desde el HTML local: En vivo / QR > Crear sesión. El QR temporal aparece en apertura
y es recuperable durante la charla. Los espectadores pueden pausar y volver al
directo, ampliar texto y reconectar; no pueden ejecutar demos ni publicar cambios.
Hay actualizaciones al inicio y fin de cada variante, sin streaming de líneas.
El QR de materiales es permanente; las sesiones caducan a las 24 horas o al cerrarlas.

`docs/PUBLICACION.md` explica GitHub Pages, Cloudflare Free y releases. El usuario
sube main a GitHub y completa la configuración de sus cuentas. No se habilitan planes
pagos. El workflow de Pages solo publica dist/ y el de tags adjunta los tres archivos.

## Skill
`node-security-audit/SKILL.md` define la auditoría de lectura; referencias separadas
contienen los controles y el informe con atribución obligatoria. No instala, ejecuta,
corrige ni envía datos del proyecto por defecto. Los tres casos de prueba y sus
límites están documentados en `docs/SKILL-VALIDACION.md`.

## Ensayo completo y respaldo real
- `guion-25-30-minutos.md`: secuencia, tiempos y avisos privados. **N** muestra notas.
- Con el runner iniciado, ejecutá `node capture-backup.mjs`. Comprueba las **18 ejecuciones** contra `demo-specs.mjs` y genera `backup-real.json` solo si todas coinciden. Si alguna falla, termina con error y conserva el respaldo anterior.
- Cargá el JSON en la presentación: pasa inmediatamente a **Modo RESPALDO**, aunque el runner siga conectado. El botón de modo permite reconectar al runner o volver al respaldo. Un error en vivo nunca se reemplaza automáticamente por una grabación.
- Cerrá el runner y ensayá las seis demos desde el respaldo. Se exige un archivo completo con las 18 salidas validadas; no se aceptan capturas parciales ni el formato anterior sin `schemaVersion: 1`.
- Las etiquetas Node 24/26 y npm 11/12 reciben parches. Conservá las imágenes construidas durante el ensayo y no reconstruyas justo antes de presentar. Las versiones reales quedan en las salidas.
- Verificación: `npm test`, `npm run build`, `npm run test:browser`, `npm run test:sync`.
  Las pruebas de npm ejecutan únicamente el fixture conocido contra un registro
  local. La sincronización usa Workerd, dos teléfonos emulados y 100 espectadores.
  No sustituye el ensayo Docker ni dos teléfonos físicos por Internet.

## Fuentes técnicas

- Node Permission Model: https://nodejs.org/api/permissions.html
- npm 12, políticas de scripts y antigüedad de versiones: https://docs.npmjs.com/cli/v12/using-npm/config/
- Deno, instalación y lifecycle scripts: https://docs.deno.com/runtime/reference/cli/install/
- Dahl, charla original: https://www.youtube.com/watch?v=M3BM9TB-8yA
- Deno 1.28 y 1.31: https://deno.com/blog/v1.28 y https://deno.com/blog/v1.31
- Deno 2: https://deno.com/blog/v2.0
- Deno y Cloudflare (9/10/2026): https://deno.com/blog/cloudflare

Apertura: Juan Martín Funes y QR de LinkedIn. Slide 17 (27:00–29:00): agradecimiento, preguntas, LinkedIn y QR a node-security-audit en el repositorio.
