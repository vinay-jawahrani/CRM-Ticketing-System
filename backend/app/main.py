from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from . import models, schemas, crud
from .database import engine, get_db
from fastapi import FastAPI, Depends
from app.dependencies import verify_api_key
from app.config import settings
from contextlib import asynccontextmanager
from app import models
from app.database import engine
app = FastAPI(
    title="Customer Support CRM API",
    version="1.0.0",
    docs_url=None if settings.api_key else "/docs",
    redoc_url=None if settings.api_key else "/redoc",
)

app = FastAPI(dependencies=[Depends(verify_api_key)])

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic (before yield)
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield

app = FastAPI(title="Customer Support CRM API", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Customer Support CRM API"}

@app.post("/api/tickets", response_model=schemas.TicketCreateResponse)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    """Create a new support ticket"""
    try:
        db_ticket = crud.create_ticket(db, ticket)
        return schemas.TicketCreateResponse(
            ticket_id=db_ticket.ticket_id,
            created_at=db_ticket.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/tickets", response_model=list[schemas.TicketListResponse])
def list_tickets(
    status: Optional[str] = Query(None, regex="^(Open|In Progress|Closed)$"),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all tickets with optional filters"""
    tickets = crud.get_tickets(db, status, search)
    return tickets

@app.get("/api/tickets/{ticket_id}", response_model=schemas.TicketDetailResponse)
def get_ticket_details(ticket_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific ticket"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@app.put("/api/tickets/{ticket_id}")
def update_ticket(
    ticket_id: str,
    ticket_update: schemas.TicketUpdate,
    db: Session = Depends(get_db)
):
    """Update ticket status and/or add notes"""
    updated_ticket = crud.update_ticket(db, ticket_id, ticket_update)
    if not updated_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "success": True,
        "updated_at": updated_ticket.updated_at or updated_ticket.created_at
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)