# Backend - SCIB Technical Test

## Descripcion general

Este backend implementa la parte servidor de la prueba tecnica. Su responsabilidad es recibir los datos del formulario enviados desde el frontend, procesar un archivo Excel y generar un JSON unico con toda la informacion del candidato.

## Caracteristicas principales

- Endpoint HTTP que recibe `name`, `surname` y un archivo Excel via `multipart/form-data`.
- Procesamiento del Excel con la libreria `xlsx` para obtener seniority, anos de experiencia y disponibilidad.
- Combinacion de los datos del formulario y del Excel en una sola respuesta JSON.
- Validaciones basicas del contenido enviado y manejo inicial de errores.
- Arquitectura limpia siguiendo principios SOLID y cobertura con tests de servicio/utilidades mediante Jest.

## Estructura del proyecto

```
backend/
src/
  app.module.ts
  candidates/
    candidates.controller.ts
    candidates.service.ts
  dto/
  utils/
test/
package.json
tsconfig.json
```

## Endpoints principales

### `POST /candidates/upload`

Recibe un formulario con:

- `name` - string
- `surname` - string
- `file` - archivo Excel (`.xlsx`)

Ejemplo de respuesta:

```json
{
  "name": "John",
  "surname": "Doe",
  "seniority": "junior",
  "years": 6,
  "availability": true
}
```

Este JSON sera almacenado por el frontend para construir el listado de candidatos.

### `GET /candidates`

Devuelve el array completo de candidatos ya procesados y persistidos por el backend. El frontend puede consumir este endpoint para reconstruir la tabla tras un refresh o reinicio del servidor.

## Persistencia en disco

Cada candidato aceptado se guarda en `data/candidates.json`. Este archivo se crea automaticamente si no existe y contiene un array JSON con todos los registros acumulados.

### Limpiar la informacion

Para reiniciar el almacenamiento basta con dejar el fichero vacio (`[]`). Dos maneras rapidas:

1. Eliminar `data/candidates.json`; en el siguiente inicio del backend se volvera a crear vacio.
2. Sobrescribir el contenido con `[]` (por ejemplo, usando tu editor o redireccionando `echo [] > data/candidates.json`).

Ambas opciones borran definitivamente los registros, asi que solo ejecútalas cuando quieras reiniciar las pruebas.

## Instalacion y ejecucion

1. Instalar dependencias: `npm install`
2. Levantar en modo desarrollo: `npm run start:dev`

El backend queda expuesto en `http://localhost:3000`.

## Tests

- `npm run test` - ejecuta la suite completa.
- `npm run test:watch` - modo interactivo.
- `npm run test:cov` - genera reporte de cobertura.

Todos los servicios, utilidades o helpers nuevos deben incluir sus tests unitarios asociados.

## Principios de desarrollo

- Aplicacion estricta de principios SOLID y separacion de responsabilidades.
- Controladores delegan la logica de negocio en servicios.
- Logica de parsing, validacion y transformaciones encapsulada en servicios o utilidades reutilizables.
- Codigo claro, mantenible y escalable.

## Tecnologias utilizadas

- NestJS (TypeScript)
- Multer para `multipart/form-data`
- xlsx para leer Excel
- Jest para pruebas unitarias

## Roadmap

- Anadir validaciones exhaustivas del formulario.
- Profundizar en tests del servicio de parsing y del controlador.
- Mejor manejo de errores ante Excel invalido o columnas ausentes.
- Eliminar el archivo temporal una vez procesado.
- Incorporar un sistema basico de logs.

## Autor

Proyecto desarrollado como parte de la prueba tecnica para SCIB.
