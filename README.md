# GlobInn Hotel Module

## Project setup (step 1)

The application runs as three independent Docker containers:

- `backend`: Node.js/TypeScript API
- `postgres`: PostgreSQL database
- `redis`: Redis cache (reserved for autocomplete caching)

This separation is standard practice: each service has an independent lifecycle,
configuration, and persistent data volume where needed.

### Run locally with Docker

```bash
cp .env.example .env
docker compose up --build
```

The initial foundation exposes `GET /health` at `http://localhost:3000/health`.

### API documentation

With the backend running, open interactive Swagger UI at
`http://localhost:3000/api-docs`. The machine-readable OpenAPI document is served
from `http://localhost:3000/openapi.json`.

### Create hotel

`POST /hotels` creates a hotel and all supplied images in one database transaction.
Invalid request data returns `400`; image URLs must be valid and unique per hotel,
and at most one may be primary. If images are supplied without a primary image, the
first image becomes primary. Invalid image data is rejected rather than silently
changed.

### Hotel autocomplete

`GET /hotels/autocomplete?q=gra` requires a minimum two-character query and returns
at most ten active hotels. The search is case-insensitive and uses a literal prefix
match against `normalized_name`; images are deliberately not queried or returned.

### Hotel details

`GET /hotels/:id` returns a hotel and its images in ascending `sortOrder`. An
unknown ID returns `404`; an invalid ID returns a `400` validation error.

### Tests

With Docker services running and migrations applied, execute the integration suite:

```bash
npm test
```

Tests use PostgreSQL and delete only the hotel records that they create.

### Redis autocomplete cache

Autocomplete results are cached in Redis for five minutes. A hotel creation bumps a
cache-version key, so subsequent autocomplete requests immediately use a fresh key
without scanning or deleting every existing cache entry. Redis failures never fail
the API: autocomplete safely falls back to PostgreSQL.

### Database migrations

Generate a SQL migration from the Drizzle schema, then apply it after the
containers are running:

```bash
npm run db:generate
npm run db:migrate
```

The schema lives in `src/database/schema.ts`; generated, versioned SQL migrations
are kept in `drizzle/`. The first migration creates the `hotels` and `hotel_images`
tables, their foreign key, database constraints, and indexes for hotel-image
retrieval and active-hotel prefix search.

Stop the services with `docker compose down`. Add `-v` only when you deliberately
want to delete the local PostgreSQL and Redis data volumes.
