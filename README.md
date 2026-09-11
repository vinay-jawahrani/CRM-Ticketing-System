# Customer Support Ticketing CRM

A full-stack customer support ticketing system built with **FastAPI**, **PostgreSQL (Neon)**, and **vanilla JavaScript**. Handles the complete ticket lifecycle — creation, search, filtering, status updates, internal notes, and role-based access control for support teams.

**Live Demo:** [https://crm-ticketing-system-frontend.onrender.com](https://crm-ticketing-system-frontend.onrender.com)
**API Docs:** [https://crm-ticketing-system-um63.onrender.com/docs](https://crm-ticketing-system-um63.onrender.com/docs)

> Note: The backend runs on Render's free tier and sleeps after 15 minutes of inactivity. The first request after idle takes ~30–60 seconds to cold start.

---

## Features

### Core
- **Authentication** — Register and login with email + password. Passwords hashed with bcrypt. Sessions managed via JWT.
- **Role-Based Access Control** — Two roles: `agent` and `admin`. Agents handle tickets; admins can additionally delete tickets.
- **Ticket Management** — Create tickets with customer name, email, subject, and description. Auto-generated ticket IDs like `TKT-001`.
- **Live Search** — Debounced (300ms) search across ticket ID, customer name, email, subject, and description.
- **Status Filtering** — Filter by Open, In Progress, or Closed.
- **Ticket Detail View** — Full description, customer info, status history, and notes.
- **Internal Notes** — Add timestamped notes to any ticket for team collaboration.
- **Real-Time Stats** — Dashboard counters for total, open, in-progress, and closed tickets.

### Technical
- Fully async backend (`asyncpg` + SQLAlchemy 2.0 async)
- JWT-based stateless authentication
- Eager relationship loading with `selectinload` to avoid async lazy-load errors
- CORS configured per environment
- Schema auto-created on startup via FastAPI's `lifespan` handler
- Responsive mobile-first UI with no frontend framework

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI 0.104 |
| Database | PostgreSQL (Neon serverless) |
| ORM | SQLAlchemy 2.0 (async) |
| Driver | asyncpg |
| Auth | python-jose (JWT), passlib + bcrypt |
| Validation | Pydantic v2 |
| Server | Gunicorn + Uvicorn workers |
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Hosting | Render (Web Service + Static Site) |
| Icons | Font Awesome 6 |
| Python | 3.12 |

---

## Project Structure

```
crm-ticketing-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app, CORS, lifespan, router wiring
│   │   ├── config.py         # Pydantic settings from .env
│   │   ├── database.py       # Async engine + session
│   │   ├── models.py         # User, Ticket, Note (SQLAlchemy)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # Password hashing, JWT, current user dependency
│   │   ├── crud.py           # Async DB operations
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth.py       # /api/auth/register, /api/auth/login
│   │       └── tickets.py    # /api/tickets CRUD
│   ├── requirements.txt
│   ├── gunicorn_conf.py
│   └── .env.example
├── frontend/
│   ├── index.html            # Main ticket list
│   ├── login.html            # Sign in
│   ├── register.html         # Sign up
│   ├── config.js             # Runtime API base URL
│   ├── css/style.css
│   └── js/
│       ├── auth.js           # Session helpers, login/register forms
│       └── app.js            # Ticket list, detail, search, filter
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.12
- A PostgreSQL database (local or [Neon](https://neon.tech) free tier)
- A modern browser

### 1. Clone the repo

```bash
git clone https://github.com/YOUR-USERNAME/crm-ticketing-system.git
cd crm-ticketing-system
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure environment variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your-long-random-secret-here
JWT_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=http://localhost:3000
```

Generate a secure `JWT_SECRET`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Run the backend

```bash
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. The `users`, `tickets`, and `notes` tables are created automatically on first startup.

### 5. Set up the frontend

Edit `frontend/config.js`:

```javascript
window.APP_CONFIG = {
    API_BASE: 'http://localhost:8000/api'
};
```

### 6. Serve the frontend

```bash
cd frontend
python -m http.server 3000
```

Open `http://localhost:3000`. You'll be redirected to the login page.

---

## API Reference

### Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{email, full_name, password, role}` | `{access_token, token_type, user}` |
| POST | `/api/auth/login` | `{email, password}` | `{access_token, token_type, user}` |

### Tickets

All ticket endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets` | Create a new ticket |
| GET | `/api/tickets?status=&search=` | List tickets (with optional filter and search) |
| GET | `/api/tickets/{ticket_id}` | Get full ticket detail with notes |
| PUT | `/api/tickets/{ticket_id}` | Update status and/or add a note |
| DELETE | `/api/tickets/{ticket_id}` | **Admin only.** Delete a ticket |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | DB connectivity check |

Interactive docs available at `/docs` (Swagger UI) or `/redoc`.

---

## Deployment

### Backend — Render Web Service

| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn -c gunicorn_conf.py app.main:app` |
| Health Check Path | `/health` |
| Python Version | `3.12.0` |

**Environment variables:**

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | 64-char random hex |
| `JWT_EXPIRE_MINUTES` | `1440` |
| `ALLOWED_ORIGINS` | `https://your-frontend.onrender.com` |

### Frontend — Render Static Site

| Setting | Value |
|---------|-------|
| Root Directory | *(blank)* |
| Build Command | `echo "no build"` |
| Publish Directory | `frontend` |

Before deploying, update `frontend/config.js` to point `API_BASE` at the deployed backend URL with `/api` suffix.

---

## Challenges & Solutions

### 1. Async Lazy Loading with SQLAlchemy

Fetching a ticket with its notes relationship crashed with `MissingGreenlet` because async SQLAlchemy cannot lazy-load during serialization. **Fix:** explicit eager loading via `selectinload(models.Ticket.notes)` in the query.

### 2. bcrypt 4.1+ Breaking passlib

passlib 1.7.4 references `bcrypt.__about__.__version__`, which was removed in bcrypt 4.1.0. Registration returned 500s with `AttributeError`. **Fix:** pin `bcrypt==4.0.1` in `requirements.txt`.

### 3. CORS + Localhost in Production

The frontend was calling `http://localhost:8000` after deployment. **Fix:** centralize the API URL in `frontend/config.js`, and whitelist the deployed frontend origin in `ALLOWED_ORIGINS` on the backend.

### 4. Render CDN Caching Stale JavaScript

After deployments, browsers received 304 Not Modified responses serving old `app.js` for hours. **Fix:** cache-busting query strings (`app.js?v=N`) bumped on every release, plus **Clear build cache & deploy** in the Render dashboard.

### 5. Duplicate Global Declarations Across Script Tags

Both `auth.js` and `app.js` declared `const API_BASE`, causing `SyntaxError: Identifier 'API_BASE' has already been declared`. **Fix:** declare `API_BASE` only in `auth.js`; `app.js` references it globally.

---

## Roadmap

- [ ] Password reset via email
- [ ] File attachments on tickets
- [ ] Email notifications on status change
- [ ] Pagination for ticket list
- [ ] Admin panel for user management
- [ ] SLA tracking and ticket assignment
- [ ] Audit log for status changes

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**Vinay Jawahrani**

Built as a portfolio project to demonstrate full-stack development with modern async Python and production-grade deployment practices.
