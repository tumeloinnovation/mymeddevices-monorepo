# MyMedDevices Backend Application (`apps/backend`)

> [!TIP]
> For the complete step-by-step internal system pipelines, RS256 token lifecycle, M-Pesa webhook callback engine, and middleware stack diagrams, see [Backend Infrastructure Flow](file:///home/nickm/Developer/company/MyMedDevices/apps/backend/FLOW.md).


The backend is an asynchronous **Python 3.12 FastAPI** web service providing RESTful APIs, authentication, payment integration, catalog management, and transactional notifications for all MyMedDevices applications.

---

## Technical Stack

- **Framework**: FastAPI (0.136+) + Uvicorn (0.49+)
- **Database & ORM**: Async SQLAlchemy 2.0 + `asyncpg` (PostgreSQL) / `aiosqlite` (Dev/Test)
- **Database Migrations**: Alembic
- **Security & Hashing**: RS256 JWT (`pyjwt`) + Argon2 (`argon2-cffi`)
- **Validation**: Pydantic v2 + Pydantic-Settings
- **Caching & Rate Limiting**: Redis 8.0+
- **AI Integration**: Google Gemini API (`gemini-2.5-flash`)
- **Search & Indexing**: Typesense
- **Email Engine**: Jinja2 + MJML responsive templates + SMTP

---

## Directory Structure

```
apps/backend/
├── app/
│   ├── main.py              # Application entry point, lifespan, CORS, error handlers
│   ├── core/                # Core system configurations
│   │   ├── config.py        # Pydantic BaseSettings environment manager
│   │   ├── database.py      # Async SQLAlchemy engine & session maker
│   │   ├── security.py      # Argon2 password hashing & RS256 JWT encoding/decoding
│   │   ├── dependencies.py  # DB sessions & RBAC role dependencies (require_role)
│   │   ├── middleware.py    # Request logging & content length limiters
│   │   ├── rate_limiting.py # Sliding-window rate limiter (Redis / in-memory)
│   │   ├── blacklist.py     # JWT token revocation blacklist
│   │   ├── mail.py          # Async SMTP email dispatch
│   │   └── tasks.py         # Background maintenance scheduler
│   └── domains/             # 12 Feature domains
│       ├── admin/           # System status & vendor approvals
│       ├── auth/            # Auth, tokens, OTP passcodes, user devices
│       ├── catalog/         # Products, categories, brands, tags, AI assistant
│       ├── customers/       # Profiles, addresses, loyalty points, wishlists
│       ├── payments/        # M-Pesa Daraja STK Push, callbacks, refunds
│       ├── recommendations/ # Product recommendation engine
│       ├── returns/         # Order return requests
│       ├── shared/          # Base mixins & Outbox pattern
│       ├── shopping/        # Carts, checkout, coupons, orders, shipments
│       ├── tickets/         # Support ticket management
│       ├── users/           # User profiles
│       └── vendor/          # Store settings, payouts, fulfillment
├── compiled_emails/         # Compiled responsive HTML email templates
├── migrations/              # Alembic database migration scripts (36 versions)
├── scripts/                 # Seed & database initialization scripts
├── static/                  # File storage for uploads (/static/uploads/)
├── templates/               # MJML source email templates
├── tests/                   # Pytest async test suite
├── pyproject.toml           # Python dependencies
└── alembic.ini              # Alembic configuration
```

---

## Development Setup & Commands

### Running Development Server
From root directory:
```sh
pnpm dev:backend
```
Or directly from `apps/backend/`:
```sh
uv run uvicorn app.main:app --reload --port 8000
```

### Database Migrations (Alembic)
```sh
# Run all pending database migrations
uv run alembic upgrade head

# Create a new migration script after changing models
uv run alembic revision --autogenerate -m "Add new domain table"
```

### Seeding Development Data
```sh
# Initialize development database & seed sample products, categories, users
uv run python scripts/seed_db.py

# Create initial superadmin account
uv run python scripts/create_admin.py
```

### Running Tests
```sh
uv run pytest
```

---

## Key Feature Workflows

### 1. Adding a New Feature Domain
1. Create directory `app/domains/<domain_name>/`.
2. Add `models.py` inheriting from `Base, IDMixin, AuditMixin, SoftDeleteMixin`.
3. Add `schemas.py` defining Pydantic request/response models.
4. Add `service.py` with business logic functions.
5. Add `routes.py` with FastAPI endpoints.
6. Register the domain router in `app/main.py`.
7. Generate and execute Alembic migration (`uv run alembic revision --autogenerate`).

### 2. Transactional Email System
- Email templates are written in **MJML** under `templates/`.
- Compiled HTML files reside in `compiled_emails/`.
- `app/core/mail.py` sends emails asynchronously using worker threads (`anyio.to_thread.run_sync`) to prevent blocking the event loop.

### 3. File Uploads
- Product images are saved to `static/uploads/products/`.
- Profile avatars are saved to `static/uploads/avatars/`.
- Upload endpoint validates image format (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`) and generates unique UUID filenames.
