from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app import schemas, crud, models
from app.database import get_db
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.post("", response_model=schemas.TicketCreateResponse)
async def create_ticket(
    ticket: schemas.TicketCreate,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    try:
        db_ticket = await crud.create_ticket(db, ticket)
        return schemas.TicketCreateResponse(
            ticket_id=db_ticket.ticket_id,
            created_at=db_ticket.created_at,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[schemas.TicketListResponse])
async def list_tickets(
    status: Optional[str] = Query(None, pattern="^(Open|In Progress|Closed)$"),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return await crud.get_tickets(db, status, search)


@router.get("/{ticket_id}", response_model=schemas.TicketDetailResponse)
async def get_ticket_details(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ticket = await crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.put("/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    ticket_update: schemas.TicketUpdate,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    updated = await crud.update_ticket(db, ticket_id, ticket_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"success": True, "updated_at": updated.updated_at or updated.created_at}


@router.delete("/{ticket_id}", dependencies=[Depends(require_role("admin"))])
async def delete_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
):
    ticket = await crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    await db.delete(ticket)
    await db.commit()
    return {"success": True}