from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True

class GoalCreate(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    progress: int = 0
    deadline: str | None = None
    tasks: str | None = None


class GoalResponse(BaseModel):
    id: int
    title: str
    description: str | None
    category: str | None
    progress: int
    deadline: str | None
    tasks: str | None
    user_id: int

    class Config:
        from_attributes = True