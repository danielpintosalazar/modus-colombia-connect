## **5\. Decisiones pendientes que el equipo debe confirmar antes de la Fase 0**

Estas son las incoherencias y vacíos detectados entre el prompt v1 y el material fuente. Cada una trae una recomendación por defecto pensada para minimizar riesgo en 24h; el equipo puede aceptarla tal cual o cambiarla, pero debe quedar decidida antes de generar el modelo de datos.

**D1 — ¿"Entidad de Respuesta" es un rol separado del Estado, o se fusionan para el MVP?** Las historias de usuario les dan pantallas y permisos distintos (el Estado dona/asigna recursos; la Entidad de Respuesta ejecuta y reporta en campo). Separarlos es más fiel a la idea pero cuesta un rol extra de auth y una vista extra en 24h. *Recomendación:* para P0, fusionar ambos bajo un solo rol `estado_entidad_respuesta` con permisos combinados (ver panel consolidado \+ vincularse a necesidades \+ reportar avance). Separarlos en dos roles queda como P1 si sobra tiempo.

R// hagamos el P0 lo mejor es unirlos

**D2 — Conflicto de stack: Firestore vs. PostGIS/PostgreSQL, y Python vs. C\# .NET.** El documento de requisitos original proponía PostGIS para datos geoespaciales y sugería C\# .NET para el agente de matching/optimización. El prompt v1 ya fijó Firebase/Firestore \+ FastAPI (Python) como stack "no renegociable". *Recomendación:* se confirma Firebase/Firestore \+ FastAPI como stack único (sección 9). Firestore no soporta consultas nativas sobre polígonos GeoJSON — por eso el esquema ya usa `lat/lng + radio` como aproximación de "zona de influencia" en vez de polígonos reales. Si el frontend o el jurado esperan polígonos dibujados en el mapa, se pueden mostrar como capa visual estática (GeoJSON servido tal cual desde Storage) sin que el backend haga consultas espaciales sobre ellos.  

R// el stack que como las opciones de google asi que si es firebase firestore \+ Fastapi y python

**D3 — Falta la entidad `iniciativas` en el modelo de datos.** Es el concepto central del portal público y del catálogo del donante (cards con área de influencia, población impactada, actores participantes, fotos, metas, entidad responsable), pero v1 no la incluía en Firestore. *Recomendación:* agregarla al esquema como colección P0 en versión mínima (sin fotos antes/después ni insights de inversión, eso es P1/P2). Ver sección 11\.

R// si solo agregar esquema

**D4 — Falta la entidad `necesidades` con trazabilidad de fuente.** Las historias de usuario mencionan que un "Sistema de Identificación" detecta necesidades automáticamente y que el agente "crea el objeto necesidad con sus propiedades", pero nunca se define ese esquema. *Recomendación:* modelarla como colección P0 simplificada: `{ id, zona_id, tipo_necesidad, fuente ("manual"|"agente_diagnostico"|"sistema_riesgo"), estado, entidad_vinculada_id, timestamp }`. Ver sección 11\.

R// si realizar la recomendacion

**D5 — Nombre duplicado: "Acceso a oportunidades".** En las historias de usuario del donante privado, "Acceso a oportunidades" se usa dos veces para dos cosas distintas: (a) negocios afectados y oportunidades de recuperar ingresos, y (b) conectar personas con ayudas, empleo, formación y redes de apoyo verificadas. *Recomendación:* renombrar la segunda como **"Redes de apoyo social"** para evitar ambigüedad en el frontend y en cualquier taxonomía de sectores que use el backend.

R// si hacer la recomendacion

**D6 — Reporte de emergencia multimedia (audio/video/imagen).** Las historias de usuario piden que el botón de "generar reporte de emergencia" acepte audio, grabación e imagen, con geolocalización automática. Esto implica un pipeline de transcripción/procesamiento que no está en el contrato de ningún agente de v1. *Recomendación:* en P0 el reporte de emergencia solo acepta **texto \+ imagen \+ geolocalización automática** (la imagen ya la consume el Agente de Diagnóstico). Audio/video con transcripción queda en P2 — es la funcionalidad de mayor riesgo técnico para 24h si se intenta meter en el camino crítico.

R// realizar la recomendacion

**D7 — Métricas comparativas público vs. privado y leaderboard de donantes.** Las historias de usuario piden un "top 10 de donantes" y comparación de recursos movilizados público vs. privado. v1 solo contempla métricas básicas de déficit/cobertura calculadas directo sobre Firestore. *Recomendación:* el top 10 y la comparación público/privado quedan en P1 (son agregaciones simples sobre `donaciones`, no requieren BigQuery). BigQuery se mantiene fuera del camino crítico de la demo, tal como ya indicaba v1.

R// hacer la recomendacion

**D8 — Mapeo de materia prima para reconstrucción (madera / GeoCVC / *Pinus patula*) y su matching con deforestación.** Aparece en el documento de requisitos original marcado ya por el propio equipo como "(implementación posterior)", y no vuelve a aparecer ni en v1 ni en las historias de usuario. *Recomendación:* se elimina del alcance activo de este prompt y queda solo como nota de roadmap (Anexo A la menciona por completitud). No generar modelos, agentes ni endpoints para esto.

R// si hacer la recomendacion

## **2\. Contexto del proyecto**

Plataforma de coordinación de ayuda humanitaria post-desastre (terremoto y otras emergencias) en Colombia, para una hackatón de 24 horas financiada por Google y Platzi. Conecta a los actores de una crisis — quienes la sufren, quienes la financian y quienes responden operativamente — a través de un portal público con mapa de emergencias e iniciativas, un sistema de priorización de recursos, y métricas de ayuda por sector y región.

**Requisito obligatorio del jurado:** el sistema debe implementar uno o varios **agentes de IA** (no solo lógica de reglas) y debe integrar servicios de Google: **Firebase (Auth, Firestore, Storage), Google Maps API, BigQuery, y Vertex AI (Gemini)**.

**Restricción dura:** 24 horas de desarrollo con 5 personas (\~18h útiles reales). El objetivo NO es construir el sistema completo descrito en la documentación de producto — es construir un recorte demostrable, robusto, con fallback local si alguna API de Google falla durante la demo en vivo.

**Referencias de dominio usadas para inspirar el diseño** (no se integran en vivo, son solo referencia conceptual): Ushahidi (mapeo colaborativo de crisis), Sahana Eden (estructura de inventario/distribución), HOT Tasking Manager (mapeo de daños sobre imágenes satelitales — es lo que el Agente de Diagnóstico automatiza).

* ## **3\. Actores y roles del sistema**

| Rol | Qué hace en el MVP | Fuente |
| ----- | ----- | ----- |
| **Damnificado** | Ve iniciativas y emergencias de su región en el portal público; reporta su ubicación (auto-geolocalizada), número de familiares y necesidad principal; puede postularse como beneficiario de una iniciativa. | v1 \+ historias de usuario |
| **Donante particular** | Consulta en lenguaje natural (vía Agente Orquestador) dónde/cómo ayudar; ve el catálogo de iniciativas priorizadas según su interés. | v1 \+ historias de usuario |
| **Empresa donante (sector privado)** | Registra una donación (tipo, cantidad, sector) y la asigna a una zona/empresa beneficiaria; ve un balance simplificado de su aporte. | v1 \+ historias de usuario |
| **Empresa beneficiaria** | Ve qué ayudas le fueron asignadas y su estado. | v1 |
| **Estado / donante sector público** | Ve panel consolidado: zonas priorizadas, déficit por sector, comparación de recursos públicos vs. privados; puede asignar espacios de recolección y notificar entidades. | v1 \+ historias de usuario |
| **Entidad de respuesta** *(rol nuevo respecto a v1 — ver Decisión D1)* | Recibe notificaciones del agente de identificación de riesgo; ve catálogo de necesidades filtrable por su sector; se vincula a una necesidad y reporta avance; crea iniciativas y campañas de apoyo. | Historias de usuario (no estaba en v1) |
| **Sistema de Identificación (agente, no humano)** | Ingiere datos de fuentes abiertas/de riesgo y genera automáticamente objetos `necesidad` con su fuente de origen. | Historias de usuario (no estaba en v1) |

* 

