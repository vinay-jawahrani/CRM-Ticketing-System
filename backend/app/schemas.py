from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum

class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    CLOSED = "Closed"

# Ticket schemas
class TicketBase(BaseModel):
    customer_name: str
    customer_email: EmailStr
    subject: str
    description: str

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    note_text: Optional[str] = None

class Ticket(TicketBase):
    id: int
    ticket_id: str
    status: TicketStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    notes: List['Note'] = []

    class Config:
        from_attributes = True

# Note schemas
class NoteBase(BaseModel):
    note_text: str

class NoteCreate(NoteBase):
    ticket_id: int

class Note(NoteBase):
    id: int
    ticket_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Response schemas
class TicketListResponse(BaseModel):
    ticket_id: str
    customer_name: str
    subject: str
    status: TicketStatus
    created_at: datetime

class TicketDetailResponse(Ticket):
    pass

class TicketCreateResponse(BaseModel):
    ticket_id: str
    created_at: datetime