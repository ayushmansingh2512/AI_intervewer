from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.compony_api import schemas, auth
from backend.database import get_db

router = APIRouter()

@router.get("/me", response_model=schemas.Company)
def read_companies_me(current_company: schemas.Company = Depends(auth.get_current_company)):
    return current_company
