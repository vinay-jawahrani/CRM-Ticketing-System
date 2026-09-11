from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    CLOSED = "Closed"


class UserRole(str, Enum):
    AGENT = "agent"
    ADMIN = "admin"


# ------------------------------
# User / Auth schemas
# ------------------------------

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.AGENT


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ------------------------------
# Note schemas
# ------------------------------

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


# ------------------------------
# Ticket schemas
# ------------------------------

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
    notes: List[Note] = []

    class Config:
        from_attributes = True


class TicketListResponse(BaseModel):
    ticket_id: str
    customer_name: str
    subject: str
    status: TicketStatus
    created_at: datetime

    class Config:
        from_attributes = True


class TicketDetailResponse(Ticket):
    pass


class TicketCreateResponse(BaseModel):
    ticket_id: str
    created_at: datetime