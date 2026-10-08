from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models import User, Partner, Goal
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/partners",
    tags=["Partners"]
)


# ============================================================
# SEND PARTNER REQUEST
# ============================================================

@router.post("/request/{user_id}")
def send_partner_request(
    user_id: int,
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Cannot partner with yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot send a partner request to yourself"
        )

    # Check receiver exists
    receiver = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not receiver:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Check that the selected goal belongs to current user
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found or does not belong to you"
        )

    # Check if a pending/accepted relationship already exists
    # for this exact goal in either direction.
    existing_request = (
        db.query(Partner)
        .filter(
            Partner.goal_id == goal_id,
            Partner.status.in_(["pending", "accepted"]),
            or_(
                and_(
                    Partner.requester_id == current_user.id,
                    Partner.receiver_id == user_id
                ),
                and_(
                    Partner.requester_id == user_id,
                    Partner.receiver_id == current_user.id
                )
            )
        )
        .first()
    )

    if existing_request:

        if existing_request.status == "accepted":
            raise HTTPException(
                status_code=400,
                detail="You are already connected with this user for this goal"
            )

        raise HTTPException(
            status_code=400,
            detail="A partner request already exists for this goal"
        )

    # Create new partnership request
    partner_request = Partner(
        requester_id=current_user.id,
        receiver_id=user_id,
        goal_id=goal_id,
        status="pending"
    )

    db.add(partner_request)
    db.commit()
    db.refresh(partner_request)

    return {
        "message": "Partner request sent successfully",
        "request_id": partner_request.id,
        "goal_id": goal_id
    }


# ============================================================
# GET INCOMING PARTNER REQUESTS
# ============================================================

@router.get("/requests")
def get_partner_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    requests = (
        db.query(Partner, User, Goal)
        .join(
            User,
            Partner.requester_id == User.id
        )
        .join(
            Goal,
            Partner.goal_id == Goal.id
        )
        .filter(
            Partner.receiver_id == current_user.id,
            Partner.status == "pending"
        )
        .order_by(Partner.created_at.desc())
        .all()
    )

    return [
        {
            "id": partner.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "goal_id": goal.id,
            "goal_title": goal.title,
            "status": partner.status
        }
        for partner, user, goal in requests
    ]


# ============================================================
# ACCEPT PARTNER REQUEST
# ============================================================

@router.put("/{partner_id}/accept")
def accept_partner_request(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    partner = (
        db.query(Partner)
        .filter(
            Partner.id == partner_id,
            Partner.receiver_id == current_user.id,
            Partner.status == "pending"
        )
        .first()
    )

    if not partner:
        raise HTTPException(
            status_code=404,
            detail="Partner request not found"
        )

    partner.status = "accepted"

    db.commit()
    db.refresh(partner)

    return {
        "message": "Partner request accepted",
        "partnership_id": partner.id,
        "goal_id": partner.goal_id
    }


# ============================================================
# REJECT PARTNER REQUEST
# ============================================================

@router.put("/{partner_id}/reject")
def reject_partner_request(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    partner = (
        db.query(Partner)
        .filter(
            Partner.id == partner_id,
            Partner.receiver_id == current_user.id,
            Partner.status == "pending"
        )
        .first()
    )

    if not partner:
        raise HTTPException(
            status_code=404,
            detail="Partner request not found"
        )

    partner.status = "rejected"

    db.commit()

    return {
        "message": "Partner request rejected"
    }


# ============================================================
# GET ALL CONNECTED PARTNERS
# ============================================================

@router.get("/my-partners")
def get_my_partners(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    partnerships = (
        db.query(Partner)
        .filter(
            or_(
                Partner.requester_id == current_user.id,
                Partner.receiver_id == current_user.id
            ),
            Partner.status == "accepted"
        )
        .order_by(Partner.created_at.desc())
        .all()
    )

    result = []

    for partnership in partnerships:

        # Find the other user
        if partnership.requester_id == current_user.id:
            partner_user_id = partnership.receiver_id
        else:
            partner_user_id = partnership.requester_id

        partner_user = (
            db.query(User)
            .filter(User.id == partner_user_id)
            .first()
        )

        # Get the goal attached to THIS partnership
        goal = (
            db.query(Goal)
            .filter(
                Goal.id == partnership.goal_id
            )
            .first()
        )

        if not partner_user:
            continue

        if not goal:
            continue

        result.append({
            # Partner information
            "id": partner_user.id,
            "name": partner_user.name,
            "email": partner_user.email,

            # Partnership information
            "partnership_id": partnership.id,
            "status": partnership.status,

            # Goal connected to this partnership
            "goal_id": goal.id,
            "goal_title": goal.title
        })

    return {
        "partners": result
    }


# ============================================================
# GET PARTNER FOR A SPECIFIC GOAL
# ============================================================

@router.get("/goal/{goal_id}")
def get_goal_partner(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Make sure this goal belongs to current user
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    # Find accepted partnership in either direction
    partnership = (
        db.query(Partner)
        .filter(
            Partner.goal_id == goal_id,
            Partner.status == "accepted",
            or_(
                Partner.requester_id == current_user.id,
                Partner.receiver_id == current_user.id
            )
        )
        .first()
    )

    if not partnership:
        return {
            "partner": None
        }

    # Find the other user
    if partnership.requester_id == current_user.id:
        partner_user_id = partnership.receiver_id
    else:
        partner_user_id = partnership.requester_id

    partner_user = (
        db.query(User)
        .filter(
            User.id == partner_user_id
        )
        .first()
    )

    if not partner_user:
        return {
            "partner": None
        }

    return {
        "partner": {
            "id": partner_user.id,
            "name": partner_user.name,
            "email": partner_user.email,
            "partnership_id": partnership.id,
            "goal_id": goal.id,
            "goal_title": goal.title,
            "status": partnership.status
        }
    }


# ============================================================
# GET SELECTED PARTNER'S GOALS
# ============================================================

@router.get("/partner/{partner_id}/goals")
def get_partner_goals(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Check that the two users have at least one
    # accepted partnership.
    partnership = (
        db.query(Partner)
        .filter(
            Partner.status == "accepted",
            or_(
                and_(
                    Partner.requester_id == current_user.id,
                    Partner.receiver_id == partner_id
                ),
                and_(
                    Partner.requester_id == partner_id,
                    Partner.receiver_id == current_user.id
                )
            )
        )
        .first()
    )

    if not partnership:
        raise HTTPException(
            status_code=403,
            detail="You are not connected with this partner"
        )

    partner_user = (
        db.query(User)
        .filter(
            User.id == partner_id
        )
        .first()
    )

    if not partner_user:
        raise HTTPException(
            status_code=404,
            detail="Partner not found"
        )

    goals = (
        db.query(Goal)
        .filter(
            Goal.user_id == partner_id
        )
        .order_by(Goal.created_at.desc())
        .all()
    )

    return {
        "partner": {
            "id": partner_user.id,
            "name": partner_user.name,
            "email": partner_user.email
        },
        "goals": [
            {
                "id": goal.id,
                "title": goal.title,
                "description": goal.description,
                "progress": goal.progress,
                "deadline": goal.deadline
            }
            for goal in goals
        ]
    }
