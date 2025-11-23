# SCIB Candidates Frontend

Aplicacion Angular (v20) que permite cargar candidatos mediante un formulario reactivo, subir un archivo Excel con su informacion y visualizar los candidatos procesados por el backend NestJS.

## Requisitos funcionales

- Formulario con nombre, apellido y un archivo Excel (`.xlsx`) que contenga una unica fila con:
  - `seniority`: `junior` | `senior`
  - `years`: numero entero positivo
  - `availability`: boolean (`true/false`, `yes/no`, `1/0`, etc.)
- El Excel se valida en cliente antes de enviarse y se normaliza para garantizar el formato esperado por el backend.
- Los candidatos devueltos se almacenan en memoria y se muestran en una tabla de Angular Material; al iniciar se consulta `GET /candidates` para recuperar los persistidos en el backend.
- Manejo de errores global (via interceptor) y feedback visual en la interfaz (snackbars, estados de carga, dropzone accesible).

## Stack

- Angular 20 standalone + Angular Material
- Reactive Forms + Signals
- Custom dropzone para archivos `.xlsx`
- Servicios dedicados (`CandidateApiService`, `CandidateStorageService`) y helper de validacion
- Tests con Karma/Jasmine (`ng test`)

## Scripts clave

| Comando              | Descripcion                                               |
| -------------------- | --------------------------------------------------------- |
| `npm install`        | Instala dependencias                                      |
| `npm start`          | Levanta el servidor de desarrollo (http://localhost:4200) |
| `npm run start:prod` | Levanta la app con configuracion de produccion            |
| `npm run build`      | Compila la app para produccion en `dist/`                 |
| `npm test`           | Ejecuta los unit tests con Karma                          |

## Flujo de trabajo recomendado

1. **Levantar backend** en `http://localhost:3000` (NestJS). El frontend realiza `GET /candidates` al cargar para poblar la tabla, por lo que la API debe estar disponible.
2. **Iniciar frontend** con `npm start` o `ng serve`.
3. Completar el formulario, arrastrar o seleccionar un Excel valido y enviar.
4. Verificar que el candidato aparece en la tabla junto a los datos enriquecidos y que persiste tras refrescar gracias al backend.

## Estructura relevante

```
src/app/
  core/                                        # interfaces, validadores, interceptores
    constants/excel/excel-alias.constants.ts   # fuente de verdad de alias/columnas para Excel
    utils/excel/excel-alias.utils.ts           # helpers puros (buscar alias, normalizar tokens, etc.)
  private/
    candidates/
      containers/upload-candidate
      components/candidate-table
      services/
  shared/
    components/drop-files-zone
```

## Tests

Cada servicio y componente principal cuenta con unit tests. Para ejecutarlas:

```bash
npm test
```

Se incluye cobertura para:

- Interaccion del formulario (`UploadCandidateComponent`)
- Servicios API y almacenamiento
- Dropzone y tabla de candidatos
- Interceptor de errores HTTP

## Notas

- Si necesitas agregar nuevos alias/columnas válidas para los Excels, actualiza `src/app/core/constants/excel/excel-alias.constants.ts` y los helpers/ tests en `src/app/core/utils/excel`. Esos archivos son la fuente de verdad que consume el parser (`ExcelCandidateParserService`), por lo que no hace falta tocar la clase cada vez que se habilita un nuevo alias.
- El backend debe exponer `POST /candidates/upload` aceptando `multipart/form-data`.
- Las rutas del entorno se configuran en `src/environments`.
- El proyecto utiliza un interceptor para mapear mensajes del backend a errores amigables para el usuario.
- Convención: los **containers** (por ejemplo `upload-candidate` en `private/candidates/containers`) manejan servicios/estado y los **components** (como `candidate-table` o `drop-files-zone`) se enfocan en la presentación. Usa esta separación al agregar nuevas piezas.
- Si más adelante agregan otros patrones relevantes (por ejemplo, la convención “containers vs components” o cómo funcionan los signals en `CandidateStorageService`), se podría añadir una sección dedicada a “Arquitectura/Convenciones” para documentarlo.
