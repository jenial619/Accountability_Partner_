from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints


Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
Text = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class RegisterRequest(BaseModel):
    name: Name
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]


class GoalCreate(BaseModel):
    title: Title
    category: Literal["Health", "Learning", "Career", "Build", "Personal Growth", "Other"]
    description: Text = ""
    daily_target: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]


class GoalUpdate(GoalCreate):
    pass


class GroupCreate(BaseModel):
    name: Title
    goal_id: int = Field(gt=0)


class GroupJoin(BaseModel):
    invite_code: Annotated[str, StringConstraints(strip_whitespace=True, min_length=6, max_length=16)]
    goal_id: int = Field(gt=0)


class CheckInCreate(BaseModel):
    note: Annotated[str, StringConstraints(strip_whitespace=True, max_length=240)] = ""


class EncouragementCreate(BaseModel):
    recipient_id: int = Field(gt=0)
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=240)]


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: str
    description: str
    daily_target: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
