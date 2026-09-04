from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as cases_router

app = FastAPI(
    title="NyayaGraph-GN API",
    description="AI Criminal Network Profiler & Detective Workbench (SIH26189)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases_router)

@app.get("/")
def read_root():
    return {
        "system": "NyayaGraph-GN",
        "tagline": "AI Criminal Network Profiler & Detective Workbench",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "sample_analysis": "/api/v1/cases/sample",
            "process_custom_case": "/api/v1/cases/process",
            "health": "/api/v1/health"
        }
    }

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "FastAPI + NetworkX + Louvain + Pydantic",
        "bsa_section": "BSA 2023 Section 63(4) Evidence Ledger Ready",
    }
