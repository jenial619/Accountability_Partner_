from datetime import date, timedelta
from contextlib import asynccontextmanager
import logging
import secrets
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.config import FRONTEND_ORIGINS, MAX_GROUP_MEMBERS
from app.database import Base, engine, get_db
from app.models import (
    AccountabilityGroup,
    DailyCheckIn,
    Encouragement,
    Goal,
    Membership,
    User,
)
from app.schemas import (
    CheckInCreate,
    EncouragementCreate,
    GoalCreate,
    GoalUpdate,
    GroupCreate,
    GroupJoin,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.security import create_access_token, get_current_user, hash_password, verify_password


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("saathi.api")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Saathi Accountability API",
    description="Daily goals, opt-in accountability circles, streaks, and encouragement.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
def user_payload(user: User) -> dict[str, Any]:
    return {"id": user.id, "name": user.name, "email": user.email}


def owned_goal(db: Session, goal_id: int, user_id: int) -> Goal:
    goal = db.scalar(select(Goal).where(Goal.id == goal_id, Goal.owner_id == user_id))
    if goal is None:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return goal


def unassigned_goal(db: Session, goal_id: int, user_id: int) -> Goal:
    goal = owned_goal(db, goal_id, user_id)
    if not goal.is_active:
        raise HTTPException(status_code=409, detail="This goal is archived.")
    membership = db.scalar(select(Membership).where(Membership.goal_id == goal_id))
    if membership is not None:
        raise HTTPException(status_code=409, detail="This goal already belongs to an accountability circle.")
    return goal


def membership_for_user(db: Session, group_id: int, user_id: int) -> Membership:
    member = db.scalar(
        select(Membership)
        .options(joinedload(Membership.user), joinedload(Membership.goal))
        .where(Membership.group_id == group_id, Membership.user_id == user_id)
    )
    if member is None:
        raise HTTPException(status_code=403, detail="Join this circle before viewing its activity.")
    return member


def streak_for_dates(check_in_dates: set[date], today: date) -> int:
    cursor = today if today in check_in_dates else today - timedelta(days=1)
    count = 0
    while cursor in check_in_dates:
        count += 1
        cursor -= timedelta(days=1)
    return count


def serialize_group(db: Session, group: AccountabilityGroup, current_user_id: int) -> dict[str, Any]:
    memberships = db.scalars(
        select(Membership)
        .options(joinedload(Membership.user), joinedload(Membership.goal))
        .where(Membership.group_id == group.id)
        .order_by(Membership.joined_at)
    ).all()
    if not any(member.user_id == current_user_id for member in memberships):
        raise HTTPException(status_code=403, detail="Join this circle before viewing its activity.")

    check_ins = db.scalars(
        select(DailyCheckIn)
        .options(joinedload(DailyCheckIn.membership))
        .where(DailyCheckIn.group_id == group.id)
        .order_by(DailyCheckIn.check_in_date.desc())
    ).all()
    check_ins_by_member: dict[int, set[date]] = {member.id: set() for member in memberships}
    for check_in in check_ins:
        check_ins_by_member[check_in.membership_id].add(check_in.check_in_date)

    coach_points_by_user = dict(
        db.query(Encouragement.sender_id, func.count(Encouragement.id))
        .filter(Encouragement.coach_point_awarded.is_(True))
        .group_by(Encouragement.sender_id)
        .all()
    )
    today = date.today()
    member_payloads = []
    for member in memberships:
        dates = check_ins_by_member[member.id]
        member_payloads.append(
            {
                "user_id": member.user_id,
                "membership_id": member.id,
                "name": member.user.name,
                "goal": {
                    "id": member.goal.id,
                    "title": member.goal.title,
                    "category": member.goal.category,
                    "description": member.goal.description,
                    "daily_target": member.goal.daily_target,
                },
                "today_completed": today in dates,
                "streak": streak_for_dates(dates, today),
                "coach_points": int(coach_points_by_user.get(member.user_id, 0)),
                "check_in_dates": sorted(item.isoformat() for item in dates if item >= today - timedelta(days=6)),
            }
        )

    members_complete_by_date: dict[date, set[int]] = {}
    for check_in in check_ins:
        members_complete_by_date.setdefault(check_in.check_in_date, set()).add(check_in.membership_id)
    complete_days = {
        check_in_date
        for check_in_date, member_ids in members_complete_by_date.items()
        if len(member_ids) == len(memberships)
    }
    team_streak = streak_for_dates(complete_days, today) if len(memberships) >= 2 else 0

    encouragements = db.scalars(
        select(Encouragement)
        .options(joinedload(Encouragement.sender), joinedload(Encouragement.recipient))
        .where(Encouragement.group_id == group.id)
        .order_by(Encouragement.created_at.desc())
        .limit(10)
    ).all()
    return {
        "id": group.id,
        "name": group.name,
        "invite_code": group.invite_code,
        "member_count": len(memberships),
        "max_members": MAX_GROUP_MEMBERS,
        "team_streak": team_streak,
        "today": today.isoformat(),
        "members": member_payloads,
        "encouragements": [
            {
                "id": item.id,
                "sender_id": item.sender_id,
                "sender_name": item.sender.name,
                "recipient_id": item.recipient_id,
                "recipient_name": item.recipient.name,
                "message": item.message,
                "coach_point_awarded": item.coach_point_awarded,
                "created_at": item.created_at.isoformat(),
            }
            for item in encouragements
        ],
    }


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    normalized_email = str(payload.email).strip().lower()
    if db.scalar(select(User.id).where(User.email == normalized_email)) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(name=payload.name, email=normalized_email, password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from error
    db.refresh(user)
    return {"access_token": create_access_token(user.id), "user": user_payload(user)}


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    user = db.scalar(select(User).where(User.email == str(payload.email).strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return {"access_token": create_access_token(user.id), "user": user_payload(user)}


@app.get("/api/auth/me", response_model=UserResponse)
def current_account(user: User = Depends(get_current_user)) -> dict[str, Any]:
    return user_payload(user)


@app.get("/api/goals")
def list_goals(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    goals = db.scalars(
        select(Goal).where(Goal.owner_id == user.id, Goal.is_active.is_(True)).order_by(Goal.created_at.desc())
    ).all()
    membership_goal_ids = set(db.scalars(select(Membership.goal_id)).all())
    return [
        {
            "id": goal.id,
            "title": goal.title,
            "category": goal.category,
            "description": goal.description,
            "daily_target": goal.daily_target,
            "in_circle": goal.id in membership_goal_ids,
        }
        for goal in goals
    ]


@app.post("/api/goals", status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    goal = Goal(owner_id=user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {"id": goal.id, **payload.model_dump(), "in_circle": False}


@app.patch("/api/goals/{goal_id}")
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    goal = owned_goal(db, goal_id, user.id)
    if db.scalar(select(Membership.id).where(Membership.goal_id == goal_id)) is not None:
        raise HTTPException(status_code=409, detail="A goal in an active circle cannot be changed.")
    for field, value in payload.model_dump().items():
        setattr(goal, field, value)
    db.commit()
    return {"id": goal.id, **payload.model_dump(), "in_circle": False}


@app.delete("/api/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    goal = owned_goal(db, goal_id, user.id)
    if db.scalar(select(Membership.id).where(Membership.goal_id == goal_id)) is not None:
        raise HTTPException(status_code=409, detail="Leave its accountability circle before deleting this goal.")
    goal.is_active = False
    db.commit()


@app.get("/api/matches")
def find_matches(
    goal_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    goal = unassigned_goal(db, goal_id, user.id)
    paired_goal_ids = select(Membership.goal_id)
    candidates = db.scalars(
        select(Goal)
        .options(joinedload(Goal.owner))
        .where(
            Goal.owner_id != user.id,
            Goal.is_active.is_(True),
            Goal.id.not_in(paired_goal_ids),
        )
    ).all()
    if not candidates:
        return []

    documents = [
        f"{goal.category} {goal.title} {goal.description} {goal.daily_target}",
        *[
            f"{candidate.category} {candidate.title} {candidate.description} {candidate.daily_target}"
            for candidate in candidates
        ],
    ]
    matrix = TfidfVectorizer(ngram_range=(1, 2), stop_words="english").fit_transform(documents)
    similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
    results = []
    for candidate, similarity in zip(candidates, similarities, strict=True):
        score = min(1.0, float(similarity) * 0.75 + (0.25 if candidate.category.casefold() == goal.category.casefold() else 0))
        results.append(
            {
                "user_id": candidate.owner.id,
                "name": candidate.owner.name,
                "goal": {
                    "id": candidate.id,
                    "title": candidate.title,
                    "category": candidate.category,
                    "description": candidate.description,
                    "daily_target": candidate.daily_target,
                },
                "match_score": round(score * 100),
            }
        )
    return sorted(results, key=lambda match: (-match["match_score"], match["name"].casefold()))[:20]


@app.get("/api/groups")
def list_groups(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    groups = db.scalars(
        select(AccountabilityGroup)
        .join(Membership)
        .where(Membership.user_id == user.id, AccountabilityGroup.is_active.is_(True))
        .order_by(AccountabilityGroup.created_at.desc())
    ).all()
    return [serialize_group(db, group, user.id) for group in groups]


@app.post("/api/groups", status_code=status.HTTP_201_CREATED)
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    unassigned_goal(db, payload.goal_id, user.id)
    code = secrets.token_urlsafe(7).replace("-", "").replace("_", "").upper()[:10]
    group = AccountabilityGroup(name=payload.name, invite_code=code, created_by_id=user.id)
    db.add(group)
    db.flush()
    db.add(Membership(group_id=group.id, user_id=user.id, goal_id=payload.goal_id))
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        logger.exception("Could not create accountability circle.")
        raise HTTPException(status_code=409, detail="Could not create this circle. Please try again.") from error
    db.refresh(group)
    return serialize_group(db, group, user.id)


@app.post("/api/groups/join", status_code=status.HTTP_201_CREATED)
def join_group(
    payload: GroupJoin,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    goal = unassigned_goal(db, payload.goal_id, user.id)
    group = db.scalar(
        select(AccountabilityGroup)
        .where(
            AccountabilityGroup.invite_code == payload.invite_code.upper(),
            AccountabilityGroup.is_active.is_(True),
        )
    )
    if group is None:
        raise HTTPException(status_code=404, detail="That invite code is invalid or the circle is closed.")
    members = db.scalars(select(Membership).where(Membership.group_id == group.id)).all()
    if any(member.user_id == user.id for member in members):
        raise HTTPException(status_code=409, detail="You already belong to this circle.")
    if len(members) >= MAX_GROUP_MEMBERS:
        raise HTTPException(status_code=409, detail="This accountability circle is full.")
    db.add(Membership(group_id=group.id, user_id=user.id, goal_id=goal.id))
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="This goal is already connected to a circle.") from error
    return serialize_group(db, group, user.id)


@app.get("/api/groups/{group_id}")
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    group = db.get(AccountabilityGroup, group_id)
    if group is None:
        raise HTTPException(status_code=404, detail="Circle not found.")
    return serialize_group(db, group, user.id)


@app.delete("/api/groups/{group_id}/membership", status_code=status.HTTP_204_NO_CONTENT)
def leave_group(
    group_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    member = membership_for_user(db, group_id, user.id)
    group = db.get(AccountabilityGroup, group_id)
    db.execute(delete(DailyCheckIn).where(DailyCheckIn.membership_id == member.id))
    db.execute(
        delete(Encouragement).where(
            Encouragement.group_id == group_id,
            or_(Encouragement.sender_id == user.id, Encouragement.recipient_id == user.id),
        )
    )
    db.delete(member)
    db.flush()
    remaining_members = db.scalar(
        select(func.count(Membership.id)).where(Membership.group_id == group_id)
    )
    if remaining_members == 0:
        group.is_active = False
    db.commit()


@app.post("/api/groups/{group_id}/check-ins", status_code=status.HTTP_201_CREATED)
def create_check_in(
    group_id: int,
    payload: CheckInCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    membership = membership_for_user(db, group_id, user.id)
    today = date.today()
    check_in = db.scalar(
        select(DailyCheckIn).where(
            DailyCheckIn.membership_id == membership.id,
            DailyCheckIn.check_in_date == today,
        )
    )
    if check_in is not None:
        raise HTTPException(status_code=409, detail="You have already checked in for today.")
    check_in = DailyCheckIn(
        group_id=group_id,
        membership_id=membership.id,
        check_in_date=today,
        note=payload.note,
    )
    db.add(check_in)
    nudges = db.scalars(
        select(Encouragement).where(
            Encouragement.group_id == group_id,
            Encouragement.recipient_id == user.id,
            Encouragement.encouragement_date == today,
            Encouragement.coach_point_awarded.is_(False),
        )
    ).all()
    for nudge in nudges:
        nudge.coach_point_awarded = True
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already checked in for today.") from error
    return {"date": today.isoformat(), "completed": True, "note": check_in.note}


@app.post("/api/groups/{group_id}/encouragements", status_code=status.HTTP_201_CREATED)
def encourage_member(
    group_id: int,
    payload: EncouragementCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    membership_for_user(db, group_id, user.id)
    recipient_membership = db.scalar(
        select(Membership)
        .options(joinedload(Membership.user))
        .where(Membership.group_id == group_id, Membership.user_id == payload.recipient_id)
    )
    if recipient_membership is None:
        raise HTTPException(status_code=404, detail="That person is not in this circle.")
    if payload.recipient_id == user.id:
        raise HTTPException(status_code=422, detail="Send encouragement to a circle partner.")
    encouragement = Encouragement(
        group_id=group_id,
        sender_id=user.id,
        recipient_id=payload.recipient_id,
        message=payload.message,
    )
    db.add(encouragement)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="You have already encouraged this partner today.",
        ) from error
    db.refresh(encouragement)
    return {
        "id": encouragement.id,
        "sender_id": user.id,
        "sender_name": user.name,
        "recipient_id": recipient_membership.user.id,
        "recipient_name": recipient_membership.user.name,
        "message": encouragement.message,
        "coach_point_awarded": encouragement.coach_point_awarded,
        "created_at": encouragement.created_at.isoformat(),
    }
