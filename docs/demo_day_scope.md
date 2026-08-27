# Alcance para el día de demo

Recorte demostrable en ~18h útiles con 5 personas. No es el sistema completo del plan de producto.

## Dentro del alcance

- 5 zonas de demo precargadas (`data/mock/`), no ingestión real de imágenes satelitales.
- Los 3 agentes (Diagnóstico, Priorización, Orquestador) con fallback simulado por reglas + integración real a Vertex AI (Gemini) cuando las credenciales estén disponibles.
- Endpoints REST por rol sobre Firestore (sin BigQuery en el camino crítico de la demo).
- Firebase Auth con custom claims por rol (5 roles del plan).
- Manejo de errores para que un fallo de Vertex AI / Maps / BigQuery caiga a mock, nunca a una excepción visible en pantalla.

## Fuera del alcance (explícitamente pospuesto)

- BigQuery como fuente de verdad de métricas — capa opcional, no bloqueante.
- Reconciliar el shape de datos del mock del frontend (`modus-data.ts`, en inglés/camelCase, sin lat/lng real) con el esquema Firestore en español — ver `frontend_analisis.md`, sección "Qué falta por definir".
- Autenticación real conectada al `RoleSwitcher` del frontend.
- Optimización (cache, colas, microservicios) — prohibido explícitamente por el plan (sección 9).
