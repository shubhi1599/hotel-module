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

### Database migrations

After the containers are running, initialize or upgrade the database schema:

```bash
docker compose exec backend npm run db:migrate
```

Migrations are versioned in `src/database/migrations`. The first migration creates
the `hotels` and `hotel_images` tables, their foreign key, database constraints,
and indexes for hotel-image retrieval and active-hotel prefix search.

Stop the services with `docker compose down`. Add `-v` only when you deliberately
want to delete the local PostgreSQL and Redis data volumes.
