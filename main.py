from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import engine, get_db

# Create the tables in Postgres if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Social Media API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. AUTHENTICATION (Register & Login)


@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password and save
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        role="user"  # Default role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find user by username
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Account is blocked by Admin")

    # Create token
    access_token = auth.create_access_token(data={
        "sub": user.username,
        "id": user.id,
        "role": user.role
    })
    return {"access_token": access_token, "token_type": "bearer"}


# 2. ADMIN ROUTES


@app.get("/admin/users", response_model=List[schemas.UserResponse])
def list_logged_in_users(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    # For simplicity, this lists all users (assuming "logged in" means registered)
    return db.query(models.User).all()

@app.put("/admin/users/{user_id}/block")
def block_user(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle block status
    user.is_blocked = not user.is_blocked
    db.commit()
    return {"message": f"User {user.username} blocked status: {user.is_blocked}"}

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}



# 3. POST ROUTES


@app.post("/posts", response_model=schemas.PostResponse)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_post = models.Post(body=post.body, user_id=current_user.id)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@app.get("/users/me/posts", response_model=List[schemas.PostResponse])
def list_my_posts(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Post).filter(models.Post.user_id == current_user.id).all()

@app.get("/posts", response_model=List[schemas.PostResponse])
def list_all_posts(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    # Public route, pagination included
    return db.query(models.Post).offset(skip).limit(limit).all()

@app.put("/posts/{post_id}/allow-comments")
def toggle_comments(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only Admin or Post Owner can do this
    if current_user.role != "admin" and post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to change settings on this post")

    post.allow_comments = not post.allow_comments
    db.commit()
    return {"message": f"Comments allowed: {post.allow_comments}"}



# 4. LIKE ROUTES


@app.post("/posts/{post_id}/like")
def like_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if already liked
    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id, 
        models.Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Post already liked")

    new_like = models.Like(post_id=post_id, user_id=current_user.id)
    db.add(new_like)
    db.commit()
    return {"message": "Post liked"}

@app.delete("/posts/{post_id}/like")
def unlike_post(post_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    like = db.query(models.Like).filter(
        models.Like.post_id == post_id, 
        models.Like.user_id == current_user.id
    ).first()
    
    if not like:
        raise HTTPException(status_code=400, detail="You have not liked this post")

    db.delete(like)
    db.commit()
    return {"message": "Post unliked"}



# 5. COMMENT ROUTES


@app.post("/posts/{post_id}/comments", response_model=schemas.CommentResponse)
def create_comment(post_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if not post.allow_comments:
        raise HTTPException(status_code=403, detail="Comments are disabled for this post")

    new_comment = models.Comment(post_id=post_id, user_id=current_user.id, body=comment.body)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@app.get("/posts/{post_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments(post_id: int, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    # Public route, pagination included
    return db.query(models.Comment).filter(models.Comment.post_id == post_id).offset(skip).limit(limit).all()

@app.put("/comments/{comment_id}", response_model=schemas.CommentResponse)
def edit_comment(comment_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if db_comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own comments")

    db_comment.body = comment.body
    db.commit()
    db.refresh(db_comment)
    return db_comment

@app.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    post = db.query(models.Post).filter(models.Post.id == db_comment.post_id).first()

    # Author, Post Owner, or Admin can delete
    if db_comment.user_id != current_user.id and post.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(db_comment)
    db.commit()
    return {"message": "Comment deleted"}

@app.put("/comments/{comment_id}/pin")
def pin_comment(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    post = db.query(models.Post).filter(models.Post.id == db_comment.post_id).first()

    # ONLY the Post Owner can pin comments
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the post owner can pin comments")

    db_comment.is_pinned = not db_comment.is_pinned
    db.commit()
    return {"message": f"Comment pinned status: {db_comment.is_pinned}"}