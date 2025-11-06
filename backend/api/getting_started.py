from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from backend import crud, schemas, auth
from backend.database import get_db

def getting_started(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if not user.password or len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not user.first_name or not user.first_name.strip():
        raise HTTPException(status_code=400, detail="First name cannot be empty")
    if not user.last_name or not user.last_name.strip():
        raise HTTPException(status_code=400, detail="Last name cannot be empty")

    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not db_user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")

    crud.update_user(db=db, user=user)
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
