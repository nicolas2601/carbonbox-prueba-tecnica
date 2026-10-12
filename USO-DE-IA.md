# Uso de Inteligencia Artificial en esta prueba

Este documento describe, sin maquillar, cómo se usó IA para construir esta solución. Se llevó un registro mientras se trabajaba
(`docs/ai-log.md` y una nota por módulo en `docs/ai-log/`), así que lo que sigue sale de ese registro y de los commits, no de la memoria.

## Herramientas utilizadas

- [x] Claude Code (varias sesiones en paralelo, cada una con un rol distinto, ver más abajo)
- [ ] GitHub Copilot
- [x] ChatGPT: modelos de OpenAI (ChatGPT) usados dentro de Claude Code a través de un proxy, junto a los modelos de Claude
- [ ] Cursor AI
- [x] Otras herramientas con IA o automatización: OpenSpec (especificaciones antes del código), una herramienta de diagramas de arquitectura (archify) para el diagrama de AWS, Playwright y axe-core para las pruebas de navegador y accesibilidad

## Cómo se trabajó

Una persona dirigió el trabajo y varias sesiones de Claude Code lo ejecutaron con reparto de roles:

- **Sesión de planificación y revisión**: escribe la especificación de cada módulo, revisa el resultado con evidencia (corre las pruebas, lee el código, mira la base de datos) y explica cada decisión.
- **Sesión de implementación**: construye cada módulo con TDD estricto (primero una prueba que falla, luego el código) y un commit pequeño por ciclo, citando la prueba roja de la que partió.
- **Sesión de pruebas en navegador**: capturas, auditoría de accesibilidad y mediciones.

Además de las sesiones de Claude, usé ChatGPT dentro del mismo Claude Code, a través de un proxy, para tener dos perspectivas independientes sobre decisiones de diseño, revisión de cambios y pruebas. Las respuestas de ambos modelos se contrastaron con el código y las pruebas antes de aceptarlas.

Cada módulo se especificó antes de construirlo (`openspec/specs`), se implementó, se verificó de forma independiente contra el sistema corriendo y recién entonces se mezcló.

## ¿Qué generó la IA?

Casi todo el código fue escrito por la IA bajo esa dirección. En concreto:

### Backend
- [x] Estructura de carpetas y configuración (TypeScript, Vitest, Prisma 7, Convict)
- [x] Esquema de Prisma y migraciones
- [x] Dominio: agregado `Upload` con su máquina de estados, `ActivityData`, objetos de valor, `Either` y errores
- [x] Validación de filas del CSV y lectura con `csv-parse`
- [x] Caso de uso `ProcessFile`, cola durable en PostgreSQL con lease y fencing, worker
- [x] API HTTP en Fastify, manejo central de errores, OpenAPI
- [x] Limitación de tasa, métricas privadas, comando para reencolar trabajos muertos

### Frontend
- [x] Base de Next.js, React Query, Axios y Tailwind
- [x] Formulario de carga con progreso, lista, detalle con polling, dashboard
- [x] Sistema visual y gráficos
- [x] Pruebas unitarias y pruebas de navegador de extremo a extremo

### Infraestructura y documentación
- [x] Dockerfiles, Compose, flujo de CI
- [x] README, runbook, diagrama de AWS, este documento

## ¿Qué decidí yo?

Estas decisiones no las tomó la IA por su cuenta; se discutieron y las confirmé:

- **Cola en PostgreSQL** (no un arreglo en memoria ni SQS), porque el worker es un proceso aparte y porque necesitaba que subida y trabajo se creen en una sola transacción.
- **Crear el `Upload` antes de encolar**: el enunciado lista "encolar" antes de "crear registro", y eso deja un trabajo sin registro si algo falla.
- **Filas inválidas**: el enunciado no lo define; decidí que un archivo con algunas filas malas termine `COMPLETED` con las líneas rechazadas listadas, y `FAILED` solo si no se puede leer o no hay filas válidas.
- **Polling también en `PENDING`**, no solo en `PROCESSING`, porque una subida nueva empieza en `PENDING`.
- **Diseño claro** (no oscuro) y librerías de componentes y gráficos, a partir de referencias que elegí.
- **Mantener la cola en PostgreSQL** al revisar la arquitectura de AWS y no cambiarla por SQS sin un outbox transaccional.

## ¿Qué se corrigió?

La IA se equivocó varias veces; esto es lo que el registro y los commits muestran:

1. **Diagnóstico equivocado al montar el proyecto**: se culpó a ESLint 10 de un fallo que tenía otra causa; se corrigió al aislarla.
2. **Valor por defecto con `null`**: una implementación aceptaba `null` explícito donde no debía; una prueba roja real lo detectó antes de integrarlo.
3. **Archivos de Docker**: un patrón de `.dockerignore` excluía también el código fuente del almacenamiento, y Next.js ejecutado con Bun rompía la compilación de producción. Se acotó el patrón y se compila con Node.
4. **Logo**: el SVG se renderizaba al doble de tamaño y pisaba el nombre; la causa era un `viewBox` sin viewport.
5. **Accesibilidad**: la auditoría con axe encontró un elemento enfocable dentro de una región oculta en los gráficos. Se corrigió en el código, no se bajó el umbral.
6. **CORS**: aceptaba un solo origen, así que abrir `127.0.0.1` en vez de `localhost` dejaba la aplicación rota. Ahora acepta ambos.
7. **Afirmaciones retiradas**: una prueba de recuperación automática no demostraba nada (el contenedor no se había caído) y la compresión de respuestas no se presentó como mejora de latencia porque la empeoró un poco. Se rehízo la prueba y se documentó el costo.

## ¿Qué verifiqué?

- Que cada módulo tuviera pruebas que fallaban antes de existir el código.
- Que el sistema corriendo (API, worker y base de datos reales) hiciera lo que dice la especificación, con archivos de ejemplo incluidos (`samples/EXPECTED.md`).
- Que lo no probado quede declarado como pendiente y no como hecho: ver "Limitaciones conocidas" en el README.

## ¿Qué aprendí?

Cuatro temas, de los cuales dos eran nuevos para mí:

1. **CQRS y Either (nuevos).** No los había usado. Los fui entendiendo módulo por módulo: la sesión de revisión me explicó cada pieza antes de avanzar y yo seguía solo cuando la entendía. Lo que me quedó es por qué los casos de uso devuelven un valor en vez de lanzar excepciones y por qué las consultas no pasan por el agregado.
2. **Cola con lease y fencing (nuevo).** Entendí por qué un arreglo en memoria no sirve entre procesos, qué hace `FOR UPDATE SKIP LOCKED`, por qué un trabajo tiene lease y qué evita el token de claim cuando un worker lento despierta tarde.
3. **Prisma 7 y React Query (ya los conocía).** Los había usado antes. La IA me sirvió sobre todo para ir más rápido y para las diferencias de la versión nueva de Prisma (adaptador y archivo de configuración).
4. **Una lección de proceso.** Que "funciona" no es "está verificado": varias veces la IA dio por bueno algo que una prueba o una medición desmintió (ver "¿Qué se corrigió?"). Aprendí a pedir la evidencia antes de aceptar.

## Tiempo

- **Mi trabajo propio** (dirigir, revisar, probar y estudiar): menos de 12 horas, entre el sábado 10 y el lunes 12 de octubre de 2026.
- **Tiempo de calendario**: el primer commit es del 10 de octubre a las 13:22 (hora de Colombia) y el último de este trabajo del 12 de octubre. Es más largo que mis horas porque la IA ejecutó en paralelo y trabajó mientras yo no estaba delante.
- Esto no es una estimación de cuánto habría tardado una persona sola.
