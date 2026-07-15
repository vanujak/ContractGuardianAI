import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import contracts, chat

# Create tables in database on startup
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing database tables: {str(e)}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Secure AI workspace for contract risk assessment, negotiation, compliance audit, and RAG QA.",
    version="1.0.0"
)

# CORS Configuration
# Allows requests from Next.js (usually runs on port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to your Next.js domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(contracts.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
