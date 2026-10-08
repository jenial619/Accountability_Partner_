from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models import Task, Goal, User
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


# ---------------------------------------------------------
# CREATE TASK
# ---------------------------------------------------------

@router.post("/{goal_id}")
def create_task(
    goal_id: int,
    title: str,
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

    task = Task(
        title=title,
        goal_id=goal_id,
        completed=False
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# ---------------------------------------------------------
# GET TASKS FOR A GOAL
# ---------------------------------------------------------

@router.get("/{goal_id}")
def get_tasks(
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

    tasks = (
        db.query(Task)
        .filter(Task.goal_id == goal_id)
        .all()
    )

    return tasks


# ---------------------------------------------------------
# UPDATE TASK COMPLETION
# ---------------------------------------------------------

@router.put("/{task_id}")
def update_task(
    task_id: int,
    completed: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(Task)
        .join(Goal)
        .filter(
            Task.id == task_id,
            Goal.user_id == current_user.id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    task.completed = completed

    # Record the exact time when the task is completed
    if completed:
        task.completed_at = datetime.now(timezone.utc)
    else:
        # Remove completion time when task is unchecked
        task.completed_at = None

    db.commit()
    db.refresh(task)

    return task


# ---------------------------------------------------------
# GET PARTNER STREAK
# ---------------------------------------------------------

@router.get("/partner/{user_id}/streak")
def get_partner_streak(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check whether the partner/user exists
    partner = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not partner:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Get all goals belonging to the partner
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == user_id)
        .all()
    )

    goal_ids = [goal.id for goal in goals]

    if not goal_ids:
        return {
            "streak": 0
        }

    # Get all completed tasks that have a completion date
    tasks = (
        db.query(Task)
        .filter(
            Task.goal_id.in_(goal_ids),
            Task.completed == True,
            Task.completed_at.isnot(None)
        )
        .all()
    )

    if not tasks:
        return {
            "streak": 0
        }

    # Get unique dates on which the partner completed tasks
    completed_dates = {
        task.completed_at.date()
        for task in tasks
    }

    # Current date in UTC
    today = datetime.now(timezone.utc).date()

    streak = 0
    current_date = today

    # If nothing was completed today,
    # allow the streak to continue from yesterday.
    if current_date not in completed_dates:

        yesterday = today - timedelta(days=1)

        if yesterday in completed_dates:
            current_date = yesterday
        else:
            return {
                "streak": 0
            }

    # Count consecutive completed days
    while current_date in completed_dates:
        streak += 1
        current_date -= timedelta(days=1)

    return {
        "streak": streak
    }


# ---------------------------------------------------------
# DELETE TASK
# ---------------------------------------------------------

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = (
        db.query(Task)
        .join(Goal)
        .filter(
            Task.id == task_id,
            Goal.user_id == current_user.id
        )
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }