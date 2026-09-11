from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from datetime import datetime
import random
import string
from app import models, schemas


def generate_ticket_id():
    prefix = "TKT"
    random_num = ''.join(random.choices(string.digits, k=3))
    return f"{prefix}-{random_num}"


async def create_ticket(db: AsyncSession, ticket: schemas.TicketCreate):
    db_ticket = models.Ticket(
        ticket_id=generate_ticket_id(),
        customer_name=ticket.customer_name,
        customer_email=ticket.customer_email,
        subject=ticket.subject,
        description=ticket.description,
        status=models.TicketStatus.OPEN
    )
    db.add(db_ticket)
    await db.commit()
    await db.refresh(db_ticket)
    return db_ticket


async def get_tickets(db: AsyncSession, status: str = None, search: str = None):
    query = select(models.Ticket)

    if status:
        query = query.filter(models.Ticket.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Ticket.ticket_id.ilike(search_term),
                models.Ticket.customer_name.ilike(search_term),
                models.Ticket.customer_email.ilike(search_term),
                models.Ticket.subject.ilike(search_term),
                models.Ticket.description.ilike(search_term)
            )
        )

    query = query.order_by(models.Ticket.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def get_ticket(db: AsyncSession, ticket_id: str):
    query = select(models.Ticket).filter(models.Ticket.ticket_id == ticket_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def update_ticket(db: AsyncSession, ticket_id: str, ticket_update: schemas.TicketUpdate):
    db_ticket = await get_ticket(db, ticket_id)
    if not db_ticket:
        return None

    if ticket_update.status:
        db_ticket.status = ticket_update.status
        db_ticket.updated_at = datetime.utcnow()

    if ticket_update.note_text:
        note = models.Note(
            ticket_id=db_ticket.id,
            note_text=ticket_update.note_text
        )
        db.add(note)

    await db.commit()
    await db.refresh(db_ticket)
    return db_ticket