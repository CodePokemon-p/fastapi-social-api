from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    is_blocked: bool

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    body: str

class PostResponse(BaseModel):
    id: int
    body: str
    user_id: int
    username: str
    likes_count: int = 0      # <-- Add
    is_liked: bool = False    # <-- Add
    allow_comments: bool
    created_at: datetime

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    body: str

class CommentResponse(BaseModel):
    id: int
    body: str
    post_id: int
    user_id: int
    is_pinned: bool
    username: str
    created_at: datetime

    class Config:
        from_attributes = True