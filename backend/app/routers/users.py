from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Goal, Task
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "created_at": current_user.created_at
    }


@router.get("/me/stats")
def get_profile_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get this user's goals
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .all()
    )

    total_goals = len(goals)

    # Goals with 100% progress
    completed_goals = sum(
        1 for goal in goals
        if goal.progress >= 100
    )

    # Calculate overall goal success
    if total_goals > 0:
        goal_success = round(
            sum(goal.progress for goal in goals) / total_goals
        )
    else:
        goal_success = 0

    # Get tasks belonging to this user's goals
    goal_ids = [goal.id for goal in goals]

    if goal_ids:
        tasks = (
            db.query(Task)
            .filter(Task.goal_id.in_(goal_ids))
            .all()
        )
    else:
        tasks = []

    total_tasks = len(tasks)

    completed_tasks = sum(
        1 for task in tasks
        if task.completed
    )

    return {
        "total_goals": total_goals,
        "completed_goals": completed_goals,
        "goal_success": goal_success,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks
    }