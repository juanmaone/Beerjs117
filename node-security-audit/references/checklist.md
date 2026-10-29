# Controles de lectura

## Versiones y dependencias

Revisar engines, packageManager, .nvmrc, .node-version, Dockerfiles, CI y evidencia
existente de versiones efectivas. Rangos y etiquetas flotantes no fijan el parche.
Node y npm se versionan independientemente. Comprobar soporte con
https://nodejs.org/en/about/previous-releases sin revelar datos del proyecto.

Inventariar manifests y workspaces, lockfiles e integridades, fuentes Git/URL,
registros privados y coherencia con npm ci. Un lockfile no prueba ausencia de
vulnerabilidades. hasInstallScript indica un script, no su contenido ni ejecución.
Si node_modules está disponible, leer scripts sin ejecutarlos; si falta, registrar
la limitación. Diferenciar hooks raíz de hooks de dependencias.

## Instalación y permisos

Revisar .npmrc sin mostrar tokens; ignore-scripts, allowScripts,
strict-allow-scripts y min-release-age según versión. npm 12 cambia aprobación de
scripts de dependencias; no asumir esa política en npm 11 o en scripts raíz.
https://docs.npmjs.com/cli/v12/using-npm/config/

Revisar flags reales: --permission, autorizaciones fs-read/fs-write, child-process,
worker y addons. Verificar disponibilidad exacta de red y --permission-audit.
Node 24 no bloquea red con --permission; Node 26 tiene --allow-net (capacidad
general, no filtro de host). Node no tiene --allow-env. Audit mode registra sin
bloquear. Los permisos no son una frontera robusta contra código hostil ni
reemplazan aislamiento del sistema operativo.
https://nodejs.org/api/permissions.html (usar documentación versionada si difiere).

## Código, secretos y aislamiento

Buscar archivos y rutas construidas desde entradas, traversal, procesos hijo y
shell, eval/Function, módulos nativos, descargas y ejecución, destinos de red
controlables (SSRF), deserialización y validación de entradas. Trazar origen y
controles antes de afirmar explotabilidad.

Buscar secretos solo dentro del alcance; no imprimir valores. Identificar fixtures
ficticios. Observar mínimos secretos por proceso, logs, permisos del SO/contenedor,
montajes, usuario, capacidades y egreso. Un Dockerfile no prueba aislamiento en producción.

## CI y equipo

Revisar npm ci, lockfiles, typecheck (Node .ts no verifica tipos), pruebas,
dependencias y secretos, actualizaciones, revisión de scripts, permisos del
workflow, acciones fijadas por commit y uso de secretos en PRs no confiables.
Registrar excepciones, responsables y recuperación de parches. No ejecutar
workflows ni escáneres conectados durante la auditoría predeterminada.

Por control registrar evidencia o «no evaluado / requiere validación».
Priorizar impacto y exposición; no convertir toda ausencia en riesgo crítico.
