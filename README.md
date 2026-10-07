# Saathi — accountability, together

Saathi pairs people working toward their own daily goals so they can check in, encourage one another, and build individual and shared streaks. The current implementation uses non-cash coach points: when someone checks in after a partner has encouraged them that day, the partner earns one point. Points are not money, are not redeemable, and cannot be withdrawn.

## Backend API capabilities

The existing My Goals page keeps its original layout and connects to these endpoints. Sign in or register from its goal and partner actions; other pages remain unchanged. When signed out, the original sample goals are displayed as examples.

- Email/password registration and login, with hashed passwords and expiring bearer tokens.
- Daily goal creation, editing, archiving, and category/search filters.
- Scikit-learn TF-IDF suggestions for users with similar, currently unpaired goals.
- Opt-in accountability circles of 2–8 people. Each member contributes their own daily goal and joins using a shared invite code.
- One daily check-in per member; individual and whole-circle consecutive-day streaks.
- One encouragement per sender/recipient pair per day. A point is awarded only if the recipient checks in later that same day.
- API authorization checks to keep goals and circle activity scoped to the signed-in user.

No payment provider, deposits, cash transfers, or forfeiture rules are implemented.

## Run locally on Windows

### 1. Start PostgreSQL

Create a PostgreSQL database named `saathi` (or choose another name), then set the backend environment variables in PowerShell:

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/saathi"
$env:APP_SECRET = "replace-with-a-long-random-secret"
$env:FRONTEND_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
```

Alternatively, copy `backend/.env.example` to `backend/.env` and edit its values; the API loads that file on startup. If `DATABASE_URL` is not set, the backend uses a local SQLite database for development.

### 2. Install and run the API (keep this terminal open)

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload
```

Wait until Uvicorn prints `Application startup complete`, then verify `http://127.0.0.1:8000/api/health` returns `{"status":"ok"}`. Keep this terminal open while using the app. If the API is stopped, login and other app requests cannot connect.

### 3. Existing frontend

In another PowerShell window:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`) and go to **My Goals**. The page uses `http://127.0.0.1:8000` by default; set `VITE_API_URL` before starting Vite if the API is hosted elsewhere. Login and registration from the My Goals page are handled inline; separate Login and Register pages remain unchanged.

## Run backend tests

```powershell
cd backend
py -m pip install -r requirements.txt
py -m pytest -q
```

The tests use an isolated in-memory SQLite database.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET|POST /api/goals`, `PATCH|DELETE /api/goals/{goal_id}`
- `GET /api/matches?goal_id={goal_id}`
- `GET|POST /api/groups`, `POST /api/groups/join`, `GET /api/groups/{group_id}`, `DELETE /api/groups/{group_id}/membership`
- `POST /api/groups/{group_id}/check-ins`
- `POST /api/groups/{group_id}/encouragements`
- `GET /api/health`

The SQLAlchemy models create tables on startup for this MVP. Before production, configure a strong secret and PostgreSQL, add schema migrations, HTTPS, email verification/password recovery, abuse reporting/moderation, and operational backups. Real-money stakes would additionally need separately reviewed payment, custody, payout, dispute, tax, and jurisdictional compliance work; none should be inferred from coach points.
