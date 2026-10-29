# Validación · versión 1.0.0

Actualización de presentación, 29/10/2026: **17 diapositivas**. La apertura incluye
Juan Martín Funes y QR a LinkedIn; el cierre agrega agradecimiento, preguntas y
QR a la skill del repositorio. Ambos QR se generaron con qrcode y se decodificaron
para comprobar sus destinos. Navegación y diseño verificados en escritorio y teléfono
(34 capturas); sincronización local con 100 espectadores aprobada. Los registros
anteriores de 16 diapositivas describen la versión previa. La subida sigue bloqueada
porque esta sesión no puede escribir .git/index.lock.

Actualización de la guía, 29/10/2026: el Word ahora tiene **12 páginas**, con
comparaciones explícitas Node 24 / Node 26 / Deno, riesgos, mejoras y frases para
exponer. Incluye controles de salida a Internet y apéndice de comandos. Exportado
con ONLYOFFICE y renderizado con PDF.js; todas las páginas revisadas visualmente.
Las nueve páginas mencionadas en el registro del 27/10 corresponden a la guía anterior.

27/10/2026 · Windows · Node 24.19.0. **El ensayo completo Docker y el ensayo por
Internet con teléfonos físicos siguen pendientes.** No hay backup-real.json.

## Comprobaciones locales

- `npm test`: **17 pruebas aprobadas**, sin fallos ni omitidas. Incluye navegación
  de 16 slides, notas, 18 terminales, carga de respaldos completos y rechazo de
  incompletos, cambio explícito de modo y errores visibles. También valida controles
  del runner, límites de estado público y recuperación sin regresar a slides antiguas.
- Ejecuciones reales locales: Node 24 hace fetch a un servidor separado en loopback;
  npm 11.17.0 ejecuta los dos hooks del fixture y npm 12.0.2 los bloquea con
  instalación exitosa. Estas instalaciones son de un paquete conocido, sin Internet.
  Fallos de instalación y contradicciones se prueban además con dobles de prueba.
- `npm run test:browser`: Chromium, 1440×1000 y 390×844; 16 slides, navegación,
  notas privadas en escritorio y vista de lectura en teléfono. Sin desbordamiento
  horizontal; las slides largas permiten scroll vertical. 32 capturas en
  artifacts/slides, revisadas visualmente, además de las consolas sincronizadas.
- `npm run test:sync`: **Workerd local real + Durable Objects SQLite**,
  **100 WebSockets** reciben la actualización. Dos contextos Chromium con tamaño
  de teléfono comprueban pausa individual y vuelta al directo, reconexión,
  incorporación tardía, salidas en texto, exit=1 visible, fuente en vivo/respaldo,
  tamaño de consola, cierre y rechazo de publicaciones sin credencial o con notas
  privadas. El servicio rechaza /run. El runner rechaza orígenes ajenos.
  Las salidas de Docker en esta prueba son explícitamente sintéticas.
- Expiración: el servicio programa alarm a las 24 horas; se prueba la rama de
  expiración con estado vencido, sin esperar un día. Cierre inmediato probado
  contra Workerd. No se certifica una espera real de 24 horas.
- `npm run build` y `npm run test:package`: dos ZIP y Word abiertos y descargados
  por HTTP local. Lista explícita de publicación; sin perfiles, claves ni cachés.
  QR de materiales decodificado a la URL prevista; QR real de sesión decodificado
  desde el canvas de la interfaz. Resultados en artifacts/package-check.json y
  artifacts/sync-check.json. No prueban que la URL pública ya esté publicada.
- Skill: validador estructural aprobado, tres proyectos ficticios, helper sin
  ejecución del proyecto y revisión manual de los casos. Ver docs/SKILL-VALIDACION.md.
  No es un benchmark independiente de comportamiento de un agente.
- Word: **9 páginas**, exportadas con ONLYOFFICE x2t y renderizadas con PDF.js;
  todas revisadas visualmente (artifacts/guide-pages/page-1.png a page-9.png).
  OOXML: 35 partes, XML y relaciones bien formados, nueve secciones. El validador
  XSD de la skill no pudo iniciarse porque falta defusedxml; no se afirma validación
  completa de esquema. Word COM no estuvo disponible; el render alternativo sí.

## Pendientes externos

1. Acceso al motor Docker: esta sesión recibe «permission denied» en su named pipe
   y no puede leer la configuración Docker del usuario. No se ejecutaron las 18
   variantes completas en las tres imágenes, especialmente Node 26 y Deno.
2. Con Docker Linux accesible: construir las imágenes, iniciar el runner y ejecutar
   `node capture-backup.mjs`. Solo 18 resultados comprobados generan el respaldo.
   Cargarlo, detener el runner y repetir las seis demos en modo RESPALDO.
3. El propietario sube main a GitHub, elige Actions como fuente de Pages, despliega
   el Worker en su cuenta Free y completa syncUrl y la clave local. Las instrucciones
   están en docs/PUBLICACION.md. Ninguna cuenta fue desplegada desde esta sesión.
4. Comprobar las tres descargas desde la URL pública y ensayar con **dos teléfonos
   físicos por Internet**, incluyendo pérdida de red y cierre. La emulación local
   aprobada no sustituye ese ensayo ni prueba cuotas reales de Cloudflare.
5. Git: se inicializó main, pero el entorno protege `.git` como solo lectura.
   `git add` falla al crear `.git/index.lock`. No hay commits ni origin creados.
   `scripts/prepare-git.ps1` deja los tres grupos concretos para ejecutar con la
   cuenta del propietario; no se intentó eludir la protección ni subir el repositorio.

Las propuestas opcionales quedan en el guion. La descarga por QR está implementada.
