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

Stop the services with `docker compose down`. Add `-v` only when you deliberately
want to delete the local PostgreSQL and Redis data volumes.
