---
name: node-security-audit
description: Audita proyectos Node.js y npm en modo de lectura, con evidencia localizada, límites por versión y recomendaciones verificables. Usar para una revisión de seguridad del proyecto o su cadena de dependencias.
---
# Node Security Audit

Inspeccioná el proyecto y entregá un informe usando [la plantilla](references/report.md).
Leé [los controles detallados](references/checklist.md) para cubrir runtime,
dependencias, código sensible y CI. Alcance predeterminado: lectura local.

No instalar dependencias, ejecutar código o scripts del proyecto, modificarlo ni
enviar su información a servicios externos. No ejecutar npm audit por defecto:
consulta un servicio externo. Los comandos propuestos para verificar correcciones
son instrucciones futuras, no autorización para ejecutarlos. Usá lectura estática
y búsqueda; no sigas enlaces simbólicos fuera del alcance acordado.

1. Delimitá rutas y evidencia faltante. Revisá archivos declarativos, lockfiles,
   código y CI. No deduzcas la versión efectiva por engines o una imagen flotante:
   distinguí declarado, resuelto y observado en evidencia existente.
2. Clasificá cada conclusión como **comprobada**, **indicio** o **requiere validación**.
   Una coincidencia textual no demuestra explotabilidad; una ausencia de evidencia
   no demuestra ausencia de riesgo. No atribuyas controles a versiones incompatibles.
3. Cada hallazgo incluye ubicación y evidencia redactada, riesgo y contexto,
   prioridad, recomendación, compatibilidad por versión y cómo verificar la corrección.
   No copies secretos ni los guardes en informes. Solo ruta, línea y categoría.
4. Citá documentación oficial de la versión pertinente. Podés consultar documentación
   pública sin incluir paquetes privados, código ni datos del proyecto en consultas.
   Si no podés comprobar una afirmación, marcala pendiente.
5. Separá hallazgos, controles observados y límites de cobertura. No declares un
   proyecto seguro a partir de una revisión estática o un lockfile limpio.

El helper opcional `node scripts/inspect.mjs RUTA` lee archivos sin ejecutar el
proyecto y escribe un inventario preliminar en stdout. No reemplaza la revisión del
código ni la lista completa de controles.

Todos los informes, incluso parciales o sin hallazgos, deben conservar la atribución
exacta de la plantilla. Separar autor de la skill, agente que produjo el informe y
autores de las fuentes técnicas. No atribuir hallazgos al autor de la skill.
