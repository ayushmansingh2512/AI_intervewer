
from sqlalchemy.orm import Session
from backend import model, schemas
from backend.auth import get_password_hash

def get_user_by_email(db: Session, email: str):
    return db.query(model.User).filter(model.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = None
    if user.password:
        hashed_password = get_password_hash(user.password)
    db_user = model.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_google_user(db: Session, user_info: dict):
    db_user = model.User(
        email=user_info["email"],
        first_name=user_info.get("given_name"),
        last_name=user_info.get("family_name"),
        is_google_user=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_user(db: Session, email: str):
    db_user = get_user_by_email(db, email)
    if db_user:
        db_user.is_verified = True
        db.commit()
    return db_user

def update_user(db: Session, user: schemas.UserCreate):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        if user.password:
            db_user.hashed_password = get_password_hash(user.password)
        if user.first_name:
            db_user.first_name = user.first_name
        if user.last_name:
            db_user.last_name = user.last_name
        db.commit()
        db.refresh(db_user)
    return db_user