---
name: database
description: Database setup, migrations, and initialization workflows for the backend
---

# Database Management

The backend uses SQLAlchemy 2.0 with async support and PostgreSQL.

## Database Configuration

- **ORM**: SQLAlchemy 2.0 with async support
- **Database**: PostgreSQL (configured via `DATABASE_URL` in `.env`)
- **Connection pooling**: Configured for production
- **Migrations**: Alembic

## Running Migrations

```bash
cd apps/backend

# Apply all migrations
uv run alembic upgrade head

# Create a new migration
uv run alembic revision --autogenerate -m "description"
```

## Development Database Setup

To reset and initialize the development database schema (PostgreSQL), stamp Alembic, and seed default admin/categories:

```bash
cd apps/backend
PYTHONPATH=. uv run python scripts/initialize_dev_db.py
```

This script will:
- Reset the database schema
- Apply Alembic migrations
- Seed default admin user and categories

## Health Check

The backend provides a health check endpoint that includes database and Redis status:

```bash
curl http://localhost:8000/health
```
