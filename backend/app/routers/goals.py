from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Goal, User
from app.schemas import GoalCreate, GoalResponse
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/goals",
    tags=["Goals"]
)


# Create a goal
@router.post("/", response_model=GoalResponse)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_goal = Goal(
        title=goal.title,
        description=goal.description,
        category=goal.category,
        progress=goal.progress,
        deadline=goal.deadline,
        tasks=goal.tasks,
        user_id=current_user.id
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return new_goal


# Get all goals of logged-in user
@router.get("/", response_model=list[GoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .all()
    )

    return goals
# Get one goal
@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    return goal


# Update a goal
@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    goal.title = goal_data.title
    goal.description = goal_data.description
    goal.category = goal_data.category
    goal.progress = goal_data.progress
    goal.deadline = goal_data.deadline
    goal.tasks = goal_data.tasks

    db.commit()
    db.refresh(goal)

    return goal


# Delete a goal
@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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

    db.delete(goal)
    db.commit()

    return {
        "message": "Goal deleted successfully"
    }