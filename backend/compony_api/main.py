from fastapi import APIRouter

from . import auth_routes, company_routes, interview_routes, resume_routes

router = APIRouter()

router.include_router(auth_routes.router, tags=["company-auth"])
router.include_router(company_routes.router, tags=["company"])
router.include_router(interview_routes.router, tags=["company-interview"])
router.include_router(resume_routes.router, tags=["company-resume"])