from contextlib import asynccontextmanager
from fastapi import FastAPI,Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app import models
from app.database import engine, get_db
from app.config import settings
from app.router import auth as auth_router
from app.router import tickets as tickets_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield

app = FastAPI(
    title="Customer Support CRM API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

origins = [o.strip() for o in settings.allowed_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(tickets_router.router)


@app.get("/")
async def root():
    return {"message": "CRM API running"}


@app.get("/health")
async def health(db=Depends(get_db)):
    result = await db.execute(text("SELECT version()"))
    return {"status": "healthy", "version": result.scalar()}