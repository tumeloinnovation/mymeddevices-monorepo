# Database Reset & Initialization

This document describes how to clean and re-initialize the developer database for the MyMedDevices project.

## Initialization Script

The main utility for database management is located at `apps/backend/scripts/initialize_dev_db.py`.

### What it does:
1.  **Cleans Database**: Drops all existing tables using `CASCADE` (to handle foreign key dependencies).
2.  **Recreates Schema**: Creates all tables defined in the SQLAlchemy models.
3.  **Cleans Typesense**: Deletes all Typesense collections to ensure search is in sync with the new database.
4.  **Creates Admin**: Creates a default admin account.
5.  **Seeds Categories**: Populates the database with initial medical device categories.
6.  **Stamps Migrations**: Runs `alembic stamp head` so the migration history is correctly tracked.

---

## Usage Instructions

Run all commands from the `apps/backend` directory.

### 1. Basic Reset
Cleans everything and sets up default admin/categories.
```bash
uv run python scripts/initialize_dev_db.py
```

### 2. Custom Admin Credentials
```bash
uv run python scripts/initialize_dev_db.py --email myadmin@example.com --password MySecretPassword123
```

### 3. JSON Export/Import of Categories

#### Export current categories:
```bash
uv run python scripts/initialize_dev_db.py --export-categories categories.json
```

#### Import categories from JSON:
```bash
uv run python scripts/initialize_dev_db.py --categories categories.json
```

### 4. Other Options
*   `--no-drop`: Skip dropping tables (only create missing ones and seed).
*   `--no-typesense`: Skip cleaning Typesense collections.

---

## Default Admin Credentials
*   **Email**: `admin@mymeddevices.com`
*   **Password**: `Admin123!`

## Troubleshooting

### "DependentObjectsStillExistError"
The script uses `CASCADE` for PostgreSQL to avoid this. If you encounter it on another database (like SQLite), it's usually because a process still has an open connection to the database. Ensure the backend server is stopped before running the reset.

### "Typesense Connection Refused"
Ensure Typesense is running (usually on port 8108) or use the `--no-typesense` flag if you don't have Typesense installed locally.
