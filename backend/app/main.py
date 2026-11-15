import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import router


load_dotenv()


app = FastAPI(
    title="NutriWise API",
    version="1.0.0",
    description="Explainable packaged-food nutrition analysis backed by locally collected CSV data.",
)

origins = [item.strip() for item in os.getenv("NUTRIWISE_CORS_ORIGINS", "http://localhost:5173").split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(router)
