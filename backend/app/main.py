from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import User, Goal, Task, Partner, Message
from app.routers import auth, goals, tasks, users, partners, messages

app = FastAPI(
    title="Accountability Partner API",
    description="Backend API for the Accountability Partner application",
    version="1.0.0"
)

# Open CORS completely so localhost:5173 is never blocked
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Routes
app.include_router(auth.router)
app.include_router(goals.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(partners.router)
app.include_router(messages.router)

@app.get("/")
def root():
    return {
        "message": "Accountability Partner API is running"
    }

@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "connection failed",
            "error": str(e)
        }