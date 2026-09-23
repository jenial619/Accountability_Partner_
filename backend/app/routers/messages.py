from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models import User, Partner, Message
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/messages",
    tags=["Messages"]
)


# ---------------------------------------------------------
# SEND MESSAGE
# ---------------------------------------------------------

@router.post("/send")
def send_message(
    receiver_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Cannot message yourself
    if receiver_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot send a message to yourself"
        )

    # Check receiver exists
    receiver = (
        db.query(User)
        .filter(User.id == receiver_id)
        .first()
    )

    if not receiver:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check that users are accepted partners
    partner = (
        db.query(Partner)
        .filter(
            or_(
                and_(
                    Partner.requester_id == current_user.id,
                    Partner.receiver_id == receiver_id,
                    Partner.status == "accepted"
                ),
                and_(
                    Partner.requester_id == receiver_id,
                    Partner.receiver_id == current_user.id,
                    Partner.status == "accepted"
                )
            )
        )
        .first()
    )

    if not partner:
        raise HTTPException(
            status_code=403,
            detail="You can only message your connected partner"
        )

    # Check empty message
    if not content.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        content=content.strip()
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "content": message.content,
        "created_at": message.created_at
    }


# ---------------------------------------------------------
# GET MESSAGES WITH PARTNER
# ---------------------------------------------------------

@router.get("/partner/{partner_id}")
def get_partner_messages(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check that the other user exists
    partner_user = (
        db.query(User)
        .filter(User.id == partner_id)
        .first()
    )

    if not partner_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check accepted partnership
    partner = (
        db.query(Partner)
        .filter(
            or_(
                and_(
                    Partner.requester_id == current_user.id,
                    Partner.receiver_id == partner_id,
                    Partner.status == "accepted"
                ),
                and_(
                    Partner.requester_id == partner_id,
                    Partner.receiver_id == current_user.id,
                    Partner.status == "accepted"
                )
            )
        )
        .first()
    )

    if not partner:
        raise HTTPException(
            status_code=403,
            detail="You are not connected with this partner"
        )

    # Get messages between the two users
    messages = (
        db.query(Message)
        .filter(
            or_(
                and_(
                    Message.sender_id == current_user.id,
                    Message.receiver_id == partner_id
                ),
                and_(
                    Message.sender_id == partner_id,
                    Message.receiver_id == current_user.id
                )
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    return [
        {
            "id": message.id,
            "sender_id": message.sender_id,
            "receiver_id": message.receiver_id,
            "content": message.content,
            "created_at": message.created_at
        }
        for message in messages
    ]