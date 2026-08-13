---
name: emails
description: Email template system and build workflows for MJML templates
---

# Email System

The platform uses MJML for template generation, providing responsive HTML emails.

## Template Locations

- **Source templates**: `apps/backend/templates/emails/`
- **Compiled output**: `apps/backend/compiled_emails/`

## Building Email Templates

Build MJML templates into HTML using either method:

```bash
# From monorepo root
pnpm build:emails

# Or directly with Python
python3 scripts/build_emails.py
```

## Local SMTP Testing

For local email testing, **Mailpit** is installed at `/home/nickm/.local/bin/mailpit`.

```bash
# Start Mailpit
/home/nickm/.local/bin/mailpit
```

Mailpit provides:
- **SMTP Port**: `127.0.0.1:1025`
- **Web UI Dashboard**: `http://localhost:8025`

The web interface allows you to inspect emails sent during development without actually delivering them.
