# SCIB Candidates Frontend

Aplicación Angular (v20) que permite cargar candidatos mediante un formulario reactivo, subir un archivo Excel con su información y visualizar los candidatos procesados por el backend de NestJS.

## Requisitos funcionales

- Formulario con nombre, apellido y un archivo Excel (`.xlsx`) que contenga una única fila con:
  - `seniority`: `junior` | `senior`
  - `years`: número entero positivo
  - `availability`: boolean (`true/false`, `yes/no`, `1/0`, etc.)
- El Excel se valida en cliente antes de enviarse y se normaliza para garantizar el formato esperado por el backend.
- Los candidatos devueltos se almacenan en memoria y se muestran en una tabla de Angular Material.
- Manejo de errores global (via interceptor) y feedback visual en la interfaz (snackbars, estados de carga, dropzone accesible).

## Stack

- Angular 20 standalone + Angular Material
- Reactive Forms + Signals
- Custom dropzone para archivos `.xlsx`
- Servicios dedicados (`CandidateApiService`, `CandidateStorageService`) y helper de validación
- Tests con Karma/Jasmine (`ng test`)

## Scripts clave

| Comando              | Descripción                                               |
| -------------------- | --------------------------------------------------------- |
| `npm install`        | Instala dependencias                                      |
| `npm start`          | Levanta el servidor de desarrollo (http://localhost:4200) |
| `npm run start:prod` | Levanta la app con configuración de producción            |
| `npm run build`      | Compila la app para producción en `dist/`                 |
| `npm test`           | Ejecuta los unit tests con Karma                          |

## Flujo de trabajo recomendado

1. **Levantar backend** en `http://localhost:3000` (NestJS).
2. **Iniciar frontend** con `npm start`.
3. Completar el formulario, arrastrar o seleccionar un Excel válido y enviar.
4. Verificar que el candidato aparece en la tabla junto a los datos enriquecidos.

## Estructura relevante

```
src/app/
 ├─ core/            # interfaces, validadores, interceptores
 ├─ private/
 │   └─ candidates/
 │      ├─ containers/upload-candidate
 │      ├─ components/candidate-table
 │      └─ services/
 └─ shared/
     └─ components/drop-files-zone
```

## Tests

Cada servicio y componente principal cuenta con unit tests. Para ejecutarlas:

```bash
npm test
```

Se incluye cobertura para:

- Interacción del formulario (`UploadCandidateComponent`)
- Servicios API y almacenamiento
- Dropzone y tabla de candidatos
- Interceptor de errores HTTP

## Notas

- El backend debe exponer `POST /candidates/upload` aceptando `multipart/form-data`.
- Las rutas del entorno se configuran en `src/environments`.
- El proyecto utiliza un interceptor para mapear mensajes del backend a errores amigables para el usuario.
