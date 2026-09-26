# GlobInn Hotel Module

TypeScript/Express hotel APIs backed by PostgreSQL and Drizzle ORM. The optional
Redis service caches autocomplete responses; PostgreSQL remains the source of truth.

## Setup and run

Requirements: Docker Compose, or Node.js 22+, PostgreSQL, and npm.

For the Docker setup:

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec backend npm run db:migrate
```

The API listens on `http://localhost:3000` by default. To run the app directly on
the host instead, start PostgreSQL and Redis, set `DATABASE_URL` to a reachable
PostgreSQL instance, then run:

```bash
npm install
npm run db:migrate
npm run dev
```

Environment variables (defaults are shown in `.env.example`):

| Variable | Purpose |
| --- | --- |
| `APP_PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | Runtime environment |
| `DATABASE_URL` | PostgreSQL connection string; required by the API and migration tooling |
| `POSTGRES_USER` | Docker PostgreSQL username |
| `POSTGRES_PASSWORD` | Docker PostgreSQL password; change for non-local deployments |
| `POSTGRES_DB` | Docker PostgreSQL database name |
| `POSTGRES_PORT` | Host port mapped to PostgreSQL |
| `REDIS_URL` | Redis connection string; optional, cache failures fall back to PostgreSQL |
| `REDIS_PORT` | Host port mapped to Redis |

The Compose file supplies container-to-container database and Redis URLs to the
backend. The host-facing `DATABASE_URL` in `.env` is for local tooling.

## API documentation

Swagger UI: `http://localhost:3000/api-docs`  
OpenAPI JSON: `http://localhost:3000/openapi.json`

| Method and path | Behavior | Success | Common errors |
| --- | --- | --- | --- |
| `POST /hotels` | Create hotel and optional images atomically | `201` with `{ "data": hotel }` | `400` validation error, `500` unexpected error |
| `GET /hotels/autocomplete?q=gra` | Active hotel-name prefix search, 2+ query characters, maximum 10 results | `200` array of `{ id, name, city }` | `400` validation error, `500` unexpected error |
| `GET /hotels/:id` | Hotel and images ordered by `sortOrder` | `200` hotel object | `400` invalid ID, `404` hotel not found, `500` unexpected error |

Validation failures use a consistent `{ "error": { "code", "message", "details" } }`
shape. Hotel creation accepts required `name`, `address`, `city`, `countryCode`,
`latitude`, `longitude`, and `starRating`, plus optional `description` and `images`.
Country codes must be ISO 3166-1 alpha-2; coordinates must be within their geographic
ranges; and star ratings are integers from 1 to 5. Image URLs must be valid and
unique per hotel, and at most one image can be primary. Invalid image data rejects
the whole request with `400` rather than being silently skipped. If images are
provided without a primary, the first is made primary; their input order becomes
`sortOrder` starting at 1. A hotel is active by default.

## Architecture and data model

Controllers parse DTOs and translate HTTP input/output, services hold hotel
creation, normalization, primary-image defaults, and cache behavior, and repositories
own Drizzle queries and transactions. Shared middleware maps validation and
application failures to consistent HTTP responses. OpenAPI definitions are kept in
`src/docs/openapi.ts`.

`hotels` stores hotel attributes, an indexed lowercase `normalized_name`, and active
status. `hotel_images` stores each image with its hotel foreign key, URL, primary
flag, and order. Images are a separate table because a hotel has a one-to-many
relationship with images: this keeps hotel rows normalized, lets the database enforce
per-hotel URL/order uniqueness and a single primary image, and supports ordered image
queries without loading image data for autocomplete. The foreign key cascades image
deletion when a hotel is deleted.

Hotel and image insertion runs in one PostgreSQL transaction. Any image insert error
rolls back the hotel insert as well. The schema and versioned migrations are in
`src/database/schema.ts` and `drizzle/`; after schema changes, generate and apply a
migration with:

```bash
npm run db:generate
npm run db:migrate
```

## Autocomplete performance

The current query lowercases the input, performs an escaped literal prefix match on
`normalized_name`, filters to active hotels, selects only `id`, `name`, and `city`,
orders deterministically, and limits results to ten. A partial B-tree index on
`normalized_name` for active hotels supports this workload. Keeping the indexed
column normalized avoids applying `LOWER()` to every row at query time. Verify the
query plan with `EXPLAIN (ANALYZE, BUFFERS)` against production-like data; PostgreSQL
collation and operator-class choices can affect whether a B-tree is used for prefix
matching, so use a compatible pattern operator class if measurements require it.

At 5 million or more hotels, keep the bounded projection and result limit, monitor
the index and query plan, and tune connection pooling and cache hit rate. The optional
Redis cache stores results for five minutes. Creation increments a cache-version
key, making old entries unreachable without deleting them one by one; Redis failure
falls back to PostgreSQL. For typo-tolerant or infix search, PostgreSQL `pg_trgm`
with GIN/GiST indexes is an option, but it changes the search semantics and index
cost. If search traffic, ranking, typo tolerance, or cross-field search outgrows
PostgreSQL, Elasticsearch/OpenSearch can serve autocomplete from an asynchronously
maintained search index, with PostgreSQL remaining authoritative. Neither trigram
search nor an external search cluster is required by the current implementation.

## Optional enhancements

These production enhancements are not implemented in this assignment:

- **Image CDN:** In production, hotel image URLs could use a CDN for edge caching,
  faster delivery, and image transformations. An upload or image-processing pipeline
  would be needed to manage assets; this API currently stores and returns URLs only.
- **Rate limiting:** A rate limit could protect autocomplete from excessive traffic.
  In a multi-instance deployment, use a shared store such as Redis so limits apply
  consistently across API instances. No rate limiter is configured currently.
- **Soft delete:** A `deletedAt` marker could support recoverable deletion and be
  excluded from normal hotel queries. `isActive` currently controls autocomplete
  visibility; it does not represent deletion, and no delete endpoint is provided.

## Tests

With the database migrated and required services available, run:

```bash
npm test
npm run typecheck
```

Integration tests use PostgreSQL and remove only the test hotel records they create.
Docker health checks wait for PostgreSQL and Redis before starting the backend. Stop
services with `docker compose down`; add `-v` only when deliberately deleting local
database and Redis volumes.
