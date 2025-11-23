# Backend – SCIB Technical Test

## Overview

NestJS backend that receives candidate submissions from the Angular frontend, parses a single-row Excel file, and returns a unified JSON payload (name, surname, seniority, years, availability). The frontend stores each response incrementally.

## Key Features

- `POST /candidates/upload` accepts `name`, `surname`, and an Excel file via `multipart/form-data`.
- Excel parsing powered by `xlsx`, validating required columns and transforming values.
- `GET /candidates` returns every candidate previously saved on disk.
- Basic validation/error handling (missing fields, invalid Excel data, wrong MIME type).
- Automatic cleanup of temporary files and a lightweight logging layer (Nest Logger + interceptor) for diagnostics.
- Unit tests for services/utils and e2e coverage of the upload flow (Jest + Supertest).

## Project Structure

```
src/
  app.module.ts
  candidates/
    candidates.controller.ts
    candidates.service.ts
    dto/
    pipes/
    storage/
    utils/
test/
  app.e2e-spec.ts
package.json
tsconfig.json
```

## API

### POST /candidates/upload

Form fields:

- `name` – string
- `surname` – string
- `file` – Excel (`.xlsx`) with one valid row containing `seniority`, `years`, `availability`

Sample response:

```json
{
  "name": "John",
  "surname": "Doe",
  "seniority": "junior",
  "years": 6,
  "availability": true
}
```

### GET /candidates

Returns the accumulated array of candidates so the frontend can rebuild the table after refreshes.

## Persistence

Accepted candidates are appended to `data/candidates.json`. The file is created automatically when the server starts. To reset the storage, delete the file or overwrite it with `[]`; the next request will recreate it.

## Getting Started

1. Install dependencies: `npm install`
2. Start in development mode: `npm run start:dev`

Default URL: `http://localhost:3000`

## Testing

- `npm run test` – unit tests
- `npm run test:watch` – watch mode
- `npm run test:cov` – coverage report
- `npm run test:e2e` – Supertest suite

## Development Guidelines

- Controllers stay thin; all business logic lives in services/providers.
- Excel parsing/validation is encapsulated in `ExcelCandidateParser`.
- Disk persistence uses a simple repository so it’s easy to swap later.
- Every new helper/service should include Jest specs.

## Tech Stack

- NestJS (TypeScript)
- Multer for multipart uploads
- `xlsx` for Excel parsing
- Jest + Supertest for testing

## Roadmap

- More detailed DTO validation and custom messages.
