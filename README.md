# Saathi – Accountability Partner

## 1. About the Project

Saathi is an accountability partner platform designed to help users set goals, monitor their progress, and maintain consistency. It provides a centralized workspace for managing goals and supporting personal growth.

## 2. Features

- User registration and login
- Goal creation and editing
- Dashboard for tracking goals
- Goal management
- Accountability partner features
- User profile and workspace

 

## 3. Tech Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

### Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- JWT authentication, if implemented

### Database
- PostgreSQL

## 4. Project Structure


Accountability_Partner_/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── README.md
└── README.md


## 5. Prerequisites

Install the following before running the project:

- Python and pip
- Node.js and npm
- PostgreSQL

## 6. Installation and Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/jenial619/Accountability_Partner_.git
cd Accountability_Partner_
```

### Step 2: Set Up the Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

Windows:

```bash
.venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

Create a `.env` file inside the `backend/` directory.

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

Replace the placeholders with your local PostgreSQL configuration. Do not commit actual passwords or secrets.

### Step 4: Start the Backend

From the `backend/` directory, run:

```bash
uvicorn app.main:app --reload
```

This assumes the FastAPI application instance is named `app` in `app/main.py`.

### Step 5: Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## 7. API Documentation

If FastAPI's automatic documentation is enabled, visit:

`http://127.0.0.1:8000/docs`

## 8. Project Links

- **GitHub Repository:** https://github.com/jenial619/Accountability_Partner_
- **Live Demo:** Add your deployed application URL here.

## 9. Team Details

**Team Number:** 2

**Team Lead:** Sarah Jenial Mathias

**Team Members:**
- Sarah Jenial Mathias
- Tejaswini
- Nidhi
- Nithyasri
- Vyshnavi
- Shriya

## 10. Security

- Do not commit `.env` files containing secrets.
- Do not publish database passwords, API keys, or authentication secrets.
- Use environment variables for sensitive configuration.

## 11. License

Specify the project's license if one has been selected.