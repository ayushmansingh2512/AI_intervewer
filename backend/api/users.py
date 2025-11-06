from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas
from backend.database import get_db
from backend.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user
