# SCIB Technical Test

This repository contains two applications:

- `front-end-scib/`: Angular client (v20) where candidates are uploaded via a form and Excel files.
- `back-end-scib/` (or the corresponding NestJS backend folder): API responsible for persisting and listing candidates.

Each subproject has its own README with detailed instructions (installation, scripts, architecture). To run or modify the system:

1. Check the README under `front-end-scib/` to learn how to start the app, understand the container vs. component convention, and see how Excel files are normalized.
2. Review the backend README to understand the endpoints (`GET /candidates`, `POST /candidates/upload`) and requirements (NestJS, database, etc.).

> NOTE:
>
> - Backend and frontend must run in parallel (default `http://localhost:4200` and `http://localhost:3000`). Launch the backend first if you want the frontend to fetch the sample candidates already persisted.
> - You will see concise comments across the codebase (especially around Excel parsing) to document business rules and ease future maintenance.
